-- Fix RLS Policy for SELECT on Transactions
-- Ensures users can only see their own data

DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;

CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Also ensure mdt_categories is readable (should already be, but safer to re-run)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON mdt_categories;
CREATE POLICY "Categories are viewable by everyone"
ON mdt_categories FOR SELECT
USING (true);

-- Grant again just to be 100% sure
GRANT ALL ON TABLE transactions TO authenticated;
GRANT ALL ON TABLE mdt_categories TO authenticated;
