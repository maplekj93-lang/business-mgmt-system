-- 20260305_fix_unclassified_stats_rpc.sql
-- Fix: get_unclassified_stats was missing owner_type and amount fields
-- Also improved grouping: now groups by (raw_name, owner_type) for better separation
DROP FUNCTION IF EXISTS get_unclassified_stats();

CREATE OR REPLACE FUNCTION get_unclassified_stats()
RETURNS TABLE (
    raw_name text,
    amount numeric,       -- [FIX] SUM(amount), matches frontend UnclassifiedRpcResponse.amount
    owner_type text,      -- [FIX] Added: was missing, causing all badges to show '미상'
    count bigint,
    total_amount numeric,
    sample_date timestamp,
    transaction_ids uuid[],
    type text
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
SELECT
    COALESCE(source_raw_data->>'original_category', description, 'Unknown') as raw_name,
    SUM(amount) as amount,
    COALESCE(owner_type, 'other') as owner_type,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    MAX(date) as sample_date,
    array_agg(id) as transaction_ids,
    CASE WHEN SUM(amount) >= 0 THEN 'income' ELSE 'expense' END as type
FROM transactions
WHERE category_id IS NULL
AND user_id = auth.uid()
GROUP BY 1, 3   -- Group by raw_name AND owner_type (e.g., 이마트-광준, 이마트-의영 separate)
ORDER BY 4 DESC;
$$;
