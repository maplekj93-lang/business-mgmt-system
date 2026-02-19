'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Settings, BarChart3, LogOut } from 'lucide-react';
import { signOutAction } from '@/features/auth/api/sign-out';
import { ModeToggle } from '@/shared/ui/mode-toggle';

export function NavActions() {
    return (
        <div className="flex items-center gap-3">
            <ModeToggle />
            <div className="flex items-center gap-2 pr-2 border-r border-white/10 mr-2 h-8">
                <Link href="/analytics">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <BarChart3 className="w-5 h-5" />
                    </Button>
                </Link>
                <Link href="/settings/categories">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Settings className="w-5 h-5" />
                    </Button>
                </Link>
            </div>

            <form action={signOutAction}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="sr-only">Logout</span>
                </Button>
            </form>
        </div>
    );
}
