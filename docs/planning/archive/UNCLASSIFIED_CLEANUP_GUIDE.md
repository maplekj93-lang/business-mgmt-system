# 미분류(Unclassified) 내역 정리 및 복구 가이드

최근 확인된 문제로, 81건의 내역이 `assets` 권한 에러 등으로 인해 자산과 소유자 매핑이 유실되거나 미분류 상태로 남아있습니다.
`IMPLEMENTATION_GUIDE.md`에 따라 거래내역 독립 소유자 모델이 적용된 후, 이 가이드를 통해 데이터를 정상화해야 합니다.

## 1. 현재 상황 분석

*   기존 업로드된 엑셀 데이터의 원본 내용(`source_raw_data`)은 보존되어 있으나, 이를 통한 `asset_id` 매핑이 누락되었을 수 있습니다.
*   새로운 아키텍처 도입(`owner_type` 컬럼 추가) 전에 업로드된 데이터의 경우 소유자가 `null` 또는 `other`(미상)로 처리되었을 가능성이 높습니다.
*   일부 내역은 분석 카테고리 로직이 실패하여 '미분류'로 남아있습니다.

## 2. 81건 미분류 정리 방법 (DB 스크립트 활용)

건건이 수동 매핑하는 대신, SQL 스크립트를 활용하여 패턴 기반 일괄 수정을 우선 적용합니다.

### A. 자산(Asset) 재매핑 스크립트

엑셀의 원본 로그(ex: `_bank`, 계좌번호/카드번호 키워드 등)를 기반으로 자동으로 매핑을 재시도합니다. (로컬 Supabase SQL 쿼리 러너에서 실행 가능)

```sql
-- 예시: source_raw_data의 '_bank' 필드를 파싱하여 매칭되는 자산 ID를 찾아 할당하는 쿼리 패턴
-- 주의: 실제 assets 테이블의 식별자(identifier_keywords)나 이름 구조에 맞춰 LIKE/JSON 연산자를 조정해야 합니다.
UPDATE public.transactions t
SET asset_id = a.id
FROM public.assets a
WHERE t.asset_id IS NULL
  AND t.source_raw_data->>'_bank' ILIKE '%' || a.name || '%';

-- (결과 확인 후 COMMIT 하거나, 안전하게 SELECT로 먼저 영향도를 확인하세요)
SELECT count(*) FROM public.transactions WHERE asset_id IS NULL;
```

### B. 소유자(Owner) 자동 초기화

자산 매핑이 완료된 후, 자산의 소유자 정보를 따라가도록(새로운 스키마 구조에 맞춰) 기본 소유자를 다시 채워줍니다.

```sql
UPDATE public.transactions t
SET owner_type = a.owner_type
FROM public.assets a
WHERE t.asset_id = a.id
  AND t.owner_type IS NULL;
```

### C. 잔여 내역 手動 정리 (UI 활용)

스크립트로 정리되지 않은 나머지 내역(ex: 힌트가 부족한 현금 거래, 특수 결제 등)은 UI를 활용해 정리합니다.

1.  `business-mgmt-system` 애플리케이션에 접속합니다.
2.  **FilterBar**에서 `Category = 미분류` 및 `소유자 = 미상` (또는 `자산 = 선택안됨`) 필터를 적용합니다.
3.  목록에 나타난 남은 미분류 내역들에 대해:
    *   **내용(Description)** 및 원본 기록(테이블의 기타 상세 정보)을 참고합니다.
    *   방금 추가한 UI 기능(소유자 Popover, 자산 Popover)을 사용해 수동으로 할당합니다.
    *   *Tip:* 동일한 내용의 지출이 여러 건이라면 "동일한 내용 일괄 업데이트" 체크박스/기능을 적극 활용하세요.

## 3. 원본 내용 복구 (추가 팁)

만약 `description` 필드가 의도치 않게 비워졌거나 이상하게 파싱되었다면, `source_raw_data`의 원본 적요/가맹점 정보를 다시 끌어올 수 있습니다.

```sql
-- 엑셀 원본의 '내용' 혹은 '가맹점명' 필드를 다시 description으로 복구
UPDATE public.transactions
SET description = COALESCE(
    source_raw_data->>'가맹점명',
    source_raw_data->>'적요',
    source_raw_data->>'내용',
    description
)
WHERE description IS NULL OR description = '';
```

위의 단계들을 통해 유실된 매핑 정보를 복구하고 시스템을 최신 상태(옵션 B 구조)로 완벽하게 동기화할 수 있습니다.
