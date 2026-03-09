# 📋 Import Sync Guide — 작업명세서 (Work Order)

> **작성일:** 2026-03-05
> **기준 문서:** `import_sync_guide.md` + `import_sync_guide_technical_specification.md`
> **수신:** Antigravity
> **목적:** 이 문서의 순서대로 따라가면 Import Sync Guide 기능이 완전히 구현됩니다.

---

## ⚠️ 검토 결과 — 발견된 문제 (수정 완료)

두 문서를 교차 검토한 결과 아래 7개의 불완전한 설계/버그를 발견했습니다. 명세서에는 수정된 최종 버전만 담겨 있습니다.

| # | 위치 | 문제 | 수정 내용 |
|---|------|------|-----------|
| 1 | `import_hash` 생성 | 구분자 `_`를 사용하는데 `description`에 `_`가 있으면 충돌 발생 | 구분자 `\|` 로 변경 + 전처리 정규화 명시 |
| 2 | `recommended_start_date` SQL | `MAX(t.date) + 1 day`로 설계되어 있어 겹침 구간 없음 → 누락 위험 | **3일 전부터** 여유 있게 가이드하도록 수정 |
| 3 | `calculateRecommendedDate` | UI 컴포넌트에서 호출하는데 구현부 없음 | **전체 로직 구현** 추가 |
| 4 | `openBankLink` | 함수 호출만 있고 URL 매핑 없음 | **은행별 URL 상수** 정의 추가 |
| 5 | `source` 컬럼 | CHECK constraint 없어 임의 값 삽입 가능 | `CHECK (source IN ('MANUAL', 'EXCEL'))` 추가 |
| 6 | 대량 업로드 청킹 | "100~200건씩 끊어서" 언급만 있고 구현 없음 | **chunk 유틸 함수** 구현 추가 |
| 7 | 오타 | 명세서 내 일본어 혼입: `ダウンロード` | **`다운로드`** 로 수정 (이 문서에 반영) |

---

## 📁 구현 순서

```
Step 1: DB Migration
Step 2: 타입 정의 (TypeScript)
Step 3: 유틸 함수 (해시 생성, 날짜 계산, 청킹)
Step 4: 데이터 페칭 훅 (useImportSyncGuide)
Step 5: 임포트 처리 함수 (importExcelTransactions)
Step 6: UI 컴포넌트 (ImportSyncGuide)
Step 7: 기존 임포트 페이지에 연결
Step 8: 테스트 체크리스트
```

---

## Step 1: DB Migration

Supabase Dashboard → SQL Editor에서 아래 SQL을 **순서대로** 실행합니다.

```sql
-- ① assets 테이블: 마지막 동기화 시각 컬럼 추가
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- ② transactions 테이블: 중복 방지 해시 + 출처 컬럼 추가
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS import_hash TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'MANUAL'
    CHECK (source IN ('MANUAL', 'EXCEL'));

-- ③ import_hash 유니크 인덱스 (NULL 제외)
--    PostgreSQL에서 NULL은 UNIQUE 제약에서 제외되므로
--    기존 MANUAL 데이터(import_hash=NULL)는 영향 없음
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_import_hash
  ON public.transactions(import_hash)
  WHERE import_hash IS NOT NULL;

-- ④ 빠른 중복 체크용 일반 인덱스 (추가)
CREATE INDEX IF NOT EXISTS idx_transactions_source
  ON public.transactions(source);
```

> **주의:** `import_hash UNIQUE` 제약을 직접 걸지 않고 **조건부 유니크 인덱스**(`WHERE import_hash IS NOT NULL`)를 사용합니다.
> 이렇게 하면 `import_hash = NULL`인 기존 수동 입력 데이터가 UNIQUE 위반 없이 공존합니다.

---

## Step 2: 타입 정의

**파일 위치:** `src/entities/asset/types.ts` 에 아래 타입을 추가합니다.

```typescript
// 기존 Asset 타입에 last_synced_at 추가
export interface Asset {
  id:              string;
  name:            string;
  type:            'bank' | 'card' | 'cash' | 'investment';  // 기존 타입 유지
  balance:         number;
  last_synced_at?: string | null;  // ← 신규 추가
  // ... 기존 필드
}

// 동기화 가이드 화면용 집계 타입
export interface AssetSyncInfo {
  asset_id:                string;
  asset_name:              string;
  asset_type:              string;
  last_synced_at:          string | null;
  last_transaction_date:   string | null;    // YYYY-MM-DD
  recommended_start_date:  string;           // YYYY-MM-DD (계산된 값)
}
```

**파일 위치:** `src/entities/transaction/types.ts` 에 아래를 추가합니다.

```typescript
export type TransactionSource = 'MANUAL' | 'EXCEL';

// 기존 Transaction 타입에 필드 추가
export interface Transaction {
  // ... 기존 필드
  import_hash?: string | null;   // ← 신규 추가
  source:       TransactionSource;  // ← 신규 추가 (DEFAULT 'MANUAL')
}

// 엑셀 파싱 후 임포트 전 중간 타입
export interface ExcelTransactionRow {
  date:        string;   // YYYY-MM-DD로 정규화된 상태
  amount:      number;
  description: string;
  asset_id:    string;
}
```

---

## Step 3: 유틸 함수

**파일 위치:** `src/features/import-excel/lib/utils.ts`

### 3-A. `generateImportHash` — 중복 방지 해시 생성

```typescript
/**
 * 동일 결제건 식별을 위한 고유 해시 생성.
 *
 * ⚠️ 설계 규칙:
 *   - date는 반드시 YYYY-MM-DD 로 정규화 후 입력
 *   - amount는 반드시 숫자형(number)으로 입력 (문자열 금액 금지)
 *   - description은 trim() 후 입력
 *   - 구분자로 '|' 사용 (설명에 '_'가 포함될 수 있어 '_' 사용 금지)
 */
export async function generateImportHash(
  date: string,       // YYYY-MM-DD
  assetId: string,    // UUID
  amount: number,
  description: string
): Promise<string> {
  const raw = `${date}|${assetId}|${amount}|${description.trim()}`;

  // Web Crypto API로 SHA-256 해시 생성
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### 3-B. `calculateRecommendedDate` — 권장 다운로드 시작일 계산

```typescript
/**
 * 권장 엑셀 다운로드 시작일 계산.
 *
 * 로직:
 *   1. 기준일 = 마지막 거래일 (없으면 오늘 - 30일 = 첫 사용자 기본값)
 *   2. 권장 시작일 = 기준일 - SAFETY_OVERLAP_DAYS (기본 3일)
 *      → 3일 겹쳐 받아도 import_hash로 자동 중복 제거됨
 *
 * 주의: 신용카드는 오늘 날짜를 제외하고 어제까지만 권장 (pending 처리)
 *   → 호출부에서 asset_type === 'card' 일 때 endDate를 yesterday로 제한할 것
 */
const SAFETY_OVERLAP_DAYS = 3;

export function calculateRecommendedDate(
  lastTransactionDate: string | null,
  _lastSyncedAt: string | null  // 현재는 표시용으로만 사용, 추후 로직 확장 가능
): string {
  const today = new Date();

  if (!lastTransactionDate) {
    // 한 번도 임포트 안 한 경우: 30일치 권장
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() - 30);
    return formatDateToISO(defaultStart);
  }

  const lastTxDate = new Date(lastTransactionDate);
  const recommended = new Date(lastTxDate);
  recommended.setDate(lastTxDate.getDate() - SAFETY_OVERLAP_DAYS);

  return formatDateToISO(recommended);
}

/** Date → "YYYY-MM-DD" 문자열 변환 */
function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** "YYYY-MM-DD" → "YYYY. MM. DD" 한국 표시 포맷 */
export function formatDateKo(isoDate: string | null): string {
  if (!isoDate) return '없음';
  const [y, m, d] = isoDate.split('-');
  return `${y}. ${m}. ${d}`;
}

/** ISO timestamp → "YYYY. MM. DD HH:mm" 한국 표시 포맷 */
export function formatDateTimeKo(isoTimestamp: string | null): string {
  if (!isoTimestamp) return '기록 없음';
  const dt = new Date(isoTimestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}. ${pad(dt.getMonth()+1)}. ${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
```

### 3-C. `chunkArray` — 대량 업로드 청킹

```typescript
/**
 * 배열을 지정된 크기로 분할.
 * 수백 건 일괄 upsert 시 Supabase 타임아웃 방지용.
 *
 * @example
 * chunkArray(rows, 150)  // 150건씩 분할
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### 3-D. `BANK_LINKS` — 은행별 바로가기 URL 상수

```typescript
/**
 * 은행/카드사별 엑셀 내역 다운로드 페이지 URL.
 * asset.name 이 아래 key와 매핑되면 버튼 표시.
 * 매핑 안 되면 버튼 숨김 처리.
 */
export const BANK_LINKS: Record<string, { label: string; url: string }> = {
  // 통장
  '농협':       { label: '농협 인터넷뱅킹', url: 'https://www.nonghyup.com' },
  '신한':       { label: '신한은행',         url: 'https://www.shinhan.com' },
  '국민':       { label: 'KB국민은행',        url: 'https://www.kbstar.com' },
  '카카오뱅크': { label: '카카오뱅크',        url: 'https://www.kakaobank.com' },
  '토스뱅크':   { label: '토스뱅크',          url: 'https://www.tossbank.com' },
  // 카드
  '신한카드':   { label: '신한카드 파트너스',  url: 'https://www.shinhancard.com' },
  '현대카드':   { label: '현대카드',           url: 'https://www.hyundaicard.com' },
  '삼성카드':   { label: '삼성카드',           url: 'https://www.samsungcard.com' },
  '롯데카드':   { label: '롯데카드',           url: 'https://www.lottecard.co.kr' },
};

/** asset_name에서 뱅킹 URL 찾기. 없으면 null 반환 */
export function getBankLink(assetName: string): { label: string; url: string } | null {
  const key = Object.keys(BANK_LINKS).find(k => assetName.includes(k));
  return key ? BANK_LINKS[key] : null;
}
```

---

## Step 4: 데이터 페칭 훅

**파일 위치:** `src/features/import-excel/model/useImportSyncGuide.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { calculateRecommendedDate } from '../lib/utils';
import type { AssetSyncInfo } from '@/entities/asset/types';

async function fetchSyncGuideData(): Promise<AssetSyncInfo[]> {
  const { data, error } = await supabase.rpc('get_asset_sync_guide');
  if (error) throw error;

  // recommended_start_date는 프론트에서 계산 (SQL에서도 계산되지만 오버라이드)
  return (data as Omit<AssetSyncInfo, 'recommended_start_date'>[]).map(asset => ({
    ...asset,
    recommended_start_date: calculateRecommendedDate(
      asset.last_transaction_date,
      asset.last_synced_at
    ),
  }));
}

export function useImportSyncGuide() {
  return useQuery({
    queryKey: ['import-sync-guide'],
    queryFn: fetchSyncGuideData,
    staleTime: 1000 * 60 * 5,  // 5분 캐시
  });
}
```

**Supabase RPC 함수 생성 (SQL):**

```sql
-- get_asset_sync_guide RPC 함수
-- 각 자산의 마지막 거래일 + 마지막 동기화 시각을 집계 반환
CREATE OR REPLACE FUNCTION public.get_asset_sync_guide()
RETURNS TABLE (
  asset_id               UUID,
  asset_name             TEXT,
  asset_type             TEXT,
  last_synced_at         TIMESTAMPTZ,
  last_transaction_date  DATE,
  recommended_start_date DATE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    a.id                                                    AS asset_id,
    a.name                                                  AS asset_name,
    a.type                                                  AS asset_type,
    a.last_synced_at,
    MAX(t.date)::DATE                                       AS last_transaction_date,
    -- 권장 시작일: 마지막 거래일 - 3일 (여유 구간)
    -- 프론트에서도 동일 로직 재계산하므로 참고용
    (COALESCE(MAX(t.date), CURRENT_DATE - INTERVAL '30 days')
      - INTERVAL '3 days')::DATE                           AS recommended_start_date
  FROM public.assets a
  LEFT JOIN public.transactions t ON a.id = t.asset_id
  GROUP BY a.id, a.name, a.type, a.last_synced_at
  ORDER BY a.type, a.name;
$$;
```

---

## Step 5: 임포트 처리 함수

**파일 위치:** `src/features/import-excel/api/importExcelTransactions.ts`

```typescript
import { supabase } from '@/shared/lib/supabase';
import { generateImportHash, chunkArray } from '../lib/utils';
import type { ExcelTransactionRow } from '@/entities/transaction/types';

const CHUNK_SIZE = 150;  // 1회 upsert 최대 건수

interface ImportResult {
  inserted: number;
  skipped:  number;
  errors:   string[];
}

/**
 * 파싱된 엑셀 데이터를 Supabase에 저장.
 *
 * 동작:
 *   1. 각 row에 import_hash 생성
 *   2. 150건씩 청크 분할
 *   3. 청크별 upsert (중복 hash는 ignoreDuplicates로 무시)
 *   4. 전체 성공 시 assets.last_synced_at 업데이트
 */
export async function importExcelTransactions(
  rows: ExcelTransactionRow[],
  assetId: string
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

  // ① 해시 생성 및 데이터 준비
  const preparedRows = await Promise.all(
    rows.map(async (row) => ({
      asset_id:    row.asset_id,
      date:        row.date,            // YYYY-MM-DD 정규화된 상태
      amount:      row.amount,
      description: row.description.trim(),
      source:      'EXCEL' as const,
      import_hash: await generateImportHash(
        row.date,
        row.asset_id,
        row.amount,
        row.description
      ),
    }))
  );

  // ② 청크 분할 후 순차 upsert
  const chunks = chunkArray(preparedRows, CHUNK_SIZE);

  for (const [i, chunk] of chunks.entries()) {
    const { data, error } = await supabase
      .from('transactions')
      .upsert(chunk, {
        onConflict: 'import_hash',
        ignoreDuplicates: true,  // 중복 hash → 조용히 무시
      })
      .select('id');

    if (error) {
      result.errors.push(`청크 ${i + 1}/${chunks.length} 오류: ${error.message}`);
      continue;
    }

    // upsert에서 ignoreDuplicates=true이면 실제 삽입된 건만 반환됨
    result.inserted += data?.length ?? 0;
    result.skipped  += chunk.length - (data?.length ?? 0);
  }

  // ③ 오류 없이 완료 시 last_synced_at 업데이트
  if (result.errors.length === 0) {
    await supabase
      .from('assets')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', assetId);
  }

  return result;
}
```

---

## Step 6: UI 컴포넌트

**파일 위치:** `src/features/import-excel/ui/ImportSyncGuide.tsx`

### 6-A. 컴포넌트 전체 구조

```tsx
import { useImportSyncGuide } from '../model/useImportSyncGuide';
import { formatDateKo, formatDateTimeKo, getBankLink } from '../lib/utils';
import type { AssetSyncInfo } from '@/entities/asset/types';

export function ImportSyncGuide() {
  const { data, isLoading, isError } = useImportSyncGuide();

  if (isLoading) return <SyncGuideSkeleton />;
  if (isError)   return <SyncGuideError />;

  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-gray-700 mb-3">
        📥 자산별 엑셀 다운로드 가이드
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((asset) => (
          <AssetSyncCard key={asset.asset_id} asset={asset} />
        ))}
      </div>
    </section>
  );
}
```

### 6-B. `AssetSyncCard` — 카드 하나의 UI

```tsx
function AssetSyncCard({ asset }: { asset: AssetSyncInfo }) {
  const bankLink = getBankLink(asset.asset_name);
  const isCard   = asset.asset_type === 'card';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm
                    hover:shadow-md transition-shadow">

      {/* 자산명 + 유형 뱃지 */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-900 text-base">
          {asset.asset_name}
        </span>
        <AssetTypeBadge type={asset.asset_type} />
      </div>

      {/* 날짜 정보 */}
      <div className="space-y-1 text-sm text-gray-500">
        <div className="flex justify-between">
          <span>마지막 거래일</span>
          <span className="text-gray-700 font-medium">
            {formatDateKo(asset.last_transaction_date)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>마지막 동기화</span>
          <span className="text-gray-700 font-medium">
            {formatDateTimeKo(asset.last_synced_at)}
          </span>
        </div>
      </div>

      {/* 권장 다운로드 구간 */}
      <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2.5">
        <p className="text-xs text-blue-500 font-medium mb-0.5">권장 다운로드 구간</p>
        <p className="text-sm text-blue-800 font-semibold">
          👉 {formatDateKo(asset.recommended_start_date)} ~ 오늘
          {isCard ? ' (어제까지 권장)' : ''}
        </p>
      </div>

      {/* 신용카드 pending 경고 */}
      {isCard && (
        <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5">
          ⚠️ 오늘 결제건은 아직 매입 확정 전일 수 있습니다. 가급적 어제까지만 받아주세요.
        </p>
      )}

      {/* 은행 바로가기 버튼 */}
      {bankLink && (
        <a
          href={bankLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-1.5
                     rounded-lg border border-gray-300 py-2 text-sm text-gray-600
                     hover:bg-gray-50 transition-colors"
        >
          🔗 {bankLink.label} 바로가기
        </a>
      )}
    </div>
  );
}
```

### 6-C. `AssetTypeBadge` — 자산 유형 뱃지

```tsx
const ASSET_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  bank:       { label: '통장',   className: 'bg-sky-100   text-sky-700'   },
  card:       { label: '카드',   className: 'bg-rose-100  text-rose-700'  },
  cash:       { label: '현금',   className: 'bg-green-100 text-green-700' },
  investment: { label: '투자',   className: 'bg-amber-100 text-amber-700' },
};

function AssetTypeBadge({ type }: { type: string }) {
  const style = ASSET_TYPE_STYLES[type] ?? { label: type, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}
```

### 6-D. 스켈레톤 / 에러 상태

```tsx
function SyncGuideSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-gray-100 h-48 animate-pulse" />
      ))}
    </div>
  );
}

function SyncGuideError() {
  return (
    <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
      동기화 정보를 불러오지 못했습니다. 새로고침 해주세요.
    </div>
  );
}
```

---

## Step 7: 기존 임포트 페이지에 연결

**파일 위치:** `src/pages/personal/import/index.tsx` (기존 임포트 페이지)

```tsx
// 기존 임포트 페이지 상단에 추가
import { ImportSyncGuide } from '@/features/import-excel/ui/ImportSyncGuide';

export default function ImportPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* ① 동기화 가이드 — 상단 고정 배치 */}
      <ImportSyncGuide />

      {/* ② 기존 파일 업로드 UI */}
      <ExcelFileUploader onImport={handleImport} />
    </div>
  );
}
```

**`handleImport` 콜백 수정:**

```typescript
// 기존 임포트 핸들러를 아래처럼 교체
async function handleImport(parsedRows: ExcelTransactionRow[], assetId: string) {
  setIsLoading(true);
  try {
    const result = await importExcelTransactions(parsedRows, assetId);

    toast.success(
      `완료: ${result.inserted}건 추가, ${result.skipped}건 중복 제거`
    );

    // 동기화 가이드 캐시 무효화 → 자동 재조회
    queryClient.invalidateQueries({ queryKey: ['import-sync-guide'] });

  } catch (e) {
    toast.error('임포트 중 오류가 발생했습니다.');
  } finally {
    setIsLoading(false);
  }
}
```

---

## Step 8: 테스트 체크리스트

구현 완료 후 아래 항목을 순서대로 확인합니다.

**DB 마이그레이션:**
- [ ] `assets.last_synced_at` 컬럼 존재 여부
- [ ] `transactions.import_hash` 조건부 유니크 인덱스 동작 확인
  - NULL 여러 개 → 통과 (기존 수동 데이터)
  - 동일 hash 2개 삽입 → 두 번째 무시됨
- [ ] `transactions.source` CHECK constraint 확인
  - `'MANUAL'`, `'EXCEL'` → OK
  - `'OTHER'` → 에러

**해시 생성:**
- [ ] 동일 데이터 두 번 실행 → 동일 hash 반환 (결정적)
- [ ] description에 `_` 포함된 경우도 올바르게 구분 (`|` 구분자)
- [ ] date가 `YYYY-MM-DD` 아닌 경우 → 파서가 변환 후 전달하는지 확인

**권장 날짜 계산:**
- [ ] 마지막 거래일 2026-02-28 → 권장 시작일 2026-02-25 (3일 전)
- [ ] 거래 이력 없는 신규 자산 → 오늘 기준 30일 전
- [ ] 신용카드 타입 → UI에 "어제까지 권장" 경고 표시

**임포트 로직:**
- [ ] 100건 이하 → 1번의 upsert 호출
- [ ] 151건 → 2번의 upsert 호출 (150 + 1)
- [ ] 이미 있는 hash 포함 업로드 → inserted + skipped 합산이 전체 rows 수와 일치
- [ ] 전체 성공 시 `assets.last_synced_at` 갱신 확인
- [ ] 청크 중 하나 실패 → 나머지 청크 계속 처리, errors 배열에 기록

**UI:**
- [ ] `ImportSyncGuide` 로딩 중 → 스켈레톤 표시
- [ ] 자산 타입별 뱃지 색상 구분 (통장/카드/현금/투자)
- [ ] 은행 이름 포함 자산 → 바로가기 버튼 표시
- [ ] 은행 이름 미포함 자산 → 바로가기 버튼 숨김
- [ ] 임포트 완료 후 카드 즉시 갱신 (쿼리 invalidate 확인)

---

## 파일 생성 목록 요약

```
신규 생성:
  src/features/import-excel/
  ├── lib/
  │   └── utils.ts                     ← Step 3 (해시, 날짜, 청킹, 은행URL)
  ├── model/
  │   └── useImportSyncGuide.ts        ← Step 4 (React Query 훅)
  ├── api/
  │   └── importExcelTransactions.ts   ← Step 5 (upsert 로직)
  └── ui/
      └── ImportSyncGuide.tsx          ← Step 6 (UI 컴포넌트)

기존 수정:
  src/entities/asset/types.ts          ← last_synced_at 추가
  src/entities/transaction/types.ts    ← import_hash, source, ExcelTransactionRow 추가
  src/pages/personal/import/index.tsx  ← ImportSyncGuide 삽입, handleImport 교체
```
