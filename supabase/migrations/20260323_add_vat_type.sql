-- Add vat_type to daily_rate_logs and crew_payments
ALTER TABLE daily_rate_logs 
ADD COLUMN vat_type TEXT DEFAULT 'none' CHECK (vat_type IN ('none', 'include', 'exclude'));

ALTER TABLE crew_payments 
ADD COLUMN vat_type TEXT DEFAULT 'none' CHECK (vat_type IN ('none', 'include', 'exclude'));

-- Update existing records to 'none' (or 'exclude' for user if preferred, but safe to start with 'none')
UPDATE daily_rate_logs SET vat_type = 'none';
UPDATE crew_payments SET vat_type = 'none';
