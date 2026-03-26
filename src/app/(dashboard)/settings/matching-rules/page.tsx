import React from 'react';
import { MatchingStatsHeader } from '@/features/manage-matching-rules/ui/MatchingStatsHeader';
import { RuleList } from '@/features/manage-matching-rules/ui/RuleList';

export default function MatchingRulesPage() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">매칭 인사이트 허브</h1>
        <p className="text-muted-foreground">
          수입 정산 시스템이 학습한 규칙을 관리하고, 비즈니스 상황에 맞는 정교한 매칭 시나리오를 설계합니다.
        </p>
      </div>

      <MatchingStatsHeader />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">학습된 매칭 규칙</h2>
        </div>
        <RuleList />
      </div>
    </div>
  );
}
