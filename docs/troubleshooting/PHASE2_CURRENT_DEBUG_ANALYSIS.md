# 🔴 Phase 2 매칭 실패 원인 분석 (현재 진행 중)

> **작성일:** 2026-03-11
> **상태:** 🔴 매칭 9/41 문제 진행 중
> **코드 기반:** 실제 구현 코드 분석

---

## 📊 **현황**

```
증상: 41건 중 9건만 매칭됨 (22%)

예상: 기존 분석에서 3가지 버그를 수정했는데도 안 됨
```

---

## 🔍 **코드 분석: 실제 구현된 부분**

### **1단계: Widget에서 데이터 Fetch (ledger-import-widget.tsx L70-75)**

```typescript
const { data: txs } = await supabase
  .from("transactions")
  .select("*")
  .ilike("description", "%카카오%")           // ← 범위 확대 ✓
  .not("description", "ilike", "%뱅크%")      // ← 뱅크 제외 ✓
  .is("breakdown_source_id", null);           // ← breakdown 아닌 거래만
```

**평가:** ✅ 올바르게 수정됨

---

### **2단계: 데이터 변환 (ledger-import-widget.tsx L79-86)**

```typescript
const kakaoRows = result.transactions.map(t => ({
  date: t.date.split('T')[0].replace(/-/g, '.'),  // "2026-02-14" → "2026.02.14"
  time: t.date.split('T')[1] || '',
  type: (t.source_raw_data as any)?.raw_type || '',
  amount: Math.abs(t.amount),
  merchant: t.description,
  currency: 'KRW'
}));
```

**문제 발견! 🚨**
```
// 여기서 date 형식을 역변환하고 있음
date: t.date.split('T')[0].replace(/-/g, '.')

예:
  입력: "2026-02-14T00:00:00Z" (DB 포맷)
  처리: "2026-02-14" → "2026.02.14" (점으로 변환)
  결과: "2026.02.14" (카카오페이 원본 형식)

하지만 matcher.ts에서:
  const formattedRowDate = row.date.replace(/\./g, '-');
  // "2026.02.14" → "2026-02-14"로 다시 변환

이건 원래 형식대로인데... 뭔가 이상한가?
```

---

### **3단계: Matcher 로직 (matcher.ts L26-44)**

```typescript
const matches = kakaoPayRows.filter((row) => {
  const matchAmount = Math.abs(row.amount) === Math.abs(tx.amount);

  const formattedRowDate = row.date.replace(/\./g, '-');

  const txDate = new Date(tx.date);
  const rowDate = new Date(formattedRowDate);

  // UTC 자정 강제
  const txZero = new Date(Date.UTC(txDate.getFullYear(), txDate.getMonth(), txDate.getDate()));
  const rowZero = new Date(Date.UTC(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate()));

  const diffTime = Math.abs(txZero.getTime() - rowZero.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return matchAmount && diffDays <= 1;
});
```

---

## 🐛 **발견된 문제점 3가지**

### **문제 1: Date 생성 방식 오류 ⚠️ 핵심**

```typescript
// 기존 코드:
const txDate = new Date(tx.date);              // "2026-02-14T00:00:00Z"
const rowDate = new Date(formattedRowDate);    // "2026-02-14" (ISO 형식 아님!)

// 문제:
new Date("2026-02-14")
  → 브라우저 환경에서 로컬 타임존으로 파싱
  → 예: PST면 "2026-02-14 00:00:00 PST"
  → UTC로 변환하면 "2026-02-14 08:00:00Z"
  → 실제로는 "2026-02-14 00:00:00Z"와 8시간 오차 발생!

getFullYear(), getMonth(), getDate() 사용:
  new Date("2026-02-14").getFullYear()  → 2026
  new Date("2026-02-14").getMonth()     → 1 (실제로는 2월인데 getMonth()는 0-based!)
  new Date("2026-02-14").getDate()      → 14

결과: Date.UTC(2026, 1, 14) = "2026-02-14T00:00:00Z" ✓ (맞음)

하지만:
  new Date("2026-02-14") 파싱 자체가 불안정함
```

### **해결책 1: ISO 8601 형식 강제**

```typescript
// 수정 전:
const rowDate = new Date(formattedRowDate);  // "2026-02-14"

// 수정 후:
const rowDate = new Date(formattedRowDate + 'T00:00:00Z');  // "2026-02-14T00:00:00Z"
```

---

### **문제 2: 금액 비교 로직**

```typescript
const matchAmount = Math.abs(row.amount) === Math.abs(tx.amount);
```

**문제점:**
```
row.amount: parseAmount()에서 처리 → 정수
tx.amount: DB에서 꺼낸 값 → 소수점 있을 수 있음

예:
  row.amount = 10000 (parseAmount 처리)
  tx.amount = 10000.00 (DB float)

  10000 === 10000.00 → true (JavaScript에서는 같음)

하지만 floating point 오차 가능성:
  10000.001 === 10000? → false

해결책: 정수 변환 후 비교
  Math.round(Math.abs(row.amount)) === Math.round(Math.abs(tx.amount))
```

---

### **문제 3: 매칭 결과가 없는 경우**

```typescript
if (matches.length === 1) {
  results.push(...)
} else if (matches.length > 1) {
  results.push(...)
}
// else if (matches.length === 0) → 아무것도 안 함!
```

**결과:**
```
매칭 후보가 0건이면 그냥 버려짐
사용자에게 피드백 없음
```

---

## 🔧 **실제 수정 코드**

### **matcher.ts 수정안**

```typescript
export const matchKakaoTransactions = async (
  unmatchedTransactions: any[],
  kakaoPayRows: KakaoPayRow[]
): Promise<MatchResult[]> => {
  const results: MatchResult[] = [];
  const debug: any[] = [];  // 디버깅용

  for (const tx of unmatchedTransactions) {
    const desc = tx.description || '';
    const isKakaoName = desc.includes('카카오') && !desc.includes('뱅크');

    if (!isKakaoName) continue;

    // ⭐ 수정 1: 금액 정수 변환
    const txAmount = Math.round(Math.abs(tx.amount));

    const matches = kakaoPayRows.filter((row) => {
      const rowAmount = Math.round(Math.abs(row.amount));

      // ⭐ 수정 2: ISO 8601 형식 강제
      const formattedRowDate = row.date.replace(/\./g, '-');
      const isoRowDate = formattedRowDate + 'T00:00:00Z';

      const txDate = new Date(tx.date);
      const rowDate = new Date(isoRowDate);

      // UTC 자정으로 통일
      const txZero = new Date(Date.UTC(
        txDate.getUTCFullYear(),
        txDate.getUTCMonth(),
        txDate.getUTCDate()
      ));
      const rowZero = new Date(Date.UTC(
        rowDate.getUTCFullYear(),
        rowDate.getUTCMonth(),
        rowDate.getUTCDate()
      ));

      const diffTime = Math.abs(txZero.getTime() - rowZero.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const matchAmount = rowAmount === txAmount;
      const matchDate = diffDays === 0;  // "<=1"이 아니라 "===0" (정확히 같은 날짜)

      return matchAmount && matchDate;
    });

    // ⭐ 수정 3: 디버깅 정보 수집
    if (matches.length === 0) {
      debug.push({
        txId: tx.id,
        desc: desc,
        amount: txAmount,
        date: tx.date.split('T')[0],
        reason: '매칭 후보 없음'
      });
    }

    if (matches.length === 1) {
      results.push({
        transactionId: tx.id,
        kakaoPayRow: matches[0],
        confidence: 100,
      });
    } else if (matches.length > 1) {
      results.push({
        transactionId: tx.id,
        kakaoPayRow: matches[0],
        confidence: 50,
      });
      debug.push({
        txId: tx.id,
        reason: '중복 매칭: ' + matches.length + '건'
      });
    }
  }

  // 콘솔에 디버깅 정보 출력
  if (debug.length > 0) {
    console.warn('=== UNMATCHED TRANSACTIONS ===');
    console.table(debug);
  }

  return results;
};
```

---

## 📋 **체크리스트: 실제 확인해야 할 것**

브라우저 개발자 도구의 콘솔에서 다음을 확인하세요:

```javascript
// 1. DB 데이터 형식 확인
console.log('DB SAMPLE:', {
  date: '2026-02-14T00:00:00Z',      // 이런 형식인가?
  amount: 10000,                      // float인가? int인가?
  description: '카카오페이'           // 실제 텍스트는?
});

// 2. 카카오 CSV 데이터 형식 확인
console.log('KAKAO SAMPLE:', {
  date: '2026.02.14',                // 점 구분인가?
  amount: 10000,                      // 절대값인가?
  merchant: '쿠팡',                   // 상품명인가?
  type: '[-] 결제'                    // 거래 유형
});

// 3. Date 파싱 확인
const rowDate = new Date('2026-02-14');
console.log('Date parsed:', {
  input: '2026-02-14',
  parsed: rowDate,
  getFullYear: rowDate.getFullYear(),  // 2026?
  getMonth: rowDate.getMonth(),        // 1 (2월)인가?
  getDate: rowDate.getDate()           // 14?
});
```

---

## 🎯 **다음 단계**

### 1️⃣ **콘솔 로그 확인**

ledger-import-widget.tsx의 L88-97에서 이미 debug 로그가 있습니다:

```
=== KAKAO MATCHER DEBUG ===
DB TARGETS (txs count): ???
DB TARGETS SAMPLE: [...]
KAKAO ROWS (count): ???
KAKAO ROWS SAMPLE: [...]
MATCH RESULT COUNT: ???
===========================
```

**이 로그를 보고:**
- DB txs의 개수와 형식 확인
- kakaoRows의 개수와 형식 확인
- 실제 매칭되는 개수 확인

### 2️⃣ **위의 수정사항 적용**

```typescript
// matcher.ts 수정:
1. ISO 8601 형식 강제: + 'T00:00:00Z'
2. 금액 정수 변환: Math.round()
3. 날짜 일치 조건: diffDays === 0 (not <= 1)
4. 디버깅 정보 출력
```

### 3️⃣ **다시 테스트**

수정 후 다시 업로드해서 콘솔 로그 확인

---

## 📍 **의심되는 지점**

```
❌ 가능성 1: row.date 형식이 잘못됨
   → widget에서 "-"를 "."로 변환했는데
   → matcher에서 다시 "-"로 변환하고 있음

❌ 가능성 2: new Date() 파싱이 불안정함
   → ISO 8601 형식이 아니면 브라우저마다 다르게 파싱됨

❌ 가능성 3: 금액이 float인데 === 비교함
   → floating point 오차 가능성

❌ 가능성 4: diffDays <= 1 조건이 너무 느슨함
   → 의도하지 않은 거래도 매칭될 수 있음
   → === 0으로 정확히 같은 날짜만 매칭해야 함
```

---

## 🚀 **즉시 적용할 수 있는 수정**

현재 코드를 이 한 줄로 수정하세요:

```typescript
// matcher.ts L34 수정 전:
const rowDate = new Date(formattedRowDate);

// 수정 후:
const rowDate = new Date(formattedRowDate + 'T00:00:00Z');

// matcher.ts L43 수정 전:
return matchAmount && diffDays <= 1;

// 수정 후:
return matchAmount && diffDays === 0;  // 정확히 같은 날짜만
```

이 2줄 수정만으로도 매칭율이 높아질 가능성이 높습니다.

