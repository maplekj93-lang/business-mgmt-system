export const dynamic = 'force-dynamic';
import React from 'react';
import { createClient } from '@/shared/api/supabase/server';
import { getUnclassifiedTransactions } from '@/entities/transaction/api/get-unclassified';
import { getBusinessUnits } from '@/entities/business';
import { BulkAssigner } from '@/features/refine-ledger/ui/bulk-assigner';
import { AutoApplyRulesButton } from '@/features/refine-ledger/ui/auto-apply-rules-button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { AlertCircle } from 'lucide-react';

import { UnclassifiedRow } from '@/features/refine-ledger/ui/unclassified-row';
import { PerItemRow } from '@/features/refine-ledger/ui/per-item-row';
import { OWNER_OPTIONS } from '@/entities/transaction/model/unclassified';

export default async function UnclassifiedInboxPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [groups, businessUnits] = await Promise.all([
        getUnclassifiedTransactions(),
        getBusinessUnits()
    ]);

    // Fetch Categories with Hierarchy
    const { data: categories } = await supabase
        .from('mdt_categories')
        .select('id, name, type, parent_id')
        .order('id');

    interface Category {
        id: number;
        name: string;
        type: 'income' | 'expense' | 'transfer';
        parent_id?: number | null;
    }

    interface CategoryGroup {
        main: {
            id: number;
            name: string;
            type: 'income' | 'expense' | 'transfer';
        };
        subs: {
            id: number;
            name: string;
            type: 'income' | 'expense' | 'transfer';
        }[];
    }

    // Build Tree Structure
    const mainCategories: Category[] = [];
    const subCategoriesMap = new Map<number, Category[]>();

    (categories as Category[])?.forEach(cat => {
        if (!cat.parent_id) {
            mainCategories.push(cat);
        } else {
            const list = subCategoriesMap.get(cat.parent_id) || [];
            list.push(cat);
            subCategoriesMap.set(cat.parent_id, list);
        }
    });

    const structuredCategories: CategoryGroup[] = mainCategories.map(main => ({
        main: {
            id: main.id,
            name: main.name,
            type: main.type
        },
        subs: (subCategoriesMap.get(main.id) || []).map(sub => ({
            id: sub.id,
            name: sub.name,
            type: sub.type
        }))
    }));

    const totalCount = groups.reduce((acc, g) => acc + g.count, 0);
    const groupableItems = groups.filter(g => g.isGroupable);
    const individualItems = groups.filter(g => !g.isGroupable);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        📥 미분류 수신함
                        {totalCount > 0 && <Badge variant="destructive" className="rounded-full shadow-lg border-2 border-background">{totalCount}</Badge>}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        분류되지 않은 거래내역을 정리하세요. 
                        <strong>쿠팡, 배달</strong> 등은 개별 항목으로 표시됩니다.
                    </p>
                </div>
                {totalCount > 0 && (
                    <AutoApplyRulesButton 
                        transactionIds={groups.flatMap(g => g.transactionIds)} 
                    />
                )}
            </div>

            {/* 1. 스마트 그룹핑 (동일 가맹점 대량 처리용) */}
            {groupableItems.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-5 w-1.5 bg-primary/40 rounded-full" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
                            Smart Grouping <span className="text-[10px] font-medium lowercase opacity-50 opacity-100">(자동 그룹화된 내역)</span>
                        </h3>
                    </div>
                    <div className="tactile-panel p-1 rounded-lg overflow-hidden border-primary/10">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[300px]">가맹점 (그룹명)</TableHead>
                                    <TableHead className="w-[100px] text-center">유형</TableHead>
                                    <TableHead className="w-[100px] text-center">건수</TableHead>
                                    <TableHead className="w-[120px] text-right">총액 (추정)</TableHead>
                                    <TableHead className="w-[150px]">최근 발생일</TableHead>
                                    <TableHead>분류 작업 (Bulk Action)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupableItems.map((group) => (
                                    <UnclassifiedRow 
                                        key={group.rawName + group.amount + group.ownerType + group.type}
                                        group={group}
                                        categories={structuredCategories}
                                        businessUnits={businessUnits}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* 2. 개별 확인 항목 (쿠팡, 배달 등) */}
            {individualItems.length > 0 && (
                <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-5 w-1.5 bg-amber-500/40 rounded-full" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
                            Individual Items <span className="text-[10px] font-medium lowercase opacity-50 opacity-100">(개별 확인 필요 내역)</span>
                        </h3>
                    </div>
                    <div className="tactile-panel p-1 rounded-lg overflow-hidden border-amber-500/10">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[300px]">원본 내역 / 날짜</TableHead>
                                    <TableHead className="w-[100px] text-center">유형</TableHead>
                                    <TableHead className="w-[100px] text-center">동일건</TableHead>
                                    <TableHead className="w-[120px] text-right">금액</TableHead>
                                    <TableHead className="w-[150px] hidden lg:table-cell">태그/속성</TableHead>
                                    <TableHead>분류 작업 (Action)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {individualItems.map((group) => (
                                    <PerItemRow 
                                        key={group.rawName + group.amount + group.ownerType + group.type + group.sampleDate}
                                        group={group}
                                        categories={structuredCategories}
                                        businessUnits={businessUnits}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {groups.length === 0 && (
                <div className="tactile-panel p-20 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <AlertCircle className="w-12 h-12 opacity-20 text-primary" />
                        <h3 className="text-lg font-bold">Inbox Zero!</h3>
                        <p className="text-sm opacity-60">모든 내역이 깔끔하게 정리되었습니다.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
