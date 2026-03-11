'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Receipt, 
  PlusCircle, 
  Briefcase, 
  X
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';

export function GlobalFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: '거래내역 업로드',
      icon: Receipt,
      color: 'bg-rose-500',
      shadow: 'shadow-rose-500/20',
      href: '/manage/import'
    },
    {
      label: '프로젝트 생성',
      icon: Briefcase,
      color: 'bg-emerald-500',
      shadow: 'shadow-emerald-500/20',
      href: '/business/projects'
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-3 pointer-events-auto">
      {/* Action Buttons */}
      <div className={cn(
        "flex flex-col gap-3 transition-all duration-300 ease-out",
        isOpen ? "translate-y-0 opacity-100 visible" : "translate-y-10 opacity-0 invisible"
      )}>
        {actions.map((action, index) => (
          <Link 
            key={index} 
            href={action.href}
            className="flex items-center justify-end gap-3 group cursor-pointer mr-1.5"
            onClick={() => setIsOpen(false)}
          >
            <span className="bg-card/80 text-card-foreground text-[11px] font-bold px-3 py-1.5 rounded-lg border- shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {action.label}
            </span>
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center text-white  transition-transform hover:scale-110",
              action.color,
              action.shadow
            )}>
              <action.icon className="w-5 h-5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-2xl bg-indigo-500 text-white  shadow-indigo-500/30 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95",
          isOpen ? "rotate-45 bg-rose-500 shadow-rose-500/30" : "rotate-0"
        )}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-8 h-8" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/40 backdrop-blur-[4px] z-[-1] pointer-events-auto"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
