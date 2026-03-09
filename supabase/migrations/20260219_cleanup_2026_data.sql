-- [Cleanup Script] Delete all transactions for 2026
-- Run this in Supabase SQL Editor to clear "Bad Data" before re-uploading.

DELETE FROM transactions 
WHERE date >= '2026-01-01' 
  AND date < '2027-01-01';
