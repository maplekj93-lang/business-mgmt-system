-- RLS Repair Script
-- Explicitly drop and recreate the policy for transactions to ensure access.

BEGIN;

-- 1. Ensure RLS is enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (to avoid conflicts or stale definitions)
DROP POLICY IF EXISTS "Users can only access their own data" ON transactions;
DROP POLICY IF EXISTS "Users can view their own data" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own data" ON transactions;
DROP POLICY IF EXISTS "Users can update their own data" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own data" ON transactions;

-- 3. Create comprehensive policies
-- SELECT
CREATE POLICY "Users can view their own data" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own data" 
ON transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own data" 
ON transactions FOR UPDATE 
USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete their own data" 
ON transactions FOR DELETE 
USING (auth.uid() = user_id);

COMMIT;
