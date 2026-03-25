'use client';

import React, { useState } from 'react';
import { TableRow, TableCell } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { UnclassifiedGroup, OWNER_OPTIONS } from '@/entities/transaction/model/unclassified';
import { BulkAssigner } from './bulk-assigner';
import { TransactionDetailPanel } from './transaction-detail-panel';
import { getTransactionsByIds, TransactionDetail } from '@/entities/transaction/api/get-transactions-by-ids';

import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { TransactionDetailSheet } from './transaction-detail-sheet';

interface UnclassifiedRowProps {
    group: UnclassifiedGroup;
    categories: any; // Structured categories
    businessUnits: any;
}

export function UnclassifiedRow({ group, categories, businessUnits }: UnclassifiedRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [details, setDetails] = useState<TransactionDetail[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const isMobile = useMediaQuery('(max-width: 767px)');

    const handleRowClick = async (e: React.MouseEvent) => {
        // BulkAssigner 클릭 시에는 행이 접히지 않도록 방지
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
                className={`cursor-pointer transition-colors group ${isExpanded ? 'bg-muted/30' : 'hover:bg-muted/10'}`}
            >
                <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center justify-center p-1">
                             {isExpanded ? 
                                <ChevronUp className="h-4 w-4 text-primary" /> : 
                                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                             }
                        </div>
                        <Badge variant="outline" className="font-bold text-[10px] bg-background shadow-inner text-muted-foreground border-border/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {OWNER_OPTIONS.find(o => o.value === group.ownerType)?.label || '미상'}
                        </Badge>
                        <span className="truncate max-w-[150px] sm:max-w-[200px] font-bold text-foreground/90" title={group.rawName}>{group.rawName}</span>
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
                    <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">{group.count}</Badge>
                </TableCell>
                <TableCell className={`text-right font-bold tabular-nums ${group.type === 'income' ? 'text-blue-600' : 'text-slate-900'}`}>
                    {group.type === 'income' ? '+' : ''}{new Intl.NumberFormat('ko-KR').format(group.totalAmount)}원
                </TableCell>
                <TableCell className="text-[11px] font-mono text-muted-foreground hidden lg:table-cell">
                    {group.sampleDate}
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

            {/* 상세 렌더링 분기 */}
            {isExpanded && (
                isMobile ? (
                    // 모바일: Bottom Sheet 직접 호출 (오버레이)
                    <TransactionDetailSheet 
                        details={details} 
                        isLoading={isLoading} 
                        onClose={() => setIsExpanded(false)} 
                    />
                ) : (
                    // 데스크톱: 인라인 패널
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
