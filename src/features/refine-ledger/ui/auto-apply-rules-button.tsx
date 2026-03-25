'use client';

import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { applyTaggingRules } from '../api/apply-tagging-rules';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ApplyRulesResult } from '../model/ai-classification';

interface Props {
  transactionIds: string[];
}

export function AutoApplyRulesButton({ transactionIds }: Props) {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const handleAutoApply = async () => {
    if (transactionIds.length === 0) return;

    setIsLoading(true);
    toast.loading(`⚡ ${transactionIds.length}건 자동 분류 처리 중...`, { id: 'auto-apply' });

    try {
      const result = await applyTaggingRules(transactionIds);
      
      if (result.auto_applied > 0 || result.suggested > 0) {
        toast.success(`✅ 자동 적용 ${result.auto_applied}건 · 추천 ${result.suggested}건 · 미분류 ${result.unmatched}건`, { id: 'auto-apply' });
        router.refresh();
      } else {
        toast.error('적용 가능한 룰을 찾지 못했습니다.', { id: 'auto-apply' });
      }
    } catch (error) {
      console.error(error);
      toast.error('룰 적용 중 오류가 발생했습니다.', { id: 'auto-apply' });
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
