'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/shared/ui/checkbox'; // Need to ensure this exists or use standard input
import { Briefcase, Folder } from 'lucide-react';
import { BusinessUnit } from '@/entities/business';
import { AllocationDialog } from '@/features/allocate-transaction';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { updateTransactionAction } from '@/features/refine-ledger/api/update-transaction';
import { toast } from 'sonner';

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
    project_id?: string | null;
    owner_type?: string | null; // [NEW] Database-driven owner type
    asset?: { id: string; name: string; asset_type?: string; owner_type?: string } | null;
}

interface Asset {
    id: string;
    name: string;
    owner_type?: string;
    asset_type?: string;
}

const OWNER_OPTIONS = [
    { value: 'kwangjun', label: '광준' },
    { value: 'euiyoung', label: '의영' },
    { value: 'joint', label: '공동' },
    { value: 'business', label: '회사' },
    { value: 'other', label: '미상/기타' }
] as const;

interface TransactionTableProps {
    transactions: Transaction[];
    businessUnits: BusinessUnit[];
    assets: Asset[];
}

export function TransactionTable({ transactions, businessUnits, assets }: TransactionTableProps) {
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
                            <TableHead className="w-[80px]">소유자</TableHead>
                            <TableHead className="w-[180px]">결제일시</TableHead>
                            <TableHead className="w-[150px]">자산 (카드)</TableHead>
                            <TableHead className="w-[180px]">카테고리</TableHead>
                            <TableHead>내용</TableHead>
                            <TableHead className="text-right">금액</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex focus:outline-none"
                                                >
                                                    <Badge variant="outline" className="font-medium text-[11px] bg-slate-100 text-slate-800 border-0 px-2 py-0.5 whitespace-nowrap cursor-pointer hover:bg-slate-200 transition-colors">
                                                        {OWNER_OPTIONS.find(o => o.value === tx.owner_type)?.label || '미상'}
                                                    </Badge>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-40 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                                                <div className="p-2 border-b">
                                                    <p className="text-xs font-medium text-muted-foreground">소유자 변경</p>
                                                </div>
                                                <div className="p-1">
                                                    {OWNER_OPTIONS.map((owner) => (
                                                        <button
                                                            key={owner.value}
                                                            className={cn(
                                                                "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex flex-col gap-0.5",
                                                                tx.owner_type === owner.value && "bg-primary/5 text-primary font-medium"
                                                            )}
                                                            onClick={async () => {
                                                                let applyToSimilar = false;
                                                                if (!tx.owner_type || tx.owner_type === 'other') {
                                                                    const desc = tx.description || tx.source_raw_data?.original_category || '';
                                                                    if (desc) {
                                                                        applyToSimilar = window.confirm(`"${desc}" 내역과 동일한 소유자 미지정 내역들을 모두 [${owner.label}] 소유로 일괄 변경하시겠습니까?`);
                                                                    }
                                                                }

                                                                const res = await updateTransactionAction({
                                                                    transactionId: tx.id,
                                                                    ownerType: owner.value,
                                                                });

                                                                if (res.success) {
                                                                    toast.success(applyToSimilar ? '소유자가 일괄 변경되었습니다.' : '소유자가 변경되었습니다.');
                                                                    router.refresh();
                                                                } else {
                                                                    toast.error('변경 실패: ' + res.message);
                                                                }
                                                            }}
                                                        >
                                                            {owner.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell className="font-medium text-muted-foreground text-[13px] whitespace-nowrap">
                                        {(() => {
                                            let timeRaw = '';
                                            const r = tx.source_raw_data as any;
                                            if (r) {
                                                if (r['승인시각']) timeRaw = r['승인시각'];
                                                else if (r['거래일시']) timeRaw = r['거래일시'].split(' ')[1] || '';
                                                else if (r['이용일시']) timeRaw = r['이용일시'].split(' ')[1] || '';
                                            }
                                            return `${tx.date}${timeRaw ? ` ${timeRaw}` : ''}`;
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex focus:outline-none"
                                                >
                                                    <Badge
                                                        variant="outline"
                                                        className="font-normal text-xs bg-slate-100 text-slate-700 border-0 break-keep cursor-pointer hover:bg-slate-200 transition-colors"
                                                    >
                                                        {tx.asset?.name || tx.source_raw_data?._bank || '현금/기타'}
                                                    </Badge>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-56 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                                                <div className="p-2 border-b">
                                                    <p className="text-xs font-medium text-muted-foreground">자산 변경 (Change Asset)</p>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto p-1">
                                                    {assets.length === 0 ? (
                                                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                                            등록된 자산이 없습니다.<br />
                                                            설정창에서 자산을 추가해주세요.
                                                        </div>
                                                    ) : (
                                                        assets.map((asset) => (
                                                            <button
                                                                key={asset.id}
                                                                className={cn(
                                                                    "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex flex-col gap-0.5",
                                                                    tx.asset?.id === asset.id && "bg-primary/5 text-primary font-medium"
                                                                )}
                                                                onClick={async () => {
                                                                    let applyToSimilar = false;
                                                                    // If the transaction currently has no asset assigned, suggest bulk update
                                                                    if (!tx.asset?.id) {
                                                                        const desc = tx.description || tx.source_raw_data?.original_category || '';
                                                                        if (desc) {
                                                                            applyToSimilar = window.confirm(`"${desc}" 내역과 동일한 미분류 내역들을 모두 [${asset.name}] 자산으로 일괄 변경하시겠습니까?`);
                                                                        }
                                                                    }

                                                                    const res = await updateTransactionAction({
                                                                        transactionId: tx.id,
                                                                        assetId: asset.id,
                                                                        applyToSimilarUnclassified: applyToSimilar
                                                                    });

                                                                    if (res.success) {
                                                                        toast.success(applyToSimilar ? '동일한 내역들의 자산과 소유자가 일괄 변경되었습니다.' : '자산과 소유자가 변경되었습니다.');
                                                                        router.refresh();
                                                                    } else {
                                                                        toast.error('변경 실패: ' + res.message);
                                                                    }
                                                                }}
                                                            >
                                                                <span>{asset.name}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
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
                                            <div className="flex flex-col gap-1 mt-1">
                                                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-0 text-[9px] w-fit">
                                                    Business
                                                </Badge>
                                                {tx.project_id && (
                                                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-[9px] w-fit font-normal">
                                                        <Folder className="w-2.5 h-2.5 mr-1" />
                                                        Project Linked
                                                    </Badge>
                                                )}
                                            </div>
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
