-- [Phase 9: Security Hardening - RLS Implementation]
-- Purpose: Resolve security advisor warnings and enforce strict data ownership.

-- 1. Add missing user_id columns for data ownership
-- mdt_business_rules (Note: if these are global, we might not need user_id, but per user instructions to harden security, we add it)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mdt_business_rules' AND column_name = 'user_id') THEN
        ALTER TABLE mdt_business_rules ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- business_units
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_units' AND column_name = 'user_id') THEN
        ALTER TABLE business_units ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- If existing data exists, we should associate it with the current user if possible, 
        -- but for a clean fix, we just allow NULL or set a default if needed. 
        -- Here we assume the single user system context.
        UPDATE business_units SET user_id = (SELECT id FROM profiles LIMIT 1) WHERE user_id IS NULL;
    END IF;
END $$;

-- assets_liabilities
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets_liabilities' AND column_name = 'user_id') THEN
        ALTER TABLE assets_liabilities ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        UPDATE assets_liabilities SET user_id = (SELECT id FROM profiles LIMIT 1) WHERE user_id IS NULL;
    END IF;
END $$;

-- 2. Enable Row Level Security (RLS) on all core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdt_business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets_liabilities ENABLE ROW LEVEL SECURITY;
-- (Transactions already has RLS enabled in supabase_master.sql)

-- 3. Define Access Policies

-- Profiles: Users can see and update their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles 
    FOR ALL USING (auth.uid() = id);

-- Categories: Users manage their own categories
DROP POLICY IF EXISTS "Users can manage own categories" ON mdt_categories;
CREATE POLICY "Users can manage own categories" ON mdt_categories 
    FOR ALL USING (auth.uid() = user_id);

-- Business Rules: Users manage their own rules
DROP POLICY IF EXISTS "Users can manage own rules" ON mdt_business_rules;
CREATE POLICY "Users can manage own rules" ON mdt_business_rules 
    FOR ALL USING (auth.uid() = user_id);

-- Business Units: Users manage their own units
DROP POLICY IF EXISTS "Users can manage own units" ON business_units;
CREATE POLICY "Users can manage own units" ON business_units 
    FOR ALL USING (auth.uid() = user_id);

-- Assets & Liabilities: Users manage their own assets
DROP POLICY IF EXISTS "Users can manage own assets" ON assets_liabilities;
CREATE POLICY "Users can manage own assets" ON assets_liabilities 
    FOR ALL USING (auth.uid() = user_id);

-- 4. Verification Check
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
