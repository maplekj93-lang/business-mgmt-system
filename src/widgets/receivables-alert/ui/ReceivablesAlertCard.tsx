'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getOverdueProjects, OverdueProject } from '@/entities/project/api/get-overdue-projects';

export function ReceivablesAlertCard() {
  const [overdueList, setOverdueList] = useState<OverdueProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getOverdueProjects();
        setOverdueList(data);
      } catch (error) {
        console.error('Failed to load overdue projects:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="border-red-200 bg-red-50/10">
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-red-500" />
        </div>
      </Card>
    );
  }

  if (overdueList.length === 0) {
    return null;
  }

  const totalReceivables = overdueList.reduce((acc, p) => acc + p.amount, 0);

  return (
    <Card className="border-red-200 bg-red-50/10 shadow-sm transition-all hover:bg-red-50/20">
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <CardTitle className="text-red-700 font-bold mb-0">입금 지연 경고 (미수금)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-red-600/80 mb-2 font-medium">
          총 {overdueList.length}건 / {totalReceivables.toLocaleString()}원의 입금이 지연 중입니다.
        </div>
        
        <div className="space-y-2">
          {overdueList.slice(0, 5).map(p => (
            <Link key={p.id} href={`/business/projects`} className="block bg-white border border-red-100 p-2 rounded-md hover:border-red-300 transition-all shadow-sm group">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-[13px] group-hover:text-red-700 transition-colors">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.client_name}</div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-[13px] font-bold text-slate-800 tracking-tight">
                    {p.amount.toLocaleString()}원
                  </div>
                  <Badge variant="outline" className="text-[9px] h-4 leading-none py-0 px-1 mt-1 text-red-600 border-red-200 bg-red-50">
                    +{p.overdue_days}일 초과
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
          {overdueList.length > 5 && (
            <div className="text-center text-[10px] text-muted-foreground pt-1 font-medium">
              ...외 {overdueList.length - 5}건이 더 있습니다
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
