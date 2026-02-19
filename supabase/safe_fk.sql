-- Migration: Make Business Unit FK Safe (ON DELETE SET NULL)

BEGIN;

-- 1. Drop existing FK constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_business_unit_id_fkey;

-- 2. Add new FK constraint with ON DELETE SET NULL
-- This ensures that if a Business Unit is deleted, the transaction is kept but detached (unit -> null).
ALTER TABLE transactions 
ADD CONSTRAINT transactions_business_unit_id_fkey 
FOREIGN KEY (business_unit_id) 
REFERENCES business_units(id) 
ON DELETE SET NULL;

COMMIT;
