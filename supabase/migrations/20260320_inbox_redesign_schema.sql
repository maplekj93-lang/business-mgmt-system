-- 20260320_inbox_redesign_schema.sql
-- Add normalized_name to transactions, create ungroupable_merchants table, and update RPC

-- 1. Add normalized_name to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS normalized_name TEXT;

-- Index for normalized_name
CREATE INDEX IF NOT EXISTS idx_transactions_normalized_name ON transactions(normalized_name);

-- 2. Create ungroupable_merchants table
CREATE TABLE IF NOT EXISTS ungroupable_merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    normalized_name TEXT UNIQUE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for ungroupable_merchants
ALTER TABLE ungroupable_merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to ungroupable_merchants" 
ON ungroupable_merchants FOR ALL 
USING (auth.role() = 'authenticated');

-- Seed initial ungroupable merchants
INSERT INTO ungroupable_merchants (normalized_name, reason)
VALUES 
    ('쿠팡', '식품/의류/전자기기 등 품목 혼재'),
    ('COUPANG', '쿠팡 영문 표기'),
    ('쿠팡이츠', '배달 음식 종류 매번 다름'),
    ('배달의민족', '배달 음식 종류 매번 다름'),
    ('요기요', '배달 음식 종류 매번 다름'),
    ('카카오페이', '실제 가맹점 불명'),
    ('네이버페이', '실제 가맹점 불명'),
    ('토스페이', '실제 가맹점 불명'),
    ('ATM', '현금 용도 불명'),
    ('현금출금', '용도 불명'),
    ('CD출금', '용도 불명')
ON CONFLICT (normalized_name) DO NOTHING;

-- 3. Update get_unclassified_stats RPC
CREATE OR REPLACE FUNCTION get_unclassified_stats()
RETURNS TABLE (
    raw_name text,
    amount numeric,
    owner_type text,
    count bigint,
    total_amount numeric,
    sample_date timestamp,
    transaction_ids uuid[],
    type text,
    is_groupable boolean
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
WITH unclassified_tx AS (
    SELECT 
        t.*,
        COALESCE(t.normalized_name, t.description, 'Unknown') as effective_name
    FROM transactions t
    WHERE t.category_id IS NULL
    AND t.user_id = auth.uid()
)
SELECT
    ut.effective_name as raw_name,
    SUM(ut.amount) as amount,
    COALESCE(ut.owner_type, 'other') as owner_type,
    COUNT(*) as count,
    SUM(ut.amount) as total_amount,
    MAX(ut.date) as sample_date,
    array_agg(ut.id) as transaction_ids,
    CASE WHEN SUM(ut.amount) >= 0 THEN 'income' ELSE 'expense' END as type,
    CASE 
        WHEN um.normalized_name IS NOT NULL THEN false 
        WHEN COUNT(*) = 1 THEN false 
        ELSE true 
    END as is_groupable
FROM unclassified_tx ut
LEFT JOIN ungroupable_merchants um ON ut.effective_name = um.normalized_name
GROUP BY 1, 3, um.normalized_name
ORDER BY 4 DESC;
$$;
