'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { createClient } from '@/shared/api/supabase/client';
import { AlertCircle, Clock, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface delayedInvoice {
  id: string;
  name: string;
  amount: number;
  invoice_sent_date: string;
  expected_payment_date: string;
  delay_days: number;
}

export function ReceivablesAlertCard() {
  const [delayedInvoices, setDelayedInvoices] = useState<delayedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDelayedInvoices = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, invoice_sent_date, expected_payment_date')
        .not('invoice_sent_date', 'is', null)
        .is('actual_payment_date', null)
        .lt('expected_payment_date', today)
        .order('expected_payment_date', { ascending: true });

      if (data) {
        const formatted = data.map(p => {
          const expected = new Date(p.expected_payment_date!);
          const now = new Date();
          const delay = Math.floor((now.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            id: p.id,
            name: p.name,
            amount: 0, // In real scenario, would join with income transactions or have budget field
            invoice_sent_date: p.invoice_sent_date!,
            expected_payment_date: p.expected_payment_date!,
            delay_days: delay
          };
        });
        setDelayedInvoices(formatted);
      }
      setIsLoading(false);
    };

    fetchDelayedInvoices();
  }, []);

  if (isLoading) return <div className="h-32 bg-muted animate-pulse rounded-xl" />;
  if (delayedInvoices.length === 0) return null;

  return (
    <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
          <AlertCircle className="w-4 h-4" /> 입금 지연 알림 ({delayedInvoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {delayedInvoices.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-destructive/10">
            <div className="space-y-1">
              <p className="text-sm font-semibold">{inv.name}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  발행: {inv.invoice_sent_date}
                </span>
                <span className="flex items-center gap-1 text-destructive font-medium">
                  <Clock className="w-3 h-3" />
                  {inv.delay_days}일 지연됨
                </span>
              </div>
            </div>
            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-0">
              미입금
            </Badge>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground text-center pt-1 italic">
          ※ 프로젝트 상세 페이지에서 입금 확인 처리를 할 수 있습니다.
        </p>
      </CardContent>
    </Card>
  );
}
