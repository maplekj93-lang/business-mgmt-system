# 📊 결제 분류 아키텍처 (Payment Classification Architecture)

> **작성일:** 2026-03-11
> **목적:** 쿠팡과 카카오페이 같은 복합 결제 구조의 분류 체계를 정립
> **핵심 개념:** "1개 결제 = N개 내용" 문제를 2가지 도구로 해결

---

## 🎯 **핵심 문제 정의**

### Case 1: 쿠팡 (Coupang) — 다중 상품 1회 카드 결제
```
카드사 내역 (Card Statement):
  거래: "쿠팡" 50,000원 (2026-03-11)

실제 구성:
  ├─ 노트북: 30,000원 [Track B: 비즈니스 - 장비]
  ├─ 우유: 5,000원 [Track A: 생활비]
  └─ 생일 선물: 15,000원 [Track A: 경조/선물]

현재 문제점:
  → 카드사 내역에는 "쿠팡"으로만 표시
  → 가계부에 올리려면 각 항목별로 분해 필요
  → **사업용(비즈니스)과 개인용 섞임** ← 중복 지출 위험!
```

### Case 2: 카카오페이 (Kakao Pay) — 단일 결제 다중 거래 집계
```
카드사 내역 (Card Statement):
  거래: "카카오페이" 10,000원 (2026-03-11)

카카오페이 거래내역서 (Kakao Pay Export):
  ├─ 쿠팡: 7,000원
  └─ 배민: 3,000원

현재 문제점:
  → 카드사에선 "카카오페이"로만 표시 (가맹점 불명)
  → 실제 가맹점 정보는 카카오페이 앱/거래내역서에만 존재
  → **가맹점 매칭** 필요 (카카오페이 앱 내역과 연계)
```

---

## 🔧 **해결책: 2가지 독립 도구**

### **Tool A: 쿠팡 상세 내역 분해기 (Coupang Order Breakdown Tool)**

#### 📥 입력
- **원본**: 카드사 내역 1줄 ("쿠팡" 50,000원)
- **상세정보**: 쿠팡 주문 확인서 / 발송내역
  - 이메일 첨부, 앱 스크린샷, 또는 CSV 업로드

#### 🔄 처리 프로세스
```
Step 1: 쿠팡 주문서 파싱
  └─ 상품 리스트 추출 (상품명, 수량, 금액)

Step 2: 가계부 카테고리 매칭
  ├─ 노트북: [Track B] 비즈니스 > 장비
  ├─ 우유: [Track A] 물품구입비 > 생활필수품
  └─ 생일 선물: [Track A] 경조/선물 > 지인/친구

Step 3: 거래 분해 및 생성
  └─ 원본 카드 결제(50,000원) 1줄
      → 가계부 항목 3줄로 분산
         (각각 다른 카테고리 & 금액)

Step 4: Double Count Prevention 적용
  └─ "노트북" 항목: excluded_from_personal = true
     (사업비이므로 개인 지출 통계 제외)
```

#### 💾 저장 구조
```json
{
  "source_transaction": {
    "id": "tx_bank_12345",
    "amount": 50000,
    "description": "쿠팡",
    "date": "2026-03-11"
  },
  "breakdowns": [
    {
      "description": "노트북",
      "amount": 30000,
      "category": "비즈니스 > 장비",
      "excluded_from_personal": true,
      "track": "B"
    },
    {
      "description": "우유",
      "amount": 5000,
      "category": "물품구입비 > 생활필수품",
      "excluded_from_personal": false,
      "track": "A"
    },
    {
      "description": "생일 선물",
      "amount": 15000,
      "category": "경조/선물 > 지인/친구",
      "excluded_from_personal": false,
      "track": "A"
    }
  ]
}
```

#### 🎯 Key Features
- **수동 입력 옵션**: 상세정보 없을 때 사용자가 직접 입력
- **AI 보조**: 상품명 기반 자동 카테고리 제안 (Smart Tagging V2 연계)
- **추적 가능성**: 원본 카드 거래와 분해 항목 매핑 유지
- **Double Count 자동 처리**: 비즈니스 항목 자동 제외

---

### **Tool B: 카카오페이 가맹점 매퍼 (Kakao Pay Merchant Mapper)**

#### 📥 입력
- **카드사 내역**: "카카오페이" 10,000원 (2026-03-11)
- **카카오페이 거래내역서**: 고객센터 증명서 발급 기능으로 수령한 CSV/Excel
  - 컬럼: 거래일시, 거래구분, 거래금액, 계좌정보/결제정보

#### 🔄 처리 프로세스
```
Step 1: 카카오페이 내역서 파싱
  └─ 거래 유형별 분류:
     ├─ [+] 부족분충전: 충전 (Transfer)
     ├─ [-] 결제: 결제 (Expense)
     ├─ [-] 송금: 송금 (Expense)
     ├─ [+] 환급: 환급 (Refund)
     └─ [-] 수수료: 수수료 (Expense)

Step 2: 거래일 & 금액 매칭
  매자사 내역 (2026-03-11, 10,000원)
    ↓ [매칭]
  카카오페이 내역서:
    ├─ 2026-03-11 쿠팡 7,000원 ✓
    └─ 2026-03-11 배민 3,000원 ✓

Step 3: 가맹점명 추출
  └─ "카카오페이" → ["쿠팡", "배민"]

Step 4: 카테고리 자동 할당 (Smart Tagging V2)
  ├─ 쿠팡: "물품구입비" (또는 사용자 지정)
  └─ 배민: "식비 > 배달"

Step 5: Asset 흐름 기록
  └─ 은행 계좌 → 카카오페이 머니 (Transfer)
  └─ 카카오페이 머니 → 실제 가맹점 (Expense)
```

#### 💾 저장 구조
```json
{
  "source_transaction": {
    "id": "tx_bank_67890",
    "amount": 10000,
    "description": "카카오페이",
    "date": "2026-03-11",
    "asset_from": "IBK 계좌",
    "asset_to": "카카오페이 머니"
  },
  "kakao_export_rows": [
    {
      "date": "2026-03-11",
      "type": "[-] 결제",
      "merchant": "쿠팡",
      "amount": 7000
    },
    {
      "date": "2026-03-11",
      "type": "[-] 결제",
      "merchant": "배민",
      "amount": 3000
    }
  ],
  "matched_transactions": [
    {
      "description": "[카카오페이] 쿠팡",
      "amount": 7000,
      "category": "물품구입비 > 생활필수품",
      "source_asset": "카카오페이 머니",
      "excluded_from_personal": false
    },
    {
      "description": "[카카오페이] 배민",
      "amount": 3000,
      "category": "식비 > 배달",
      "source_asset": "카카오페이 머니",
      "excluded_from_personal": false
    }
  ]
}
```

#### 🎯 Key Features
- **자동 매칭**: 거래일 & 금액 자동 대조
- **거래 유형 분류**: 충전 vs 결제 vs 송금 자동 구분
- **Asset 흐름 추적**: 카카오페이 머니를 독립 자산으로 처리
- **데이터 검증**: 충전액 vs 지출액 불일치 감지
- **설명 추적**: "[카카오페이] 가맹점명" 형식으로 출처 명확화

---

## 🔗 **통합 플로우: 쿠팡 + 카카오페이 혼합 시나리오**

```
시나리오: 쿠팡에서 카카오페이로 결제한 경우

Step 1: 카드사 내역 임포트
  "카카오페이" 50,000원 (2026-03-11)

Step 2: 카카오페이 가맹점 매퍼 적용
  → "카카오페이" → "쿠팡" 50,000원 (가맹점 명확화)

Step 3: 쿠팡 상세 내역 분해기 적용 (선택)
  사용자가 쿠팡 주문서 업로드 시:
  → 쿠팡 50,000원
      ├─ 노트북: 30,000원 [비즈니스]
      ├─ 우유: 5,000원 [생활비]
      └─ 선물: 15,000원 [경조/선물]

Step 4: 최종 거래 기록
  ├─ 가계부 (Track A):
  │   ├─ 우유 5,000원 [생활비]
  │   └─ 선물 15,000원 [경조/선물]
  │
  └─ 사업비 (Track B):
      └─ 노트북 30,000원 [장비] (개인 통계 제외)
```

---

## 📋 **데이터베이스 스키마 영향**

### 기존 테이블 확장 (신규 컬럼)
```sql
-- transactions 테이블
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS breakdown_source_id UUID,  -- 분해 원본 거래 ID
ADD COLUMN IF NOT EXISTS kakao_pay_row_id VARCHAR,   -- 카카오페이 행 ID
ADD COLUMN IF NOT EXISTS excluded_from_personal BOOLEAN DEFAULT false;

-- assets_liabilities 테이블에 추가
INSERT INTO assets_liabilities (name, category, type)
VALUES ('카카오페이 머니', '현금·예금', 'asset');
```

### 신규 테이블: 분해 내역 추적
```sql
CREATE TABLE IF NOT EXISTS transaction_breakdowns (
  id UUID PRIMARY KEY,
  source_transaction_id UUID REFERENCES transactions(id),
  merchant_name VARCHAR,
  amount NUMERIC,
  category_id UUID REFERENCES mdt_categories(id),
  track CHAR(1),  -- 'A' (개인) or 'B' (비즈니스)
  excluded_from_personal BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kakao_pay_mappings (
  id UUID PRIMARY KEY,
  source_transaction_id UUID REFERENCES transactions(id),
  kakao_merchant_name VARCHAR,
  amount NUMERIC,
  kakao_type VARCHAR,  -- '[+] 부족분충전', '[-] 결제', 등
  matched_date TIMESTAMP,
  category_id UUID REFERENCES mdt_categories(id),
  created_at TIMESTAMP
);
```

---

## 🎨 **UI/UX 요점**

### Tool A: 쿠팡 분해기 UI
```
1️⃣ 분해 화면
   - 원본 카드 거래 표시 (읽기 전용)
   - 상세정보 업로드 영역
   - 자동 파싱된 상품 리스트 (사용자 편집 가능)
   - 각 상품별 카테고리 선택 드롭다운
   - "비즈니스용" 토글 (excluded_from_personal 플래그)

2️⃣ 미리보기
   - 분해된 거래 미리보기
   - 합계 일치 확인

3️⃣ 완료
   - "분해 완료" 버튼 → 가계부에 N줄 생성
```

### Tool B: 카카오페이 매퍼 UI
```
1️⃣ 매칭 화면
   - 카드사 거래 표시 (읽기 전용)
   - 카카오페이 내역서 파일 업로드
   - 자동 매칭된 행 목록
   - 매칭 신뢰도 표시 (100% = 금액/거래일 완벽 일치)

2️⃣ 가맹점 확인
   - 추출된 가맹점명 리스트
   - Smart Tagging 추천 카테고리
   - 사용자 커스텀 카테고리 수정 가능

3️⃣ 완료
   - "매칭 완료" 버튼 → 가계부에 N줄 생성
   - Asset 흐름도 자동 기록 (충전 → 결제)
```

---

## ✅ **구현 체크리스트**

### Phase 1: 기반 (Foundation)
- [ ] Asset 테이블에 "카카오페이 머니" 추가
- [ ] `transaction_breakdowns` & `kakao_pay_mappings` 테이블 생성
- [ ] `excluded_from_personal` 컬럼 추가

### Phase 2: Tool B (카카오페이 우선)
- [ ] 카카오페이 거래내역서 CSV 파서 작성
- [ ] 거래일 & 금액 자동 매칭 로직
- [ ] Smart Tagging V2 연계 (가맹점 → 카테고리)
- [ ] Asset 흐름 기록 (충전 = Transfer, 결제 = Expense)
- [ ] UI: 카카오페이 매퍼 페이지

### Phase 3: Tool A (쿠팡 분해기)
- [ ] 쿠팡 주문서 파서 (이메일, CSV, 스크린샷 지원)
- [ ] 상품별 카테고리 매칭 (Smart Tagging 연계)
- [ ] Double Count Prevention 플래그 처리
- [ ] 분해 내역 추적 (원본 ↔ 분해항목 매핑)
- [ ] UI: 쿠팡 분해기 페이지

### Phase 4: 통합 & 검증
- [ ] 가계부 목록에서 분해된 항목 시각적 표시
- [ ] 원본 거래 클릭 → 분해 내역 상세보기
- [ ] 통계 계산 시 `excluded_from_personal` 필터 적용
- [ ] E2E 테스트 (혼합 시나리오)

---

## 🚨 **주의사항 & 함정**

### ⚠️ 금액 대조
```
은행 충전: 10,000원
카카오페이 지출:
  ├─ 쿠팡: 7,000원
  ├─ 배민: 3,000원
  └─ 합계: 10,000원 ✓ (일치)

만약 지출 합계 < 충전액:
  → 남은 머니는?
  → 경고: "아직 사용하지 않은 머니가 있습니다"
```

### ⚠️ 날짜 매칭 유연성
```
카드사 내역 날짜: 2026-03-11
카카오페이 내역 날짜: 2026-03-10 or 2026-03-12 (±1일 허용)
→ 카드사 결제 승인일과 실제 결제일 불일치 가능성
```

### ⚠️ 중복 매칭 방지
```
카카오페이 내역서를 여러 번 업로드하면?
→ 동일 거래를 중복 생성하지 않도록 체크 필요
→ `kakao_pay_mappings` 테이블에 unique constraint
```

### ⚠️ 환불 & 부분 환급
```
카카오페이 거래 유형:
  [+] 환급 → Refund 타입 필요? 아니면 음수 Expense?

설정: Refund를 별도 타입으로 처리
결과: 통계 계산 시 환급은 지출과 상쇄
```

---

## 📚 **관련 문서 & 연계**

| 문서 | 연계 내용 |
|------|---------|
| `Smart_Tagging_V2.md` | 가맹점명 → 카테고리 자동 제안 |
| `Double_Count_Prevention.md` | `excluded_from_personal` 필터 적용 |
| `20260311_kakao_pay_research.md` | 카카오페이 Asset 처리 |
| `MDT_CATALOG.md` | Track A/B 카테고리 매핑 |

---

## 🎯 **최종 정리**

| 항목 | 쿠팡 | 카카오페이 |
|------|------|----------|
| **문제** | 1 결제 = N 상품 | 1 결제 = N 가맹점 |
| **원인** | 복합 주문 | 페이 통합 |
| **해결책** | 상세정보 분해 | 가맹점 매칭 |
| **데이터 소스** | 쿠팡 주문서 | 카카오페이 내역서 |
| **우선순위** | Phase 3 | Phase 2 (먼저) |
| **복잡도** | 중간 (수동 입력 지원) | 높음 (자동 매칭) |
| **추적성** | breakdown_source_id | kakao_pay_row_id |

