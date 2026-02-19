-- Migration: Add Metadata to Business Units and Insert V2 Units

-- 1. Alter Table to add metadata column if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_units' AND column_name = 'metadata') THEN
        ALTER TABLE business_units ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- 2. Clean up existing units (if re-seeding)
TRUNCATE TABLE business_units CASCADE;

-- 3. Insert V2 Units
INSERT INTO business_units (name, type, metadata) VALUES 
('💡 Lighting Crew', 'production', '{"owner": "husband", "role": "technical"}'),
('🎨 Design Studio', 'creative', '{"owner": "wife", "role": "design"}'),
('📷 Photo & Goods', 'commerce', '{"owner": "joint", "role": "hybrid"}');

-- 4. Verify
SELECT * FROM business_units;
