# Phase 3: Data Refinement - Full Implementation Summary

This document consolidates the key code items implemented during Phase 3, focusing on the **Unclassified Inbox**, **Rule Engine**, and **Legacy Support**.

---

## 1. Database Layer (RPC)
The logic for grouping unclassified transactions by their raw source names was moved to the database for performance and type safety.

**File:** `supabase/migrations/20260205_create_unclassified_rpc.sql`
```sql
CREATE OR REPLACE FUNCTION get_unclassified_stats()
RETURNS TABLE (
  raw_name text,
  count bigint,
  total_amount numeric,
  sample_date timestamp,
  transaction_ids uuid[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      source_raw_data->>'original_category', 
      description,
      'Unknown'
    ) as raw_name,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    MAX(date) as sample_date,
    array_agg(id) as transaction_ids
  FROM transactions
  WHERE category_id IS NULL
  AND user_id = auth.uid()
  GROUP BY 1
  ORDER BY 2 DESC;
$$;
```

---

## 2. API Layer: Data Fetching
The server-side API that invokes the RPC and maps it to a UI-friendly model.

**File:** `src/entities/transaction/api/get-unclassified.ts`
```typescript
'use server'

import { createClient } from '@/shared/api/supabase/server';

export interface UnclassifiedGroup {
    rawName: string;
    count: number;
    transactionIds: string[];
    sampleDate: string;
    totalAmount: number;
}

export async function getUnclassifiedTransactions(): Promise<UnclassifiedGroup[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_unclassified_stats');

    if (error) throw new Error('Failed to fetch unclassified stats');

    return data.map((row: any) => ({
        rawName: row.raw_name,
        count: Number(row.count),
        transactionIds: row.transaction_ids,
        sampleDate: row.sample_date ? new Date(row.sample_date).toISOString().split('T')[0] : '',
        totalAmount: Number(row.total_amount)
    }));
}
```

---

## 3. API Layer: Bulk Update & Rule Engine
This action handles mass categorization and optionally creates a persistent rule for future automated classification.

**File:** `src/features/refine-ledger/api/bulk-update.ts`
```typescript
'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

export async function bulkUpdateTransactions(
    transactionIds: string[],
    categoryId: number,
    createRule: boolean,
    ruleKeyword?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    try {
        // 1. Update Transactions
        await supabase.from('transactions').update({
            category_id: categoryId,
            allocation_status: 'personal' 
        }).in('id', transactionIds);

        // 2. Persistent Rule Creation
        if (createRule && ruleKeyword) {
            await supabase.from('mdt_allocation_rules').upsert({
                user_id: user.id,
                keyword: ruleKeyword,
                category_id: categoryId
            }, { onConflict: 'user_id, keyword' });
        }

        revalidatePath('/transactions/unclassified');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
```

---

## 4. UI Layer: Bulk Assigner Component
A sophisticated combobox component (using Radix Popover and Command) for classifying groups with one click.

**File:** `src/features/refine-ledger/ui/bulk-assigner.tsx`
```tsx
'use client';

import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Checkbox } from '@/shared/ui/checkbox';
import { bulkUpdateTransactions } from '../api/bulk-update';

export function BulkAssigner({ group, categories }) {
    const [open, setOpen] = React.useState(false);
    const [createRule, setCreateRule] = React.useState(true);

    const onSelectCategory = async (categoryId: number) => {
        setOpen(false);
        const res = await bulkUpdateTransactions(
            group.transactionIds,
            categoryId,
            createRule,
            group.rawName
        );
        if (!res.success) alert(res.message);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-[220px] text-xs">카테고리 선택...</Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="카테고리 검색..." />
                    <CommandList>
                        {categories.map((group) => (
                            <CommandGroup key={group.main.id} heading={group.main.name}>
                                {group.subs.map((sub) => (
                                    <CommandItem key={sub.id} onSelect={() => onSelectCategory(sub.id)}>
                                        {sub.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                    <div className="p-3 border-t">
                        <Checkbox checked={createRule} onCheckedChange={(c) => setCreateRule(c === true)} />
                        <label>'{group.rawName}' 자동 분류 규칙 생성</label>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
```

---

## 5. Logic: Legacy Parser Support
The legacy bridge logic that maps specifically named columns from old Excel files to standardized 2025 categories.

**File:** `src/features/ledger-import/model/parser.ts`
```typescript
const HEADER_MAPPING_2024: Record<string, string> = {
    'Expense 1': '🏠 주거비 > 관리비',
    'Expense 3': '🍽️ 식비 > 식자재',
    'Expense 6': '🩺 건강 > 병원비',
    'Expense 14': '🍽️ 식비 > 외식',
    'Expense 17': '☕️ 커피 > 커피'
    // ... total 17 mappings
};
```
