-- 20260311_cleanup_and_ignore_keywords.sql
-- Cleanup '가승인' (pre-auth) records as requested by user

-- 1. 가승인 데이터 삭제
DELETE FROM transactions 
WHERE description LIKE '%가승인%' 
   OR source_raw_data->>'original_category' LIKE '%가승인%';

-- 2. 0원 거래 삭제 (불필요한 데이터)
DELETE FROM transactions 
WHERE amount = 0;

-- 2. 그룹화 로직 고도화 (가맹점명 기준 + 수입/지출 분리)
CREATE OR REPLACE FUNCTION get_unclassified_stats()
RETURNS TABLE (
    raw_name text,
    amount numeric,
    owner_type text,
    count bigint,
    total_amount numeric,
    sample_date timestamp,
    transaction_ids uuid[],
    type text
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
SELECT
    COALESCE(
        NULLIF(source_raw_data->>'original_category', 'Uncategorized'), 
        description, 
        'Unknown'
    ) as raw_name,
    SUM(amount) as amount,
    COALESCE(owner_type, 'other') as owner_type,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    MAX(date) as sample_date,
    array_agg(id) as transaction_ids,
    -- Grouping에 'type'을 추가하여 지출과 취소(수입)가 섞이지 않도록 분리
    CASE WHEN amount >= 0 THEN 'income' ELSE 'expense' END as type
FROM transactions
WHERE category_id IS NULL
AND user_id = auth.uid()
GROUP BY 1, 3, 8  -- raw_name, owner_type, AND type (분리 표시)
ORDER BY 4 DESC;
$$;
