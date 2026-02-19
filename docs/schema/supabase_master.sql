-- BrightGlory 가계부 Schema V1.0 (Metadata-Driven & Multi-Currency)

-- 1. Profiles & Config
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  preferred_currency TEXT DEFAULT 'KRW',
  additional_currencies TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Metadata Tables (Sovereignty)
CREATE TABLE mdt_categories (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  parent_id INTEGER REFERENCES mdt_categories(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
  ui_config JSONB DEFAULT '{"icon": "default", "color": "gray"}',
  is_business_only BOOLEAN DEFAULT FALSE
);

CREATE TABLE mdt_business_rules (
  id SERIAL PRIMARY KEY,
  rule_key TEXT NOT NULL,
  rule_value JSONB NOT NULL,
  description TEXT
);

-- 3. Business Units & Assets
CREATE TABLE business_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT, -- 'production', 'creative', 'commerce'
  metadata JSONB DEFAULT '{}', -- [NEW] owner, role 정보 저장을 위해 추가됨
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assets_liabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('asset', 'liability', 'investment')),
  current_valuation DECIMAL(15, 2) NOT NULL,
  is_business_asset BOOLEAN DEFAULT FALSE
);

-- 4. Transactions (Dual-Track Core)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  category_id INTEGER REFERENCES mdt_categories(id),
  
  -- Dual-Track Logic
  allocation_status TEXT DEFAULT 'personal' CHECK (allocation_status IN ('personal', 'business_unallocated', 'business_allocated')),
  business_unit_id UUID REFERENCES business_units(id),
  
  amount DECIMAL(15, 2) NOT NULL,
  original_currency TEXT DEFAULT 'KRW', -- Multi-Currency
  date DATE NOT NULL,
  description TEXT,
  
  -- Import Integrity
  import_batch_id UUID,
  source_raw_data JSONB
);

-- 5. Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own data" ON transactions FOR ALL USING (auth.uid() = user_id);
