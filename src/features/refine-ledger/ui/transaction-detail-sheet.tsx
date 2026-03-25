'use client'

import { X, Loader2 } from 'lucide-react'
import { TransactionDetail } from '@/entities/transaction/api/get-transactions-by-ids'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

interface TransactionDetailSheetProps {
  details: TransactionDetail[] | null
  isLoading: boolean
  onClose: () => void
}

/**
 * 모바일용 대안 상세 내역 표시용 Bottom Sheet 컴포넌트입니다.
 * (Mobile_UX_Optimization 2-1 설계 반영)
 */
export function TransactionDetailSheet({ details, isLoading, onClose }: TransactionDetailSheetProps) {
  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet 컨테이너 */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] md:hidden transform transition-transform animate-in slide-in-from-bottom-full duration-300 ease-out">
        <div className="bg-background rounded-t-[2rem] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border-t border-white/40 dark:border-white/5">
          {/* 드래그 핸들 (Tactile Style) */}
          <div className="mx-auto w-12 h-1.5 bg-muted/40 rounded-full mt-4 mb-2 shadow-inner" />

          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h3 className="text-lg font-bold">거래 상세</h3>
              <p className="text-xs text-muted-foreground">총 {details?.length ?? 0}건의 내역</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 스크롤 가능한 상세 목록 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-12">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                <p className="text-sm font-medium">소중한 데이터를 불러오고 있어요</p>
              </div>
            ) : details && details.length > 0 ? (
              details.map((tx) => (
                <div
                  key={tx.id}
                  className="tactile-card p-5 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-2 py-0.5 bg-muted/30 rounded-full">
                      {tx.date}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {tx.description}
                    </span>
                    <span className={`text-base font-black tabular-nums ${tx.amount > 0 ? 'text-blue-500' : 'text-foreground'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    {tx.asset_owner && (
                      <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/10 rounded-full px-2 py-0">
                        {tx.asset_owner}
                      </Badge>
                    )}
                    <span className="text-sm font-bold text-foreground/80">
                      {tx.asset_name || '결제 수단 정보 없음'}
                    </span>
                  </div>

                  {tx.receipt_memo && (
                    <div className="pt-2 border-t border-muted/20">
                      <p className="text-xs text-muted-foreground italic">
                        "{tx.receipt_memo}"
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                내역이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
