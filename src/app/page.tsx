import React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/shared/api/supabase/server';
import { Header } from "@/widgets/layout/ui/header"
import { LedgerImportWidget } from "@/features/ledger-import/ui/ledger-import-widget"
import { TransactionHistoryWidget } from "@/widgets/transaction-history/ui/transaction-history"
import { DashboardWidget } from "@/widgets/dashboard/ui/dashboard-widget"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Normalize searchParams
  const params = {
    year: typeof resolvedParams.year === 'string' ? resolvedParams.year : undefined,
    month: typeof resolvedParams.month === 'string' ? resolvedParams.month : undefined,
  }

  // Get Default Mode from Cookie
  const cookieStore = await cookies();
  const defaultMode = (cookieStore.get('app-mode')?.value as 'personal' | 'business' | 'total') || 'personal';

  return (
    <div className="min-h-screen bg-background">
      <Header userEmail={user?.email} defaultMode={defaultMode} />

      <main className="container max-w-7xl mx-auto p-4 md:p-8 space-y-12">
        <section className="text-center space-y-4 py-12 animate-in fade-in slide-in-from-top-4">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            Beta v0.1
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            One System for All
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            가계부와 사업 장부의 완벽한 결합. 데이터를 한곳에서 관리하세요.
          </p>
        </section>

        {/* Dashboard Section */}
        <React.Suspense fallback={<div className="h-48 glass-panel animate-pulse" />}>
          <DashboardWidget />
        </React.Suspense>

        {/* Import Section (Quick Access) */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Data Import</h3>
            <span className="text-xs text-muted-foreground">Upload Excel files to import transactions</span>
          </div>
          <LedgerImportWidget />
        </div>

        {/* Transaction List Integration */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mx-auto px-4">
            <h3 className="text-xl font-bold">Ledger Details</h3>
            <a
              href="/transactions/unclassified"
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
            >
              📥 미분류 수신함 확인하기
            </a>
          </div>
          <React.Suspense fallback={<div className="text-center py-10">내역 불러오는 중...</div>}>
            <TransactionHistoryWidget searchParams={params} />
          </React.Suspense>
        </div>
      </main>
    </div>
  );
}
