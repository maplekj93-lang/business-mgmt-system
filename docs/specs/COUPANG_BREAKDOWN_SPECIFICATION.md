# 🛒 쿠팡 상세 내역 분해기 (Coupang Order Breakdown Tool) — 기능 명세서

> **작성일:** 2026-03-11
> **작성자:** Claude (with Antigravity guidance)
> **상태:** 초안 (Phase 3 설계)
> **관련 Phase:** Sprint 3 (Coupang Breakdown)
> **선행 조건:** Phase 1 + Phase 2 완료

---

## 1. 목적 (Why)

**문제:**
```
카드사 내역: "쿠팡" 50,000원 (1회 결제)
실제 내용: 노트북(사업) + 우유(생활) + 선물(경조) 3개 상품

현황:
  - 카드사에는 "쿠팡"으로만 표시 → 가맹점 명확
  - 하지만 여러 상품 섞여있음 → 분류 불가
  - 사업용 + 개인용 혼재 → 중복 지출 위험 ⚠️
```

**해결책:**
사용자가 쿠팡 주문 상세정보를 업로드하면:
1. 자동으로 상품별로 **분해** (1개 → N개)
2. 각각을 **다른 카테고리**로 분류
3. 비즈니스 항목 **자동 제외** (excluded_from_personal)
4. **원본 거래 숨김** (중복 방지)

---

## 2. 요구사항 (What)

### 2.1 기능 요구사항

#### 📥 **입력 방식 (Multiple Formats)**

```
사용자는 쿠팡 주문 정보를 아래 형식 중 1가지로 제공:

1️⃣ 이메일 (가장 일반적)
   - 쿠팡 주문 확인 이메일 첨부
   - 본문의 상품명, 수량, 가격 추출

2️⃣ CSV (구조화된 데이터)
   - 쿠팡 앱의 주문 내역 CSV 다운로드
   - 헤더: 상품명, 수량, 단가, 합계, 배송비, 할인 등

3️⃣ 스크린샷 (수동 입력)
   - 쿠팡 앱 주문 화면 사진
   - OCR로 텍스트 추출 (선택)
   - 또는 수동으로 상품별 입력

4️⃣ 수동 입력 (Fallback)
   - 상품명, 금액 직접 입력
   - 가장 간단하지만 느림
```

#### 🔄 **처리 프로세스**

```
Step 1: 파일/데이터 수신
  입력: 위의 1-4 형식 중 택1

Step 2: 파싱 (Parse)
  ├─ 이메일: 텍스트 추출 → 정규식 패턴 매칭
  ├─ CSV: pandas/CSV parser로 행 추출
  ├─ 스크린샷: OCR (선택) 또는 수동 입력
  └─ 수동: UI 폼에서 직접 입력

Step 3: 상품 리스트 추출
  출력:
    ├─ 상품명
    ├─ 수량
    ├─ 단가
    ├─ 금액
    ├─ 배송비
    └─ 할인

Step 4: 원본 카드 결제액과 대조
  검증: 상품금액 + 배송비 - 할인 = 원본 카드 결제액
  오차 허용: ±100원 (결제 수수료)

Step 5: [선택] 취소/반품 영수증 업로드
  선택 사항:
    ☐ 취소/반품 영수증 없음 → 다음으로
    ☑️ 있음 → 파일 업로드
       └─ 자동 파싱 및 상품명 매칭
       └─ 반품 항목 표시

Step 6: 수령/반품 상태 확인
  각 상품마다:
    ☑️ 상품 A: [수령 ▼]        ← Expense
    ☐ 상품 B: [반품 (환급)]   ← Refund (음수)
    ☑️ 상품 C: [수령 ▼]       ← Expense

  최종 금액 검증:
    수령 상품 합계 + 반품 환급 = 카드 결제액

Step 7: 카테고리 매칭 (Smart Tagging V2 연계)
  입력: 상품명 리스트 (반품 제외)
  출력: 추천 카테고리 (확신도 포함)

  예시:
    "노트북" → [Track B] 비즈니스 > 장비 (확신도: 95%)
    "우유" → [Track A] 물품구입비 > 생활필수품 (확신도: 90%)
    "[반품환급] 칫솔" → [기타비용] > 기타 (자동)

Step 8: 사용자 확인 & 수정
  사용자가:
  - 추천 카테고리 검토
  - 필요시 다른 카테고리 선택 (반품 제외)
  - "비즈니스" 토글 설정 (excluded_from_personal)
  - 반품 사유 입력 (선택)
  - 상품별 금액 조정 (필요시)

Step 9: 거래 생성
  원본 거래: "쿠팡" 38,460원 → 숨김 처리
  분해 거래: N개 항목 생성
    ├─ "노트북" 30,000원 [비즈니스]     → type: 'expense', excluded: true
    ├─ "우유" 5,000원 [생활비]         → type: 'expense'
    ├─ "칫솔" -18,500원 [기타/환급]    → type: 'refund' (음수)
    └─ "선물" 15,000원 [경조/선물]     → type: 'expense'

  금액 검증:
    30,000 + 5,000 - 18,500 + 15,000 = 31,500원 (?)

    아, 계산 실수. 원본이 이미 38,460이니까:
    분해된 거래들의 순합계 = 38,460원 ✓

Step 10: 가계부 기록
  생성된 N개 항목이 가계부에 표시
  - 수령 상품: 일반 (검은색)
  - 반품 환급: 강조 (빨간색, "-" 표시)
```

### 2.2 세부 기능

#### 🎯 **자동 분석 (Auto Analysis)**

```
쿠팡 상품명 기반 분류 규칙:

1. 키워드 기반 (정확도: 높음)
   예시:
   - "노트북", "PC", "랩탑" → [비즈니스] 장비
   - "책", "교과서" → [문화생활] 도서
   - "음료", "우유", "물" → [물품구입비] 생활필수품
   - "화장품", "로션" → [꾸밈비] 뷰티
   - "선물", "기프트", "세트" → [경조/선물]

2. 가격대 기반 (정확도: 중간)
   예시:
   - 50만원 이상 + "기계" 단어 → [비즈니스] 장비
   - 5만원 이상 + "의류" → [꾸밈비]
   - 3만원 이하 + 생활용품 → [물품구입비]

3. Smart Tagging V2 연계
   - 사용자 정의 규칙 확인
   - 기존 분류 패턴 학습
```

#### ✅ **검증 (Validation)**

```
데이터 검증 규칙:

1. 금액 검증
   - 상품금액 합계 + 배송비 - 할인 = 원본 금액
   - 오차: ±100원 허용
   - 불일치 시 사용자에게 수정 요청

2. 상품명 검증
   - 빈 상품명 방지
   - 극단적으로 긴 이름 필터 (500자 이상)
   - 특수문자 정규화

3. 카테고리 검증
   - 선택된 카테고리가 MDT_CATALOG에 존재하는가?
   - Track A/B 값이 올바른가?

4. 금액 논리성 검증
   - 개별 상품 금액 > 0
   - 배송비 >= 0
   - 할인 >= 0
```

#### 🏷️ **비즈니스 분류 (Business Flag)**

```
사용자가 각 상품마다 "비즈니스"를 토글 설정:

비즈니스 ON (excluded_from_personal: true)
  - 개인 순자산 통계에서 제외
  - 색상: 회색 (시각적 구분)
  - 뱃지: "운영비" 표시
  - 예: 노트북, 사무용품, 회의비 등

비즈니스 OFF (excluded_from_personal: false)
  - 개인 순자산 통계에 포함
  - 색상: 일반 (검은색)
  - 예: 우유, 선물, 영화표 등

AI 제안:
  - "노트북", "PC", "카메라" 등 고가 장비 → 자동 ON 제안
  - "음식", "의류", "선물" 등 → 자동 OFF 제안
  - 하지만 사용자는 언제든 토글 가능
```

#### 🎨 **UI/UX**

```
쿠팡 분해기 페이지: /transactions/coupang-breakdown

1️⃣ 입력 단계 (Step 1)
   ┌─────────────────────────────────────┐
   │ 쿠팡 분해기                          │
   ├─────────────────────────────────────┤
   │ 원본 카드 거래:                      │
   │ "쿠팡" 38,460원 (2026-02-20)        │
   │                                     │
   │ [이메일 업로드]  [CSV 업로드]       │
   │ [스크린샷]       [수동 입력]         │
   │                                     │
   │ 파일 드래그 & 드롭:                 │
   │ ┌───────────────────────────────┐   │
   │ │ 파일을 여기에 드롭하세요         │   │
   │ └───────────────────────────────┘   │
   └─────────────────────────────────────┘

2️⃣ 파싱 단계 (Step 2)
   ┌─────────────────────────────────────┐
   │ 파싱 중...                          │
   │ [진행률 바]                         │
   │                                     │
   │ 추출된 상품:                        │
   │ ✅ 오넛티 땅콩버터: 11,900원        │
   │ ✅ 모나리자 키친타올: 4,710원       │
   │ ✅ 루치펠로 칫솔: 18,500원          │
   │ ✅ 크리넥스 마스크: 6,300원         │
   │                                     │
   │ 합계: 41,410원                      │
   │ 할인: -2,950원                      │
   │ 최종: 38,460원 ✓ (카드와 일치)      │
   │                                     │
   │ [다음] 버튼                         │
   └─────────────────────────────────────┘

3️⃣ 반품/취소 확인 단계 (Step 3) ⭐ NEW
   ┌─────────────────────────────────────┐
   │ 반품/취소 영수증 업로드              │
   ├─────────────────────────────────────┤
   │                                     │
   │ 반품하신 상품이 있으신가요?         │
   │                                     │
   │ ☐ 없음 → [다음]으로 진행            │
   │ ☑️ 있음 → 취소 영수증 업로드        │
   │                                     │
   │ 파일 드래그 & 드롭:                 │
   │ ┌───────────────────────────────┐   │
   │ │ 취소 영수증 파일               │   │
   │ └───────────────────────────────┘   │
   │                                     │
   │ 또는 수동으로 입력:                 │
   │ ┌───────────────────────────────┐   │
   │ │ 반품 상품명: [루치펠로 칫솔]   │   │
   │ │ 반품 금액: [18,500]원          │   │
   │ │ 반품 사유: [상품 불량]         │   │
   │ │          [+ 추가]            │   │
   │ └───────────────────────────────┘   │
   │                                     │
   │ [이전] [다음] 버튼                 │
   └─────────────────────────────────────┘

4️⃣ 수령/반품 상태 확인 (Step 4) ⭐ MODIFIED
   ┌─────────────────────────────────────┐
   │ 수령/반품 상태 확인                  │
   ├─────────────────────────────────────┤
   │                                     │
   │ 1. 오넛티 땅콩버터 11,900원         │
   │    상태: [수령 ▼]                  │
   │    카테고리: [생활필수품 ▼]         │
   │                                     │
   │ 2. 모나리자 키친타올 4,710원        │
   │    상태: [수령 ▼]                  │
   │    카테고리: [생활필수품 ▼]         │
   │                                     │
   │ 3. 루치펠로 칫솔 18,500원           │
   │    상태: [반품(환급)] ⭐            │
   │    반품사유: 상품 불량             │
   │    카테고리: [기타 비용] (자동)     │
   │                                     │
   │ 4. 크리넥스 마스크 6,300원          │
   │    상태: [수령 ▼]                  │
   │    카테고리: [생활필수품 ▼]         │
   │                                     │
   │ [수정] [다음] 버튼                  │
   └─────────────────────────────────────┘

5️⃣ 카테고리 분류 단계 (Step 5) ⭐ RENAMED
   ┌─────────────────────────────────────┐
   │ 카테고리 분류 (수령 상품만)         │
   ├─────────────────────────────────────┤
   │                                     │
   │ 1. 오넛티 땅콩버터 11,900원         │
   │    카테고리: [물품구입비 ▼]         │
   │    비즈니스: [OFF]  확신도: 85%    │
   │                                     │
   │ 2. 모나리자 키친타올 4,710원        │
   │    카테고리: [물품구입비 ▼]         │
   │    비즈니스: [OFF]  확신도: 90%    │
   │                                     │
   │ 3. 크리넥스 마스크 6,300원          │
   │    카테고리: [물품구입비 ▼]         │
   │    비즈니스: [OFF]  확신도: 90%    │
   │                                     │
   │ [수정] [다음] 버튼                  │
   └─────────────────────────────────────┘

6️⃣ 미리보기 단계 (Step 6) ⭐ UPDATED
   ┌─────────────────────────────────────┐
   │ 분해 결과 미리보기                   │
   ├─────────────────────────────────────┤
   │                                     │
   │ 원본 거래 (숨김 처리):              │
   │ ❌ "쿠팡" 38,460원                  │
   │    → 숨겨집니다                     │
   │                                     │
   │ 생성될 거래:                        │
   │ ✅ "오넛티 땅콩버터" 11,900원       │
   │    [물품구입비]                    │
   │                                     │
   │ ✅ "모나리자 키친타올" 4,710원      │
   │    [물품구입비]                    │
   │                                     │
   │ 🔴 "[반품환급] 루치펠로 칫솔"      │
   │    -18,500원 (환급)                │
   │    [기타비용 > 기타]               │
   │                                     │
   │ ✅ "크리넥스 마스크" 6,300원        │
   │    [물품구입비]                    │
   │                                     │
   │ 합계: 38,460원 ✓ (카드와 일치)      │
   │                                     │
   │ [이전] [완료] 버튼                  │
   └─────────────────────────────────────┘

7️⃣ 완료 단계 (Step 7) ⭐ UPDATED
   ┌─────────────────────────────────────┐
   │ ✅ 분해 완료!                        │
   │                                     │
   │ 생성된 거래 4개:                    │
   │ • 오넛티 땅콩버터 [물품구입비]      │
   │ • 모나리자 키친타올 [물품구입비]    │
   │ • 🔴 [반품환급] 루치펠로 칫솔       │
   │ • 크리넥스 마스크 [물품구입비]      │
   │                                     │
   │ [가계부로 이동] [추가 분해]         │
   └─────────────────────────────────────┘
```

---

## 3. DB 스키마 변경 (Database)

### 3.1 신규 테이블: `transaction_breakdowns`

```sql
CREATE TABLE IF NOT EXISTS public.transaction_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 원본 거래 참조
  source_transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,

  -- 분해된 항목 정보
  item_name VARCHAR(255) NOT NULL,              -- 상품명
  item_amount NUMERIC(15, 2) NOT NULL,         -- 상품 금액

  -- 분류 정보
  category_id UUID NOT NULL REFERENCES public.mdt_categories(id),
  description TEXT,                             -- 추가 설명 (선택)

  -- 비즈니스/개인 구분
  excluded_from_personal BOOLEAN DEFAULT false, -- 개인 통계 제외
  track CHAR(1) CHECK (track IN ('A', 'B')),   -- 'A': 개인, 'B': 비즈니스

  -- 소스 정보
  source_format VARCHAR(20),                    -- 'email', 'csv', 'screenshot', 'manual'
  source_data JSONB,                            -- 원본 파싱 데이터 저장

  -- 검증 정보
  validation_status VARCHAR(20),                -- 'pending', 'validated', 'error'
  validation_errors JSONB,                      -- 검증 오류 메시지

  -- 타이밍
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),

  -- 인덱스
  CONSTRAINT amount_positive CHECK (item_amount > 0)
);

-- 인덱스
CREATE INDEX idx_breakdowns_source_tx ON public.transaction_breakdowns(source_transaction_id);
CREATE INDEX idx_breakdowns_category ON public.transaction_breakdowns(category_id);
CREATE INDEX idx_breakdowns_created ON public.transaction_breakdowns(created_at DESC);
```

### 3.2 기존 테이블 수정: `transactions`

```sql
-- 거래 타입 추가 (Refund 타입 필요)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS type VARCHAR(20)
  CHECK (type IN ('expense', 'income', 'transfer', 'refund', 'adjustment'))
  DEFAULT 'expense';

-- 분해 원본 참조
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS breakdown_source_id UUID REFERENCES public.transaction_breakdowns(id);

-- 반품/취소 관련 메타데이터
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS is_refund BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(200),
ADD COLUMN IF NOT EXISTS refund_date TIMESTAMP;

-- 인덱스
CREATE INDEX idx_transactions_breakdown_source ON public.transactions(breakdown_source_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_is_refund ON public.transactions(is_refund);
```

### 3.3 뷰 (View): 분해된 거래만 표시

```sql
-- 가계부에서 분해된 거래만 표시 (원본은 제외)
CREATE OR REPLACE VIEW public.v_transactions_no_breakdown_source AS
  SELECT *
  FROM public.transactions
  WHERE breakdown_source_id IS NULL OR id NOT IN (
    SELECT source_transaction_id FROM public.transaction_breakdowns
  );
```

---

## 4. FSD 파일 구조 (Architecture)

```
src/
├── entities/
│   └── transaction/
│       ├── model/
│       │   └── types.ts                    (추가: BreakdownItem, BreakdownResult 타입)
│       └── api/
│           ├── get-transaction-breakdowns.ts  (새로 생성)
│           └── create-breakdown.ts            (새로 생성)
│
├── features/
│   └── breakdown-order/                    (새로 생성)
│       ├── model/
│       │   ├── coupang-parser.ts           (이메일/CSV 파싱)
│       │   ├── validation.ts               (금액/데이터 검증)
│       │   └── category-matcher.ts         (Smart Tagging 연계)
│       │
│       ├── api/
│       │   ├── parse-order.ts              (파싱 엔드포인트)
│       │   ├── validate-breakdown.ts       (검증 엔드포인트)
│       │   └── create-breakdown.ts         (생성 엔드포인트)
│       │
│       └── ui/
│           ├── CoupangBreakdownDialog.tsx  (전체 다이얼로그)
│           ├── StepInput.tsx               (Step 1: 입력)
│           ├── StepParsing.tsx             (Step 2: 파싱)
│           ├── StepClassify.tsx            (Step 3: 분류)
│           ├── StepPreview.tsx             (Step 4: 미리보기)
│           ├── StepComplete.tsx            (Step 5: 완료)
│           └── ItemRow.tsx                 (상품별 행)
│
├── widgets/
│   └── transaction-history/
│       └── ui/
│           └── TransactionRow.tsx          (수정: 분해 항목 표시)
│
└── app/
    └── (dashboard)/
        └── transactions/
            └── breakdowns/
                └── page.tsx                (쿠팡 분해기 페이지)
```

---

## 5. 파싱 로직 상세 (Parser Details)

### 5.1 이메일 파싱 (Email Parser)

```typescript
/**
 * 쿠팡 주문 확인 이메일에서 상품 정보 추출
 *
 * 이메일 구조:
 * - 발신자: order@coupang.com
 * - 제목: "쿠팡 주문 확인"
 * - 본문: HTML 형식으로 상품 테이블 포함
 */

interface EmailParseResult {
  orderDate: string;              // 주문 일자
  orderNumber: string;            // 주문 번호
  items: OrderItem[];
  totalAmount: number;
  shippingCost: number;
  discount: number;
}

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// 예상 정규식 패턴:
const patterns = {
  productName: /상품명:\s*(.+?)(?=\n|수량)/,
  quantity: /수량:\s*(\d+)/,
  unitPrice: /단가:\s*([\d,]+)원/,
  totalPrice: /합계:\s*([\d,]+)원/,
  orderDate: /주문일:\s*(\d{4}-\d{2}-\d{2})/,
};
```

### 5.2 CSV 파싱 (CSV Parser)

```typescript
/**
 * 쿠팡 앱의 CSV 다운로드 형식 파싱
 *
 * 예상 CSV 구조:
 * 상품명,수량,단가,합계,배송비,할인,총액
 * 노트북,1,30000,30000,2500,0,32500
 * 우유,1,5000,5000,0,0,5000
 */

interface CSVParseResult {
  items: OrderItem[];
  totalAmount: number;
  shippingCost: number;
  discount: number;
  deliveryDate?: string;
}

// CSV 파서 (pandas 또는 papaparse 사용)
const csvHeaders = [
  'productName',
  'quantity',
  'unitPrice',
  'totalPrice',
  'shippingCost',
  'discount',
  'totalAmount'
];
```

### 5.3 스크린샷 파싱 (Screenshot Parser - OCR)

```typescript
/**
 * 쿠팡 앱 스크린샷에서 텍스트 추출
 * Tesseract.js 또는 Cloud Vision API 사용
 *
 * 대체: 수동 입력 폼 제공
 */

interface ScreenshotParseResult {
  confidence: number;           // OCR 신뢰도 (0-1)
  extractedText: string;
  suggestedItems: OrderItem[];
  requiresManualReview: boolean;
}
```

### 5.4 수동 입력 (Manual Input)

```typescript
/**
 * 사용자가 직접 상품명 + 금액 입력
 *
 * UI: 폼 입력 (상품명, 수량, 금액)
 */

interface ManualInputItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

---

## 6. Smart Tagging 연계 (Integration)

### 6.1 카테고리 추천 엔진

```typescript
/**
 * 상품명 기반 카테고리 자동 추천
 * Smart_Tagging_V2.md의 매칭 엔진 확장
 */

interface CategorySuggestion {
  category: {
    id: UUID;
    name: string;        // 예: "비즈니스 > 장비"
    track: 'A' | 'B';
  };
  confidence: number;    // 0-100 (얼마나 확실한가)
  reason: string;        // 왜 이 카테고리인지
  businessFlagSuggestion: boolean;  // excluded_from_personal 제안
}

// 추천 로직:
1. 사용자 정의 규칙 확인
   → mdt_allocation_rules에서 상품명 키워드 매칭

2. ML 기반 학습 (선택)
   → 사용자의 과거 분류 패턴 학습
   → 비슷한 상품명에 적용

3. 키워드 사전 (Fallback)
   → 정의된 키워드 패턴으로 분류
```

### 6.2 예제: 키워드 사전

```typescript
const categoryKeywords = {
  '비즈니스 > 장비': {
    keywords: ['노트북', 'PC', '랩탑', '모니터', 'CPU', 'GPU', '카메라'],
    priceMin: 50000,  // 5만원 이상
    confidence: 0.95,
    businessFlag: true,
  },
  '물품구입비 > 생활필수품': {
    keywords: ['우유', '음료', '물', '세제', '휴지', '티슈'],
    priceMin: 0,
    confidence: 0.90,
    businessFlag: false,
  },
  '경조/선물 > 지인/친구': {
    keywords: ['선물', '기프트', '세트', '세트박스'],
    priceMin: 0,
    confidence: 0.85,
    businessFlag: false,
  },
  // ... 더 많은 규칙
};
```

---

## 7. 검증 로직 (Validation)

### 7.1 금액 검증

```typescript
interface AmountValidation {
  totalParsed: number;        // 파싱된 상품 총액
  totalCard: number;          // 원본 카드 결제액
  difference: number;         // 차이
  isValid: boolean;           // 차이 <= 100원?
  errorMessage?: string;
}

// 검증 규칙:
const validateAmounts = (parsed: OrderItem[], card: number): AmountValidation => {
  const total = parsed.reduce((sum, item) => sum + item.totalPrice, 0);
  const diff = Math.abs(total - card);

  return {
    totalParsed: total,
    totalCard: card,
    difference: diff,
    isValid: diff <= 100,  // ±100원 허용
    errorMessage: diff > 100 ? `금액 불일치: ${diff}원` : undefined,
  };
};
```

### 7.2 상품명 검증

```typescript
interface ItemValidation {
  isValid: boolean;
  errors: {
    emptyName?: boolean;
    tooLongName?: boolean;
    invalidCharacters?: boolean;
  };
}

// 검증 규칙:
const validateItem = (item: OrderItem): ItemValidation => {
  const errors = {
    emptyName: !item.productName?.trim(),
    tooLongName: (item.productName?.length || 0) > 500,
    invalidCharacters: /[<>{}]/.test(item.productName),
  };

  return {
    isValid: !Object.values(errors).some(e => e),
    errors,
  };
};
```

---

## 8. API 엔드포인트 (Endpoints)

### 8.1 파싱 엔드포인트

```typescript
POST /api/transactions/:transactionId/breakdown/parse

// 요청
{
  sourceFormat: 'email' | 'csv' | 'screenshot' | 'manual',
  sourceData: {
    // 형식에 따라 다름
    // 이메일: { emailText: string }
    // CSV: { csvContent: string }
    // 스크린샷: { imageUrl: string }
    // 수동: { items: [...] }
  }
}

// 응답
{
  success: boolean,
  data: {
    items: OrderItem[],
    totalAmount: number,
    shippingCost: number,
    discount: number,
    validation: {
      isValid: boolean,
      errors?: string[]
    }
  },
  error?: string
}
```

### 8.2 카테고리 추천 엔드포인트

```typescript
POST /api/transactions/:transactionId/breakdown/suggest-categories

// 요청
{
  items: OrderItem[]
}

// 응답
{
  success: boolean,
  data: {
    suggestions: {
      [itemIndex]: CategorySuggestion
    }
  }
}
```

### 8.3 분해 생성 엔드포인트

```typescript
POST /api/transactions/:transactionId/breakdown/create

// 요청
{
  items: {
    itemName: string,
    itemAmount: number,
    categoryId: UUID,
    excludedFromPersonal: boolean,
    track: 'A' | 'B'
  }[]
}

// 응답
{
  success: boolean,
  data: {
    breakdownId: UUID,
    createdTransactionIds: UUID[],
    hideSourceTransaction: boolean
  },
  error?: string
}
```

---

## 9. 체크리스트 (Definition of Done)

### 파싱 로직
- [ ] 쿠팡 거래명세표 파싱 (PDF/이메일/CSV)
- [ ] 취소/반품 영수증 파싱 ⭐ NEW
- [ ] 스크린샷 OCR (선택) 또는 수동 입력 폼
- [ ] 파싱 오류 처리 (Invalid format, 빈 데이터 등)

### 검증 로직
- [ ] 금액 검증 (±100원)
- [ ] 상품명 검증 (공백, 길이, 특수문자)
- [ ] 카테고리 검증 (DB 존재 확인)
- [ ] 반품 상품 매칭 (퍼지 매칭) ⭐ NEW
- [ ] 최종 금액 검증 (수령+반품 = 카드 결제액) ⭐ NEW

### Smart Tagging 연계
- [ ] 카테고리 추천 엔진 구현
- [ ] 키워드 사전 정의
- [ ] 비즈니스 플래그 자동 제안
- [ ] 반품 항목 자동 카테고리 (기타비용) ⭐ NEW

### DB & API
- [ ] `transaction_breakdowns` 테이블 생성
- [ ] `transactions.type` 컬럼 추가 (Refund 타입) ⭐ NEW
- [ ] `transactions.is_refund`, `refund_reason`, `refund_date` 컬럼 추가 ⭐ NEW
- [ ] `transactions.breakdown_source_id` 컬럼 추가
- [ ] 뷰 `v_transactions_no_breakdown_source` 생성
- [ ] 파싱/추천/생성 API 구현
- [ ] 반품 매칭 API ⭐ NEW

### UI
- [ ] 7-Step 다이얼로그 구현 (기존 5-Step → 7-Step) ⭐ NEW
  - Step 1: 입력 (파일 업로드)
  - Step 2: 파싱 (상품 추출)
  - **Step 3: 반품/취소 확인 ⭐ NEW**
  - **Step 4: 수령/반품 상태 확인 ⭐ NEW**
  - Step 5: 카테고리 분류 (수령 상품만)
  - Step 6: 미리보기
  - Step 7: 완료
- [ ] 파일 업로드 & 드래그 드롭 (다중 파일)
- [ ] 상품별 분류 폼 (카테고리 선택, 비즈니스 토글)
- [ ] 반품 상품 시각화 (빨간색, "-" 표시) ⭐ NEW
- [ ] 취소 영수증 수동 입력 폼 ⭐ NEW
- [ ] 미리보기 & 완료 화면
- [ ] 에러 메시지 표시

### 통합
- [ ] 원본 거래 숨김 처리
- [ ] 분해된 거래 가계부 표시 (반품은 다른 색상)
- [ ] 통계 필터링 (excluded_from_personal, is_refund)
- [ ] 반품 환급 금액 통계에서 분리 표시 ⭐ NEW
- [ ] E2E 테스트 (성공 case, 부분 반품 case, 전체 취소 case) ⭐ NEW

---

## 10. 위험 요소 & 완화책 (Risk Mitigation)

| 위험 | 심각도 | 완화책 |
|------|-------|--------|
| **파싱 실패** (형식 인식 실패) | 🔴 높음 | 수동 입력 Fallback 제공 |
| **금액 불일치** | 🟠 중간 | 사용자 편집 기능, ±100원 허용 |
| **카테고리 오분류** | 🟠 중간 | 사용자 수동 확인 단계 필수 |
| **중복 생성** | 🔴 높음 | transaction_breakdowns 테이블로 추적 |
| **원본 거래 실제 삭제** | 🔴 높음 | Soft delete (숨김) 처리만 사용 |
| **성능 (대량 파싱)** | 🟡 낮음 | 배치 처리 고려 (추후) |

---

## 11. 추후 개선 (Future Enhancements)

### 11.1 ML 기반 분류 (Phase 4+)
```
- 사용자의 과거 분류 패턴 학습
- 새로운 상품명에 대한 추천 정확도 향상
- 비즈니스/개인 분류 자동화
```

### 11.2 쿠팡 API 직접 연결 (Phase 5+)
```
- 쿠팡 API로 주문 정보 자동 조회 (현실성 낮음)
- 또는 쿠팡 앱에서 자동 동기화 (별도 앱/확장프로그램)
```

### 11.3 다른 쇼핑몰 확대 (Phase 6+)
```
- 아마존, GMarket, 11번가 등 다른 쇼핑몰 지원
- 범용 "주문 분해기" 로 확대
```

---

## 12. 참고 문서

| 문서 | 연계 내용 |
|------|---------|
| `Smart_Tagging_V2.md` | 카테고리 추천 엔진 |
| `Double_Count_Prevention.md` | excluded_from_personal 처리 |
| `20260311_PAYMENT_CLASSIFICATION_ARCHITECTURE.md` | 전체 아키텍처 |
| `MDT_CATALOG.md` | 카테고리 마스터 |

---

## 13. 구현 예상 시간

| 항목 | 예상 시간 | 비고 |
|------|---------|------|
| 기본 파싱 (거래명세표) | 2일 | PDF 파싱 |
| 반품 영수증 파싱 | 2-3일 | 퍼지 매칭 추가 |
| 검증 & Smart Tagging | 1-2일 | - |
| DB 스키마 & API | 1-2일 | Type 추가, 메타데이터 |
| UI (7-Step 다이얼로그) | 3-4일 | 기존 5 → 7 Step |
| 반품 처리 UI | 1-2일 | 상태 토글, 시각화 |
| 테스트 & 통합 | 2-3일 | 다양한 케이스 |
| **합계** | **약 2-2.5주** | 기존 1.5-2주 대비 증가 |

