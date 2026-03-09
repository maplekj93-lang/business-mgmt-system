-- 20260219_add_account_id.sql
-- 1. Add account_id to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES assets_liabilities(id) ON DELETE SET NULL;

-- 2. Update RPC get_filtered_transactions to include account info
DROP FUNCTION IF EXISTS get_filtered_transactions(text, int, int, int, int);

CREATE OR REPLACE FUNCTION get_filtered_transactions(
    p_mode text DEFAULT 'personal', p_year int DEFAULT NULL, p_month int DEFAULT NULL, p_page int DEFAULT 1, p_limit int DEFAULT 50
) RETURNS TABLE (
    id uuid, date date, amount numeric, description text, category_id int, allocation_status text, business_unit_id uuid, source_raw_data jsonb,
    category_name text, category_type text, category_icon text, category_color text, parent_category_name text,
    account_id uuid, account_name text, account_owner_id uuid, account_owner_name text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_offset int := (p_page - 1) * p_limit;
BEGIN
    RETURN QUERY
    SELECT t.id, t.date, t.amount, t.description, t.category_id, t.allocation_status, t.business_unit_id, t.source_raw_data,
           c.name, c.type, c.ui_config->>'icon', c.ui_config->>'color', pc.name,
           t.account_id, al.name, al.user_id, p.full_name
    FROM transactions t
    LEFT JOIN mdt_categories c ON t.category_id = c.id
    LEFT JOIN mdt_categories pc ON c.parent_id = pc.id
    LEFT JOIN assets_liabilities al ON t.account_id = al.id
    LEFT JOIN profiles p ON al.user_id = p.id
    WHERE t.user_id = v_user_id
    AND (
        (p_mode = 'total')
        OR
        (p_mode = 'business' AND (t.business_unit_id IS NOT NULL OR COALESCE(c.is_business_only, FALSE) = TRUE))
        OR
        (p_mode = 'personal' AND (
            (t.allocation_status = 'personal' AND COALESCE(c.is_business_only, FALSE) = FALSE)
            OR
            (c.type = 'income' AND COALESCE(c.is_business_only, FALSE) = FALSE)
        ))
    )
    AND (p_year IS NULL OR EXTRACT(YEAR FROM t.date) = p_year)
    AND (p_month IS NULL OR EXTRACT(MONTH FROM t.date) = p_month)
    ORDER BY t.date DESC, t.id ASC LIMIT p_limit OFFSET v_offset;
END;
$$;
