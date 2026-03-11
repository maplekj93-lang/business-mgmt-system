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
      { title: "미분류 내역 관리", href: "/transactions/unclassified" },
      { title: "예산/통계", href: "/analytics" },
    ],
  },
  {
    title: "사업 (Business)",
    icon: Briefcase,
    items: [
      { title: "프로젝트 관리", href: "/business/projects" },
      { title: "미수금 및 수익 현황", href: "/business" },
      { title: "거래처 관리", href: "/manage" },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
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
    <aside className={cn(
      "w-64 bg-background/80  flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out border-none [box-shadow:var(--tactile-shadow-sm)] z-50",
      className
    )}>
      {/* Sidebar Header: Logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-primary transition-all">
            BrightGlory
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 py-4 custom-scrollbar">
        {navItems.map((item, index) => {
          if (!item.items) {
            return (
              <Link 
                key={index}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                  pathname === item.href 
                    ? "text-primary [box-shadow:var(--tactile-inner)] bg-background/50" 
                    : "text-muted-foreground hover:text-foreground hover:[box-shadow:var(--tactile-shadow-sm)]"
                )}
              >
                <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                {item.title}
              </Link>
            );
          }

          const isOpen = openMenus[item.title];
          const isActive = item.items.some(sub => pathname === sub.href);

          return (
            <div key={index} className="space-y-1">
                <button 
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group",
                    (isOpen || isActive) ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:[box-shadow:var(--tactile-shadow-sm)]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5 transition-colors", (isOpen || isActive) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.title}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
                
                {isOpen && (
                  <div className="space-y-2 mt-2 p-3 rounded-[2rem] [box-shadow:var(--tactile-inner)] bg-background/20">
                    {item.items.map((sub, subIdx) => (
                      <Link
                        key={subIdx}
                        href={sub.href}
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
      <div className="p-4 border-t bg-background/30">
        <Link 
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group",
            pathname.startsWith('/settings')
              ? "[box-shadow:var(--tactile-inner)] text-primary bg-background/50"
              : "text-muted-foreground hover:text-foreground hover:[box-shadow:var(--tactile-shadow-sm)]"
          )}
        >
          <Settings className={cn("w-5 h-5", pathname.startsWith('/settings') ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
          <span>설정</span>
          <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse hidden group-hover:block" />
        </Link>
      </div>
    </aside>
  );
}
