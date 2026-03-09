import React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/shared/api/supabase/server';
import { getTransactions } from '@/entities/transaction/api/get-transactions';
import { getBusinessUnits } from '@/entities/business';
import { getAllCategories } from '@/entities/category/api/get-categories';
import { Category } from '@/entities/category/model/types';
import { FilterBar } from '@/features/filter-transactions/ui/filter-bar';
import { TransactionTable } from './transaction-table';
import { getAssets } from '@/entities/asset/api/get-assets';

async function TransactionHistoryWidget({
    searchParams
}: {
    searchParams?: { year?: string; month?: string }
}) {
    // 1. Context Read
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const cookieStore = await cookies();
    const appMode = (cookieStore.get('app-mode')?.value as 'personal' | 'business') || 'personal';

    const year = searchParams?.year ? Number(searchParams.year) : new Date().getFullYear();
    const month = searchParams?.month ? Number(searchParams.month) : undefined;
    const limit = month ? 1000 : 100;

    if (!user) {
        return (
            <div className="glass-panel p-12 text-center space-y-4">
                <h3 className="text-xl font-bold italic opacity-50 text-foreground">Transaction History Blocked</h3>
                <p className="text-muted-foreground text-sm">Authentication required to view detailed ledger entries.</p>
            </div>
        );
    }

    // 2. Parallel Fetching with Context
    const [transactions, businessUnits, categories, assets] = await Promise.all([
        getTransactions({
            page: 1,
            limit,
            year,
            month,
            mode: appMode // API에 모드 전달
        }),
        getBusinessUnits(),
        getAllCategories(),
        getAssets()
    ]);

    // [Logic] Client-Side hydration of Category Hierarchy
    // This bypasses Supabase nested join quirks.
    const categoryMap = new Map<number, Category>();
    categories.forEach(c => categoryMap.set(c.id, c));

    const hydratedTransactions = transactions.map(tx => {
        // Find category info from valid map
        let categoryInfo = undefined;
        if (tx.category_id && categoryMap.has(tx.category_id)) {
            const cat = categoryMap.get(tx.category_id)!;
            const parent = cat.parent_id ? categoryMap.get(cat.parent_id) : undefined;

            categoryInfo = {
                name: cat.name,
                type: cat.type || 'expense',
                parent: parent ? { name: parent.name } : undefined
            };
        } else if (tx.category) {
            // Fallback to what API gave us (legacy safety)
            categoryInfo = {
                name: tx.category.name,
                type: (tx.category.type || 'expense') as string,
                parent: Array.isArray(tx.category.parent) ? (tx.category.parent[0] as any) : tx.category.parent
            };
        }

        return {
            ...tx,
            description: tx.description || '',
            business_unit_id: tx.business_unit_id || null,
            category: categoryInfo,
            asset: tx.asset // [NEW] Pass through
        };
    });

    return (
        // ✅ Glassmorphism Container Applied (헌법 제4조)
        <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">
                        {appMode === 'business' ? '사업 지출 내역' : '거래 내역'}
                    </h2>
                    {/* 모드 표시 배지 */}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${appMode === 'business'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-primary/10 text-primary'
                        }`}>
                        {appMode === 'business' ? 'Business Mode' : 'Personal Mode'}
                    </span>
                </div>
                <span className="text-sm text-muted-foreground">{transactions.length}건 조회됨</span>
            </div>

            <FilterBar />

            {/* Client Component */}
            <TransactionTable
                transactions={hydratedTransactions}
                businessUnits={businessUnits}
                assets={assets}
            // currentMode={appMode} // If needed for table UI logic
            />
        </div>
    );
}

export { TransactionHistoryWidget };
