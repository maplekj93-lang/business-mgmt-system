-- 20260311_refine_unclassified_grouping.sql
-- Refine unclassified grouping to separate generic "Uncategorized" items by description

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
    CASE WHEN SUM(amount) >= 0 THEN 'income' ELSE 'expense' END as type
FROM transactions
WHERE category_id IS NULL
AND user_id = auth.uid()
GROUP BY 1, 3
ORDER BY 4 DESC;
$$;
