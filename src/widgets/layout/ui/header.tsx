'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserBadge } from './user-badge';
import { ModeToggle } from '@/shared/ui/mode-toggle';
import { useSidebar } from '@/shared/ui/sidebar-provider';
import { MobileMenuButton } from '@/shared/ui/header/mobile-menu-button';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { 
    PlusCircle, 
    Home, 
    BookOpen, 
    Download, 
    BarChart3, 
    Activity, 
    Briefcase,
    CalendarDays,
    HandCoins
} from 'lucide-react';

interface HeaderProps {
    userEmail?: string | null;
}

const NAV_ITEMS = [
    { label: '홈', href: '/', icon: Home },
    { label: '장부', href: '/ledger', icon: BookOpen },
    { label: '불러오기', href: '/import', icon: Download },
    { label: '정산', href: '/dutch-pay', icon: HandCoins },
    { label: '분석', href: '/analytics', icon: BarChart3 },
    { label: '구독', href: '/subscriptions', icon: CalendarDays },
    { label: '활동 로그', href: '/activity-log', icon: Activity },
    { label: '비즈니스', href: '/business', icon: Briefcase },
];

export function Header({ userEmail }: HeaderProps) {
    const { isOpen, toggle } = useSidebar();
    const pathname = usePathname();

    return (
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b bg-background/95 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4 lg:w-[240px]">
                <MobileMenuButton onClick={toggle} isOpen={isOpen} />
                <Link href="/" className="flex items-center gap-2">
                    <span className="font-black text-xl tracking-tighter text-primary">
                        ANTIGRAVITY
                    </span>
                </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center justify-center gap-1 flex-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent",
                                isActive 
                                    ? "text-primary bg-primary/5" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex items-center justify-end gap-3 lg:w-[240px]">
                <Button size="sm" className="hidden sm:flex gap-2 font-bold shadow-lg shadow-primary/20">
                    <PlusCircle className="w-4 h-4" />
                    새 거래 기록
                </Button>
                
                <div className="h-4 w-[1px] bg-border/50 hidden md:block" />
                
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <UserBadge email={userEmail} />
                </div>
            </div>
        </header>
    );
}
