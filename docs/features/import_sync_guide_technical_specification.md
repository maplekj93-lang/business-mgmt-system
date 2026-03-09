# 가계부 엑셀 임포트 동기화 가이드 기술 명세서 (Import Sync Guide Technical Spec)

> **작성일:** 2026-03-05
> **관련 문서:** `docs/features/import_sync_guide.md`
> **목표:** '가계부 엑셀 임포트 동기화 가이드' 기능의 구체적인 구현 방안 및 로직 명세

---

## 1. Database 스키마 변경 (Supabase 마이그레이션)

### 1.1 `assets` 테이블 변경
엑셀 임포트를 통한 가장 최근 동기화 성공 시점을 기록합니다.

```sql
-- assets 테이블에 마지막 동기화 일시 컬럼 추가
ALTER TABLE public.assets 
ADD COLUMN last_synced_at TIMESTAMPTZ;
```

### 1.2 `transactions` 테이블 변경
중복 데이터 방지(Idempotency) 및 수동/자동 입력 구분을 위한 컬럼을 추가합니다.

```sql
-- 중복 방지용 고유 해시 컬럼 (선택적으로 UNIQUE 제약조건 추가 가능)
ALTER TABLE public.transactions 
ADD COLUMN import_hash TEXT UNIQUE;

-- 입력 출처 컬럼 (MANUAL: 수동 입력, EXCEL: 엑셀 임포트)
ALTER TABLE public.transactions 
ADD COLUMN source TEXT DEFAULT 'MANUAL';

-- import_hash 인덱스 추가 (빠른 중복 체크용)
CREATE INDEX IF NOT EXISTS idx_transactions_import_hash ON public.transactions(import_hash);
```

### 1.3 `import_hash` 생성 규칙
동일한 결제 내역인지 식별하기 위한 해시 문자열 생성 규칙은 아래와 같이 정의합니다. 프론트엔드 또는 서버리스 함수에서 파싱 시 생성합니다.

```javascript
// 해시 생성 예시 (날짜 + 자산ID + 금액 + 적요)
const generateImportHash = (date, assetId, amount, description) => {
  // date는 YYYY-MM-DD 포맷으로 통일
  const rawString = `${date}_${assetId}_${amount}_${description}`;
  // 간단한 해시 함수를 거치거나 원본 문자열 자체를 고유 식별자로 사용
  // Supabase/PostgreSQL의 경우 MD5(rawString) 형태로 처리할 수도 있음
  return rawString; 
}
```

---

## 2. API 및 비즈니스 로직 (Backend/Server Action)

### 2.1 자산별 동기화 가이드 데이터 조회 쿼리

프론트엔드 UI에 진입할 때 실행될 쿼리입니다. 각 자산별로 마지막 거래일과 추천 시작일을 반환합니다.

```sql
-- RPC 함수를 만들거나 Server Action에서 아래 쿼리 기반으로 데이터 반환
SELECT 
  a.id AS asset_id,
  a.name AS asset_name, 
  a.type AS asset_type,
  a.last_synced_at,
  MAX(t.date) AS last_transaction_date,
  -- 추천 시작일: 마지막 거래일의 다음날 (안전을 위해 거래가 없어도 last_synced_at 다음날 비교도 가능)
  COALESCE(MAX(t.date) + INTERVAL '1 day', CURRENT_DATE) AS recommended_start_date
FROM public.assets a
LEFT JOIN public.transactions t ON a.id = t.asset_id
GROUP BY a.id, a.name, a.type, a.last_synced_at
ORDER BY a.type, a.name;
```

### 2.2 엑셀 데이터 임포트 및 중복 무시 (Bulk Upsert 로직)

엑셀 데이터를 파싱한 후 Supabase에 저장할 때의 흐름입니다.

1. **파싱 및 전처리:** 은행 엑셀 형식을 통일된 포맷(`date`, `amount`, `description` 등)으로 변환.
2. **해시 생성:** 각 row마다 `import_hash` 생성.
3. **벌크 저장 (Upsert):** `import_hash`를 기준으로 충돌(Conflict) 발생 시 무시하거나 덮어쓰기.

```javascript
// Supabase 클라이언트를 이용한 예시 로직
const { data, error } = await supabase
  .from('transactions')
  .upsert(
    parsedExcelData.map(row => ({
      asset_id: row.assetId,
      date: row.date,
      amount: row.amount,
      description: row.description,
      source: 'EXCEL',
      import_hash: generateImportHash(row.date, row.assetId, row.amount, row.description)
    })),
    { onConflict: 'import_hash', ignoreDuplicates: true } // 중복 발생 시 무시
  );

if (!error) {
    // 성공 시 자산의 마지막 동기화 시간 업데이트
    await supabase.from('assets').update({ last_synced_at: new Date().toISOString() }).eq('id', activeAssetId);
}
```

---

## 3. Frontend UI/UX (React Component)

### 3.1 `ImportSyncGuide` 컴포넌트

임포트 메인 화면 상단에 띄울 재사용 가능한 컴포넌트입니다.

```tsx
// 렌더링 예시 로직 (Pseudo Code)

// 1. 필요한 데이터를 fetch
const syncData = await fetchSyncGuideData();

// 2. 카드/통장 형태로 렌더링
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
  {syncData.map((asset) => {
    // 추천 시작일 계산 로직 포함
    const recommendedDate = calculateRecommendedDate(asset.last_transaction_date, asset.last_synced_at);
    
    return (
      <Card key={asset.asset_id} className="p-4 border">
        <div className="font-bold text-lg">{asset.asset_name}</div>
        <div className="text-sm text-gray-500 mt-2">
           마지막 거래일: {formatDate(asset.last_transaction_date) || '없음'}
        </div>
        <div className="text-sm text-gray-500">
           최근 동기화: {formatDateTime(asset.last_synced_at) || '기록 없음'}
        </div>
        <div className="mt-4 p-2 bg-blue-50 text-blue-700 rounded-md font-medium text-sm">
           👉 권장 다운로드: {formatDate(recommendedDate)} ~ 오늘
        </div>
        <Button 
           variant="outline" 
           size="sm" 
           className="mt-3 w-full" 
           onClick={() => openBankLink(asset.asset_name)}
        >
          {asset.asset_name} 뱅킹 바로가기
        </Button>
      </Card>
    );
  })}
</div>
```

---

## 4. 고려사항 해결 (Edge Case Handling) 요약

1. **시간대(Timezone) 통일:** 프론트에서 엑셀 문자열 파싱 시 모두 `YYYY-MM-DD`로 치환하고, 시/분/초는 버리거나 00:00:00 KST로 통일합니다. (이후 `import_hash` 생성의 일관성을 위함)
2. **미매입(Pending) 결제 건:** 권장 ダウン로드 날짜 UI 표시 시, 신용카드 자산의 경우 `오늘` 날짜는 제외하고 `어제`까지만 받으라는 경고성 Tooltip을 제공합니다.
3. **대량 업로드 트랜잭션:** 수백 건의 내역이 한 번에 `upsert` 되므로, 필요에 따라 100~200건씩 끊어서(Chunking) 삽입하는 방식을 채택합니다.
