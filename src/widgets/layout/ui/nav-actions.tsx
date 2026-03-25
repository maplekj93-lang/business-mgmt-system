'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Settings, BarChart3, LogOut, Briefcase, TrendingUp } from 'lucide-react';
import { signOutAction } from '@/features/auth/api/sign-out';
import { ModeToggle } from '@/shared/ui/mode-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

export function NavActions() {
    return (
        <div className="flex items-center gap-3">
            <ModeToggle />
            <div className="flex items-center gap-2 pr-2 border-r mr-2 h-8">
                <Link href="/analytics">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="대시보드">
                        <BarChart3 className="w-5 h-5" />
                    </Button>
                </Link>

                <Link href="/business">
                    <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10" title="비즈니스 관리">
                        <Briefcase className="w-5 h-5" />
                    </Button>
                </Link>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Settings className="w-5 h-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-zinc-950/95" align="end">
                        <div className="flex flex-col gap-1">
                            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">설정</p>

                            <Link href="/settings/classification">
                                <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-white/10 text-sm">
                                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                                    카테고리 관리
                                </Button>
                            </Link>

                            <Link href="/settings/assets">
                                <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-white/10 text-sm">
                                    <Settings className="w-4 h-4 text-primary" />
                                    자산/부채 관리
                                </Button>
                            </Link>

                            <Link href="/settings/import">
                                <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-white/10 text-sm">
                                    <BarChart3 className="w-4 h-4 text-blue-400" />
                                    가져오기(매핑) 설정
                                </Button>
                            </Link>

                            <Link href="/settings/fx-rates">
                                <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-white/10 text-sm">
                                    <TrendingUp className="w-4 h-4 text-amber-400" />
                                    환율 설정
                                </Button>
                            </Link>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <form action={signOutAction}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="sr-only">로그아웃</span>
                </Button>
            </form>
        </div>
    );
}
