-- Task 3: Create recurring_expenses table for automated subscription tracking
-- This table stores monthly/quarterly/annual subscription configurations
-- and tracks when they are automatically recorded as transactions
CREATE TABLE public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Basic info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES mdt_categories(id),
    amount NUMERIC NOT NULL,
    -- Scheduling
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annual')),
    due_day_of_month INT CHECK (
        due_day_of_month BETWEEN 1 AND 31
    ),
    next_due_date DATE,
    -- Business rules
    owner_type VARCHAR(20),
    is_business BOOLEAN DEFAULT true,
    allocation_status VARCHAR(20),
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
    last_recorded_date DATE,
    last_matched_transaction_id UUID REFERENCES public.transactions(id),
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Enable Row Level Security
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
-- RLS Policies for user data isolation
CREATE POLICY "Users can view own recurring expenses" ON public.recurring_expenses FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring expenses" ON public.recurring_expenses FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring expenses" ON public.recurring_expenses FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring expenses" ON public.recurring_expenses FOR DELETE USING (auth.uid() = user_id);
-- Indexes for common queries
CREATE INDEX idx_recurring_user_status ON public.recurring_expenses(user_id, status);
CREATE INDEX idx_recurring_due_date ON public.recurring_expenses(user_id, next_due_date);
CREATE INDEX idx_recurring_owner ON public.recurring_expenses(user_id, owner_type);