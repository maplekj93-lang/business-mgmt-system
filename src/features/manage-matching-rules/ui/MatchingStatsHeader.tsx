'use client';

import React from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Brain, Zap, Clock, ShieldCheck } from 'lucide-react';

export function MatchingStatsHeader() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">학습된 규칙</span>
          </div>
          <div className="text-2xl font-bold">24개</div>
          <p className="text-xs text-muted-foreground">지난 30일간 3개 증가</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">자동 매칭률</span>
          </div>
          <div className="text-2xl font-bold">92.5%</div>
          <p className="text-xs text-muted-foreground">정산 정확도 100% 목표</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">시간 절약</span>
          </div>
          <div className="text-2xl font-bold">12.4시간</div>
          <p className="text-xs text-muted-foreground">수동 입력 대비 절감 시간</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-medium">신뢰도</span>
          </div>
          <div className="text-2xl font-bold">Very High</div>
          <p className="text-xs text-muted-foreground">시나리오 매칭 포함</p>
        </CardContent>
      </Card>
    </div>
  );
}
