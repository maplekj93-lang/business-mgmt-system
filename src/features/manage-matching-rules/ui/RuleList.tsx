'use client';

import React, { useEffect, useState } from 'react';
import { getMatchingRules } from '@/entities/matching-rule/api/get-matching-rules';
import { MatchingRuleWithConditions } from '@/entities/matching-rule/model/types';
import { RuleCard } from './RuleCard';
import { Skeleton } from '@/shared/ui/skeleton';

export function RuleList() {
  const [rules, setRules] = useState<MatchingRuleWithConditions[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const data = await getMatchingRules();
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20">
        <p>아직 학습된 매칭 규칙이 없습니다.</p>
        <p className="text-sm">수입 정산을 진행하면 시스템이 자동으로 규칙을 제안합니다.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rules.map((rule) => (
        <RuleCard key={rule.id} rule={rule} onUpdate={fetchRules} />
      ))}
    </div>
  );
}
