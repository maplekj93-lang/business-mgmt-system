-- Migration: Create RPC for Unclassified Stats
-- Purpose: Move Inbox grouping logic from App to DB (Constitution Art. 3)

DROP FUNCTION IF EXISTS get_unclassified_stats();

CREATE OR REPLACE FUNCTION get_unclassified_stats()
RETURNS TABLE (
  raw_name text,
  count bigint,
  total_amount numeric,
  sample_date timestamp,
  transaction_ids uuid[],
  type text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      source_raw_data->>'original_category', 
      description,
      'Unknown'
    ) as raw_name,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    MAX(date) as sample_date,
    array_agg(id) as transaction_ids,
    CASE WHEN SUM(amount) >= 0 THEN 'income' ELSE 'expense' END as type
  FROM transactions
  WHERE category_id IS NULL
  AND user_id = auth.uid()
  GROUP BY 1
  ORDER BY 2 DESC;
$$;
