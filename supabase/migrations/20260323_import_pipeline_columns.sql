-- Import Pipeline: manual_override + raw_description 컬럼 추가
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS manual_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS raw_description TEXT DEFAULT '';

-- 기존 데이터 backfill
UPDATE public.transactions
SET raw_description = COALESCE(description, '')
WHERE raw_description IS NULL OR raw_description = '';

-- 인덱스: manual_override=false 항목만 태깅 룰 적용 시 필터링에 사용
CREATE INDEX IF NOT EXISTS idx_transactions_manual_override
ON public.transactions(user_id, manual_override)
WHERE manual_override = false;
