'use client';

import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { applyTaggingRules } from '../api/apply-tagging-rules';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  transactionIds: string[];
}

export function AutoApplyRulesButton({ transactionIds }: Props) {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const handleAutoApply = async () => {
    if (transactionIds.length === 0) return;

    setIsLoading(true);
    const toastId = toast.loading('자동 분류 룰 적용 중...');

    try {
      const result = await applyTaggingRules(transactionIds);
      
      if (result.auto_applied > 0) {
        toast.success(`✨ ${result.auto_applied}건이 자동으로 분류되었습니다.`, { id: toastId });
        router.refresh();
      } else if (result.suggested > 0) {
        toast.info(`적용된 건은 없으나 ${result.suggested}건의 추천이 발견되었습니다.`, { id: toastId });
      } else {
        toast.info('적용할 수 있는 룰이 없습니다.', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('룰 적용 중 오류가 발생했습니다.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        onClick={handleAutoApply} 
        disabled={isLoading || transactionIds.length === 0}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        룰 자동 적용
      </Button>
      <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
        대상: {transactionIds.length}건
      </Badge>
    </div>
  );
}
