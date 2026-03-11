-- 20260310_add_auto_record_to_recurring.sql
-- 고정비/구독 관리에서 매월 고정 결제(자동 기록)와 유동 결제(수동 기록)를 구분하기 위한 필드 추가

ALTER TABLE recurring_expenses
ADD COLUMN is_auto_record BOOLEAN DEFAULT true;

COMMENT ON COLUMN recurring_expenses.is_auto_record IS 'true면 자동 기록 대상, false면 캘린더에는 표기되나 수동 결제 클릭 필요';
