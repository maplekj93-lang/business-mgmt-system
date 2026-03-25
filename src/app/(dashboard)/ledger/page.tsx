import React from 'react';
import { TransactionHistoryWidget } from '@/widgets/transaction-history';

export default async function LedgerPage({
    searchParams
}: {
    searchParams: { year?: string; month?: string; dateFilter?: string }
}) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black tracking-tight text-foreground">전체 내역 관리</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    가계부의 모든 수입 및 지출 내역을 한눈에 확인하고 필터링할 수 있습니다.
                </p>
            </div>
            
            <TransactionHistoryWidget 
                searchParams={searchParams}
                mode="total" 
            />
        </div>
    );
}
