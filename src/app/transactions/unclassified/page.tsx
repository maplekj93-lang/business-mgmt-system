import React from 'react';
import { createClient } from '@/shared/api/supabase/server';
import { getUnclassifiedTransactions } from '@/entities/transaction/api/get-unclassified';
import { getBusinessUnits } from '@/entities/business';
import { BulkAssigner } from '@/features/refine-ledger/ui/bulk-assigner';
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

import { Header } from '@/widgets/layout/ui/header';
import { cookies } from 'next/headers';

const OWNER_OPTIONS = [
    { value: 'kwangjun', label: '광준' },
    { value: 'euiyoung', label: '의영' },
    { value: 'joint', label: '공동' },
    { value: 'business', label: '회사' },
    { value: 'other', label: '미상/기타' }
] as const;

export default async function UnclassifiedInboxPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [groups, businessUnits] = await Promise.all([
        getUnclassifiedTransactions(),
        getBusinessUnits()
    ]);

    // Get Default Mode from Cookie
    const cookieStore = await cookies();
    const defaultMode = (cookieStore.get('app-mode')?.value as 'personal' | 'business') || 'personal';

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

    return (
        <div className="min-h-screen bg-background">
            <Header userEmail={user?.email} defaultMode={defaultMode} />

            <main className="container max-w-7xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in slide-in-from-bottom-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            📥 미분류 수신함
                            {totalCount > 0 && <Badge variant="destructive" className="rounded-full">{totalCount}</Badge>}
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            분류되지 않은 거래내역을 그룹별로 정리하세요.
                            규칙을 생성하면 다음부터 자동으로 분류됩니다.
                        </p>
                    </div>
                </div>

                <div className="glass-panel p-1 rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[300px]">원본 내역 (Raw Text)</TableHead>
                                <TableHead className="w-[100px] text-center">유형</TableHead>
                                <TableHead className="w-[100px] text-center">건수</TableHead>
                                <TableHead className="w-[120px] text-right">총액 (추정)</TableHead>
                                <TableHead className="w-[150px]">최신 발생일</TableHead>
                                <TableHead>분류 작업 (Action)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                            <AlertCircle className="w-8 h-8 opacity-50" />
                                            <p>모든 내역이 깔끔하게 정리되었습니다! (Inbox Zero)</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                groups.map((group) => (
                                    <TableRow key={group.rawName + group.amount + group.ownerType + group.type}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-medium text-[11px] bg-slate-100 text-slate-800 border-0 px-2 py-0.5 whitespace-nowrap">
                                                    {OWNER_OPTIONS.find(o => o.value === group.ownerType)?.label || '미상'}
                                                </Badge>
                                                <span>{group.rawName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-xs">
                                            {new Intl.NumberFormat('ko-KR').format(Math.abs(group.amount))}원
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={group.type === 'income' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                {group.type === 'income' ? '수입' : '지출'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-muted">{group.count}</Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${group.type === 'income' ? 'text-primary' : 'text-destructive'}`}>
                                            {group.type === 'income' ? '+' : ''}{new Intl.NumberFormat('ko-KR').format(group.totalAmount)}원
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {group.sampleDate}
                                        </TableCell>
                                        <TableCell>
                                            <BulkAssigner
                                                group={group}
                                                categories={structuredCategories}
                                                businessUnits={businessUnits}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    );
}
