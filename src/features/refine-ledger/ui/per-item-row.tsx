'use client';

import React, { useState } from 'react';
import { TableRow, TableCell } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { UnclassifiedGroup, OWNER_OPTIONS } from '@/entities/transaction/model/unclassified';
import { BulkAssigner } from './bulk-assigner';
import { getTransactionsByIds, TransactionDetail } from '@/entities/transaction/api/get-transactions-by-ids';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { TransactionDetailSheet } from './transaction-detail-sheet';
import { TransactionDetailPanel } from './transaction-detail-panel';
import { Package2 } from 'lucide-react';

interface PerItemRowProps {
    group: UnclassifiedGroup;
    categories: any;
    businessUnits: any;
}

export function PerItemRow({ group, categories, businessUnits }: PerItemRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [details, setDetails] = useState<TransactionDetail[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const isMobile = useMediaQuery('(max-width: 767px)');

    const handleRowClick = async (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.bulk-assigner-trigger')) {
            return;
        }

        if (!isExpanded && !details && !isLoading) {
            setIsLoading(true);
            try {
                const data = await getTransactionsByIds(group.transactionIds);
                setDetails(data);
            } catch (error) {
                console.error('Failed to load transaction details:', error);
            } finally {
                setIsLoading(false);
            }
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            <TableRow 
                onClick={handleRowClick}
                className={`cursor-pointer transition-colors group border-l-4 ${
                    group.type === 'income' ? 'border-l-blue-500/50' : 'border-l-amber-500/50'
                } ${isExpanded ? 'bg-muted/30' : 'hover:bg-muted/10'}`}
            >
                <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center justify-center p-1">
                             <Package2 className={`h-4 w-4 ${isExpanded ? 'text-primary' : 'text-muted-foreground/40'}`} />
                        </div>
                        <Badge variant="outline" className="font-bold text-[10px] bg-background shadow-inner text-muted-foreground border-border/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {OWNER_OPTIONS.find(o => o.value === group.ownerType)?.label || '미상'}
                        </Badge>
                        <div className="flex flex-col min-w-0">
                            <span className="truncate max-w-[150px] sm:max-w-[200px] font-bold text-foreground/90" title={group.rawName}>
                                {group.rawName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {group.sampleDate}
                            </span>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-center font-black tabular-nums text-xs hidden sm:table-cell">
                    {new Intl.NumberFormat('ko-KR').format(Math.abs(group.amount))}원
                </TableCell>
                <TableCell className="text-center w-12 sm:w-auto">
                    <Badge variant="outline" className={`px-2 py-0 text-[10px] font-bold rounded-full ${group.type === 'income' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {group.type === 'income' ? '수입' : '지출'}
                    </Badge>
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                    {group.count > 1 ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold border-amber-200">
                            {group.count}건
                        </Badge>
                    ) : (
                        <span className="text-xs text-muted-foreground/50">-</span>
                    )}
                </TableCell>
                <TableCell className={`text-right font-bold tabular-nums ${group.type === 'income' ? 'text-blue-600' : 'text-slate-900'}`}>
                    {group.type === 'income' ? '+' : ''}{new Intl.NumberFormat('ko-KR').format(group.totalAmount)}원
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground hidden lg:table-cell">
                    <span className="bg-muted px-1.5 py-0.5 rounded italic">Per-Item</span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="w-[100px] sm:w-auto">
                    <div className="bulk-assigner-trigger">
                        <BulkAssigner
                            group={group}
                            categories={categories}
                            businessUnits={businessUnits}
                        />
                    </div>
                </TableCell>
            </TableRow>

            {isExpanded && (
                isMobile ? (
                    <TransactionDetailSheet 
                        details={details} 
                        isLoading={isLoading} 
                        onClose={() => setIsExpanded(false)} 
                    />
                ) : (
                    <TableRow className="hover:bg-transparent border-b-0 bg-muted/5">
                        <TableCell colSpan={8} className="p-0 border-b-0 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                            <TransactionDetailPanel 
                                details={details} 
                                isLoading={isLoading} 
                            />
                        </TableCell>
                    </TableRow>
                )
            )}
        </>
    );
}
