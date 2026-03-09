import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/shared/api/supabase/server';
import { Header } from '@/widgets/layout/ui/header';
import { BackButton } from '@/shared/ui/back-button';

const SETTINGS_NAV = [
    { href: '/settings/assets',     label: '자산 관리' },
    { href: '/settings/categories', label: '카테고리' },
    { href: '/settings/import',     label: '임포트 매핑' },
    { href: '/settings/fx-rates',   label: '환율 설정' },
];

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const cookieStore = await cookies();
    const defaultMode = (cookieStore.get('app-mode')?.value as 'personal' | 'business' | 'total') || 'personal';

    return (
        <div className="min-h-screen bg-background">
            <Header userEmail={user?.email} defaultMode={defaultMode} />

            {/* 설정 서브 네비 */}
            <div className="sticky top-14 z-40 border-b border-border/40 bg-background/90 backdrop-blur-md">
                <div className="container max-w-6xl mx-auto px-4">
                    <div className="flex items-center gap-1 h-11">
                        <BackButton />
                        <div className="w-px h-4 bg-border mx-2" />
                        {SETTINGS_NAV.map(({ href, label }) => (
                            <SettingsNavLink key={href} href={href} label={label} />
                        ))}
                    </div>
                </div>
            </div>

            {children}
        </div>
    );
}

// 현재 경로 하이라이트는 서버에서 pathname을 못 읽으므로 클라이언트 컴포넌트로 분리
function SettingsNavLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
            {label}
        </Link>
    );
}
