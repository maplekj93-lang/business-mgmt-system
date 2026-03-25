'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { 
  Home, 
  Wallet, 
  TrendingUp, 
  Briefcase, 
  Users, 
  Settings, 
  ChevronDown, 
  PlusCircle,
  BarChart2,
  Receipt
} from 'lucide-react';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  items?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    title: "대시보드",
    href: "/",
    icon: Home,
  },
  {
    title: "가계부 (Personal)",
    icon: Wallet,
    items: [
      { title: "전체 내역 보기", href: "/transactions/history" },
      { title: "미분류 내역 관리", href: "/transactions/unclassified" },
      { title: "예산/통계", href: "/analytics" },
    ],
  },
  {
    title: "사업 (Business)",
    icon: Briefcase,
    items: [
      { title: "프로젝트 관리", href: "/business/projects" },
      { title: "일당/현장 관리", href: "/business/daily-rates" },
      { title: "미수금 및 수익 현황", href: "/business" },
      { title: "거래처 관리", href: "/manage" },
    ],
  },
];

import { useSidebar } from '@/shared/ui/sidebar-provider';
import { useMediaQuery } from '@/shared/hooks/use-media-query';

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { isOpen, toggle, isCollapsed } = useSidebar();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navItems.forEach(item => {
        if (item.items && item.items.some(sub => pathname === sub.href)) {
            initialState[item.title] = true;
        }
    });
    return initialState;
  });

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({
        ...prev,
        [title]: !prev[title]
    }));
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] transition-opacity duration-300 md:hidden",
          isMobile && isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggle}
      />

      <aside className={cn(
        "bg-background/80 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out border-r border-border/40 [box-shadow:var(--tactile-shadow-sm)] z-50",
        isMobile ? (
          cn("fixed left-0 transform", isOpen ? "translate-x-0" : "-translate-x-full w-64")
        ) : (
          isCollapsed ? "w-20" : "w-64"
        ),
        className
      )}>
        {/* Sidebar Header: Logo */}
        <div className={cn("p-6", isCollapsed && "px-4 flex justify-center")}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-primary transition-all whitespace-nowrap overflow-hidden">
                BrightGlory
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto px-3 space-y-1 py-4 custom-scrollbar",
          isCollapsed && "px-2"
        )}>
          {navItems.map((item, index) => {
            if (!item.items) {
              return (
                <Link 
                  key={index}
                  href={item.href!}
                  onClick={() => isMobile && close()}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                    isCollapsed && "justify-center px-0",
                    pathname === item.href 
                      ? "text-primary [box-shadow:var(--tactile-inner)] bg-background/50" 
                      : "text-muted-foreground hover:text-foreground hover:[box-shadow:var(--tactile-shadow-sm)]"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            }

            const isMenuOpen = openMenus[item.title];
            const isActive = item.items.some(sub => pathname === sub.href);

            return (
              <div key={index} className="space-y-1">
                  <button 
                    onClick={() => isCollapsed ? null : toggleMenu(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group",
                      isCollapsed && "justify-center px-0",
                      (isMenuOpen || isActive) ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:[box-shadow:var(--tactile-shadow-sm)]"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", (isMenuOpen || isActive) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isMenuOpen && "rotate-180")} />
                    )}
                  </button>
                  
                  {isMenuOpen && !isCollapsed && (
                    <div className="space-y-2 mt-2 p-3 rounded-[2rem] [box-shadow:var(--tactile-inner)] bg-background/20 animate-in slide-in-from-top-2 duration-200">
                      {item.items.map((sub, subIdx) => (
                        <Link
                          key={subIdx}
                          href={sub.href}
                          onClick={() => isMobile && close()}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300",
                            pathname === sub.href
                              ? "text-primary bg-background [box-shadow:var(--tactile-shadow-sm)] my-1 scale-105"
                              : "text-muted-foreground hover:text-foreground hover:[box-shadow:var(--tactile-shadow-sm)]"
                          )}
                        >
                          {sub.title}
                        </Link>
                      ))}
                    </div>
                  )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Settings */}
        <div className={cn("p-4 border-t bg-background/30", isCollapsed && "px-2")}>
          <Link 
            href="/settings"
            onClick={() => isMobile && close()}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group",
              isCollapsed && "justify-center px-0",
              pathname.startsWith('/settings')
                ? "[box-shadow:var(--tactile-inner)] text-primary bg-background/50"
                : "text-muted-foreground hover:text-foreground hover:[box-shadow:var(--tactile-shadow-sm)]"
            )}
            title={isCollapsed ? "설정" : undefined}
          >
            <Settings className={cn("w-5 h-5 shrink-0", pathname.startsWith('/settings') ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            {!isCollapsed && <span>설정</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
