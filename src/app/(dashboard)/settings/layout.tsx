'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { 
  User, 
  Wallet, 
  Layers, 
  Users, 
  Database, 
  Globe, 
  Settings,
  Settings2,
  Filter,
  Tag,
  RefreshCw,
  CreditCard,
  SplitSquareHorizontal
} from 'lucide-react';

const SETTINGS_NAV = [
    { href: '/settings/user',            label: '계정 설정', icon: User },
    // 분류 및 필터
    { href: '/settings/categories',  label: '분류 및 규칙', icon: Layers },
    { href: '/settings/advanced-filters', label: '고급 필터', icon: Filter },
    // 자산 및 결제
    { href: '/settings/payment-methods', label: '결제수단', icon: CreditCard },
    { href: '/settings/assets',          label: '보유 자산', icon: Wallet },
    { href: '/settings/dutch-pay',       label: '더치페이 정산', icon: SplitSquareHorizontal },
    // 기타
    { href: '/settings/recurring-expenses', label: '구독 관리', icon: RefreshCw },
    { href: '/settings/crew',            label: '크루 관리', icon: Users },
    { href: '/settings/import',          label: '임포트 매핑', icon: Database },
    { href: '/settings/business-profile', label: '비즈니스 프로필', icon: Settings2 },
    { href: '/settings/fx-rates',        label: '환율 설정', icon: Globe },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 shrink-0">
                <div className="flex items-center gap-2 px-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-foreground/[0.03] border border-border/50 flex items-center justify-center">
                        <Settings className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-black tracking-tight">환경 설정</h2>
                </div>
                
                <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none">
                    {SETTINGS_NAV.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap lg:whitespace-normal",
                                    isActive 
                                        ? "bg-foreground text-background shadow-lg shadow-foreground/10" 
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-60")} />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <main className="flex-1 min-w-0">
                <div className="tactile-panel p-6 lg:p-8 bg-white/50 border-border/50">
                    {children}
                </div>
            </main>
        </div>
    );
}
