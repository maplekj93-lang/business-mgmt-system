'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/shared/ui/checkbox'; // Need to ensure this exists or use standard input
import { Briefcase } from 'lucide-react';
import { BusinessUnit } from '@/entities/business';
import { AllocationDialog } from '@/features/allocate-transaction';
import { useRouter } from 'next/navigation';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category?: {
        name: string;
        type: string;
        parent?: { name: string };
    };
    category_id: number | null;
    source_raw_data?: any;
    business_unit_id?: string | null;
}

interface TransactionTableProps {
    transactions: Transaction[];
    businessUnits: BusinessUnit[];
}

export function TransactionTable({ transactions, businessUnits }: TransactionTableProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isAllocationOpen, setIsAllocationOpen] = useState(false);

    const toggleSelectAll = () => {
        if (selectedIds.size === transactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(transactions.map(t => t.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ko-KR').format(Math.abs(val));
    };

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-medium text-indigo-400 pl-2">
                        {selectedIds.size}개 선택됨
                    </span>
                    <Button
                        size="sm"
                        onClick={() => setIsAllocationOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                    >
                        <Briefcase className="w-4 h-4 mr-2" />
                        사업 비용 처리 (Allocate)
                    </Button>
                </div>
            )}

            <div className="rounded-md border border-border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="w-[50px]">
                                <input
                                    type="checkbox"
                                    className="accent-primary w-4 h-4 cursor-pointer"
                                    checked={transactions.length > 0 && selectedIds.size === transactions.length}
                                    onChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-[100px]">날짜</TableHead>
                            <TableHead className="w-[200px]">카테고리</TableHead>
                            <TableHead>내용</TableHead>
                            <TableHead className="text-right">금액</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    거래 내역이 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow
                                    key={tx.id}
                                    className={cn(
                                        "hover:bg-muted/50 border-border transition-colors cursor-pointer",
                                        selectedIds.has(tx.id) && "bg-indigo-500/5 hover:bg-indigo-500/10"
                                    )}
                                    onClick={() => toggleSelect(tx.id)}
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="accent-primary w-4 h-4 cursor-pointer"
                                            checked={selectedIds.has(tx.id)}
                                            onChange={() => toggleSelect(tx.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-muted-foreground text-sm whitespace-nowrap">
                                        {tx.date}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-medium border-0 px-2 py-0.5",
                                                tx.category?.type === 'income' ? "bg-primary/10 text-primary" :
                                                    tx.category?.type === 'expense' ? "bg-destructive/10 text-destructive" :
                                                        "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {tx.category?.parent ? (
                                                <span className="flex items-center gap-1 whitespace-nowrap">
                                                    <span className="opacity-70">{tx.category.parent.name}</span>
                                                    <span className="text-[10px] opacity-50">▶</span>
                                                    <span>{tx.category.name}</span>
                                                </span>
                                            ) : (
                                                <span className="whitespace-nowrap">{tx.category?.name || '미분류'}</span>
                                            )}
                                        </Badge>

                                        {/* Show Business Badge if already allocated */}
                                        {tx.business_unit_id && (
                                            <Badge variant="secondary" className="ml-2 bg-indigo-500/20 text-indigo-300 border-0 text-[10px]">
                                                Business
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-foreground/90">{tx.description}</TableCell>
                                    <TableCell className={cn(
                                        "text-right font-medium whitespace-nowrap",
                                        tx.amount > 0 ? "text-primary" :
                                            tx.amount < 0 ? "text-destructive" : "text-muted-foreground"
                                    )}>
                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}원
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AllocationDialog
                isOpen={isAllocationOpen}
                onClose={() => setIsAllocationOpen(false)}
                transactionIds={Array.from(selectedIds)}
                businessUnits={businessUnits}
                onSuccess={() => {
                    setSelectedIds(new Set()); // Clear selection
                    router.refresh(); // Refresh data
                }}
            />
        </div>
    );
}
