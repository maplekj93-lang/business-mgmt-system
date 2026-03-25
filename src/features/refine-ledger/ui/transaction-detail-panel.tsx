'use client';

import { TransactionDetail } from '@/entities/transaction/api/get-transactions-by-ids';
import { cn } from '@/shared/lib/utils';
import { useState, useEffect } from 'react';
import { Check, X, PencilLine, Loader2 } from 'lucide-react';
import { updateTransactionFields } from '@/entities/transaction/api/update-transaction-fields';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface TransactionDetailPanelProps {
  details: TransactionDetail[] | null;
  isLoading: boolean;
}

export function TransactionDetailPanel({
  details: initialDetails,
  isLoading,
}: TransactionDetailPanelProps) {
  const [details, setDetails] = useState<TransactionDetail[] | null>(initialDetails);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<{ description: string; receipt_memo: string }>({ description: '', receipt_memo: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state if initialDetails changes
  useEffect(() => {
    setDetails(initialDetails);
  }, [initialDetails]);

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-muted/5 animate-pulse">
        <p className="text-xs text-muted-foreground">거래 상세 내역 로딩 중...</p>
      </div>
    );
  }

  if (!details || details.length === 0) {
    return (
      <div className="p-8 text-center bg-muted/5">
        <p className="text-xs text-muted-foreground">상세 내역이 없습니다.</p>
      </div>
    );
  }

  const startEditing = (tx: TransactionDetail) => {
    setEditingId(tx.id);
    setEditValue({ 
      description: tx.description || '', 
      receipt_memo: tx.receipt_memo || '' 
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setIsUpdating(false);
  };

  const handleUpdate = async (id: string) => {
    setIsUpdating(true);
    try {
      await updateTransactionFields(id, editValue);
      setDetails((prev) => 
        prev ? prev.map(tx => tx.id === id ? { ...tx, ...editValue } : tx) : null
      );
      toast.success('거래 내역이 수정되었습니다.');
      setEditingId(null);
    } catch (error) {
      console.error(error);
      toast.error('수정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="px-6 py-4 border-t border-dashed bg-muted/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1 w-8 bg-primary/20 rounded-full" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          개별 거래 내역 ({details.length}건)
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-muted/50 text-[10px] uppercase">
              <th className="text-left font-medium py-2 px-2 w-[100px]">날짜</th>
              <th className="text-left font-medium py-2 px-2">가맹점/내용 <span className="text-[9px] lowercase opacity-50">(클릭하여 수정)</span></th>
              <th className="text-right font-medium py-2 px-2 w-[90px]">금액</th>
              <th className="text-left font-medium py-2 px-2 min-w-[140px]">계좌/카드</th>
              <th className="text-left font-medium py-2 px-2">메모 / 비고</th>
              <th className="w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {details.map((tx) => {
              const isEditing = editingId === tx.id;
              
              return (
                <tr 
                  key={tx.id} 
                  className={cn(
                    "group transition-colors border-b border-muted/20 last:border-0",
                    isEditing ? "bg-primary/5 shadow-inner" : "hover:bg-muted/10"
                  )}
                >
                  <td className="py-2.5 px-2 font-mono text-muted-foreground tabular-nums opacity-60">
                    {tx.date}
                  </td>
                  <td className="py-2.5 px-2">
                    {isEditing ? (
                      <Input 
                        type="text"
                        className="h-7 text-xs"
                        value={editValue.description}
                        onChange={(e) => setEditValue(prev => ({ ...prev, description: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEditing(tx)}
                        className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span className="truncate max-w-[180px]">{tx.description || '-'}</span>
                        <PencilLine className="h-2.5 w-2.5 opacity-0 group-hover:opacity-30" />
                      </div>
                    )}
                  </td>
                  <td className={cn(
                    "py-2.5 px-2 text-right font-bold tabular-nums",
                    tx.amount > 0 ? "text-emerald-600" : "text-slate-900"
                  )}>
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount.toLocaleString()}원
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1.5">
                      {tx.asset_owner && (
                        <span className={cn(
                          "text-[9px] px-1 py-0.5 rounded leading-none font-bold uppercase",
                          tx.asset_owner === 'kwangjun' ? "bg-blue-100 text-blue-700" :
                          tx.asset_owner === 'euiyoung' ? "bg-rose-100 text-rose-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          {tx.asset_owner === 'kwangjun' ? '광준' : 
                           tx.asset_owner === 'euiyoung' ? '의영' : '공동'}
                        </span>
                      )}
                      <span className="font-medium opacity-80" title={tx.asset_name}>
                        {tx.asset_name || <span className="text-muted-foreground/50">-</span>}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-muted-foreground italic text-[11px]">
                    {isEditing ? (
                      <Input 
                        type="text"
                        className="h-7 text-xs"
                        value={editValue.receipt_memo}
                        onChange={(e) => setEditValue(prev => ({ ...prev, receipt_memo: e.target.value }))}
                        placeholder="메모 입력..."
                      />
                    ) : (
                      <div 
                        onClick={() => startEditing(tx)}
                        className="cursor-pointer hover:text-primary min-h-[1.2rem] flex items-center"
                        title={tx.receipt_memo}
                      >
                        {tx.receipt_memo || <span className="opacity-20">no memo</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-1 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-green-600 hover:bg-green-50"
                          onClick={() => handleUpdate(tx.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-3 w-3" />}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-red-600 hover:bg-red-50"
                          onClick={cancelEditing}
                          disabled={isUpdating}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
