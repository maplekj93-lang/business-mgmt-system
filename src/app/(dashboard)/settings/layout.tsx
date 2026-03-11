import React from 'react';
import Link from 'next/link';

import { createClient } from '@/shared/api/supabase/server';
import { Header } from '@/widgets/layout/ui/header';
import { BackButton } from '@/shared/ui/back-button';

const SETTINGS_NAV = [
    { href: '/settings/assets',              label: '자산 관리' },
    { href: '/settings/categories',          label: '카테고리' },
    { href: '/settings/crew',                label: '크루 관리' },
    { href: '/settings/recurring-expenses',  label: '구독 관리' },
    { href: '/settings/import',              label: '임포트 매핑' },
    { href: '/settings/fx-rates',            label: '환율 설정' },
];

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();



    return (
        <div className="space-y-6">
            {/* 설정 서브 네비 */}
            <div className="sticky top-0 z-40 border-b border-border/40 bg-zinc-950/90 -mx-6 md:-mx-8 px-6 md:px-8">
                <div className="flex items-center gap-1 h-11">
                    <BackButton />
                    <div className="w-px h-4 bg- mx-2" />
                    {SETTINGS_NAV.map(({ href, label }) => (
                        <SettingsNavLink key={href} href={href} label={label} />
                    ))}
                </div>
            </div>

            <div className="mt-6">
                {children}
            </div>
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
