-- 20260303_update_filtered_transactions_rpc.sql
-- Update RPC get_filtered_transactions to include new asset and project info
DROP FUNCTION IF EXISTS get_filtered_transactions(text, int, int, int, int);
CREATE OR REPLACE FUNCTION get_filtered_transactions(
        p_mode text DEFAULT 'personal',
        p_year int DEFAULT NULL,
        p_month int DEFAULT NULL,
        p_page int DEFAULT 1,
        p_limit int DEFAULT 50
    ) RETURNS TABLE (
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
        parent_category_name text,
        asset_id uuid,
        asset_name text,
        asset_type text,
        owner_type text,
        tx_owner_type text,
        project_id uuid,
        project_name text,
        receipt_memo text,
        is_reimbursable boolean
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid();
v_offset int := (p_page - 1) * p_limit;
BEGIN RETURN QUERY
SELECT t.id,
    t.date,
    t.amount,
    t.description,
    t.category_id,
    t.allocation_status,
    t.business_unit_id,
    t.source_raw_data,
    c.name,
    c.type,
    c.ui_config->>'icon',
    c.ui_config->>'color',
    pc.name,
    t.asset_id,
    a.name,
    a.asset_type,
    a.owner_type,
    t.owner_type as tx_owner_type,
    t.project_id,
    pr.name,
    t.receipt_memo,
    t.is_reimbursable
FROM transactions t
    LEFT JOIN mdt_categories c ON t.category_id = c.id
    LEFT JOIN mdt_categories pc ON c.parent_id = pc.id
    LEFT JOIN assets a ON t.asset_id = a.id
    LEFT JOIN projects pr ON t.project_id = pr.id
WHERE t.user_id = v_user_id
    AND (
        (p_mode = 'total')
        OR (
            p_mode = 'business'
            AND (
                t.business_unit_id IS NOT NULL
                OR COALESCE(c.is_business_only, FALSE) = TRUE
            )
        )
        OR (
            p_mode = 'personal'
            AND (
                (
                    t.allocation_status = 'personal'
                    AND COALESCE(c.is_business_only, FALSE) = FALSE
                )
                OR (
                    c.type = 'income'
                    AND COALESCE(c.is_business_only, FALSE) = FALSE
                )
            )
        )
    )
    AND (
        p_year IS NULL
        OR EXTRACT(
            YEAR
            FROM t.date
        ) = p_year
    )
    AND (
        p_month IS NULL
        OR EXTRACT(
            MONTH
            FROM t.date
        ) = p_month
    )
ORDER BY t.date DESC,
    t.id ASC
LIMIT p_limit OFFSET v_offset;
END;
$$;