-- Migration: Create RPC for Filtered Transactions
-- Purpose: Move list filtering logic to DB to support complex OR conditions (Constitution Art 3)

DROP FUNCTION IF EXISTS get_filtered_transactions(text, int, int, int, int);

CREATE OR REPLACE FUNCTION get_filtered_transactions(
  p_mode text DEFAULT 'personal',
  p_year int DEFAULT NULL,
  p_month int DEFAULT NULL,
  p_page int DEFAULT 1,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  date date,
  amount numeric,
  description text,
  category_id int,
  allocation_status text,
  business_unit_id uuid,
  source_raw_data jsonb,
  category_name text,
  category_type text,
  category_icon text,
  category_color text,
  parent_category_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_offset int := (p_page - 1) * p_limit;
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.date,
    t.amount,
    t.description,
    t.category_id,
    t.allocation_status,
    t.business_unit_id,
    t.source_raw_data,
    c.name as category_name,
    c.type as category_type,
    c.ui_config->>'icon' as category_icon,
    c.ui_config->>'color' as category_color,
    pc.name as parent_category_name
  FROM transactions t
  LEFT JOIN mdt_categories c ON t.category_id = c.id
  LEFT JOIN mdt_categories pc ON c.parent_id = pc.id
  WHERE t.user_id = v_user_id
  AND (
    (p_mode = 'personal' AND t.allocation_status = 'personal' AND COALESCE(c.is_business_only, FALSE) = FALSE)
    OR
    (p_mode = 'business' AND (t.business_unit_id IS NOT NULL OR COALESCE(c.is_business_only, FALSE) = TRUE))
  )
  AND (p_year IS NULL OR EXTRACT(YEAR FROM t.date) = p_year)
  AND (p_month IS NULL OR EXTRACT(MONTH FROM t.date) = p_month)
  ORDER BY t.date DESC, t.id ASC
  LIMIT p_limit OFFSET v_offset;
END;
$$;
