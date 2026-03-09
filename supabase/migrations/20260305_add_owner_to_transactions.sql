-- Phase 1-1: Add owner_type to transactions and migrate data
-- 1. transactions 테이블에 owner_type 컬럼 추가 (null 허용, 기본값 없음)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS owner_type TEXT;
-- 2. 기존 transactions 데이터 마이그레이션 (연결된 자산의 owner_type으로 업데이트)
UPDATE public.transactions t
SET owner_type = a.owner_type
FROM public.assets a
WHERE t.asset_id = a.id
    AND t.owner_type IS NULL;
-- 3. 자산이 없는 내역에 대한 기본 소유자 설정 (선택적)
-- 미분류 내역은 'other'(미상)으로 지정
UPDATE public.transactions
SET owner_type = 'other'
WHERE owner_type IS NULL;