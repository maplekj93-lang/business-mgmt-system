-- Rule Engine Table
CREATE TABLE IF NOT EXISTS mdt_allocation_rules (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL, -- The raw string to match (e.g. "이마트")
  category_id INTEGER REFERENCES mdt_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate rules for same user/keyword
  UNIQUE(user_id, keyword)
);

-- RLS
ALTER TABLE mdt_allocation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own rules" ON mdt_allocation_rules
  FOR ALL USING (auth.uid() = user_id);
