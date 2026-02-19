'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { Briefcase, User, Layers } from 'lucide-react';
import { setAppModeAction } from '@/features/switch-mode/set-mode';

type AppMode = 'personal' | 'total' | 'business';

export function ContextSwitcher({ defaultMode }: { defaultMode: AppMode }) {
    const router = useRouter();
    const [mode, setMode] = React.useState<AppMode>(defaultMode);
    const [isPending, startTransition] = React.useTransition();

    const handleSwitch = (newMode: AppMode) => {
        setMode(newMode); // Optimistic UI
        startTransition(async () => {
            await setAppModeAction(newMode);
            router.refresh(); // Refresh Server Components
        });
    };

    return (
        // ✅ Glassmorphism: Prism System V2.0 (glass-panel recipe)
        <div className="glass-panel rounded-full p-1.5 w-fit mx-auto flex items-center justify-center transition-all bg-background/50 border border-border">
            <button
                onClick={() => handleSwitch('personal')}
                disabled={isPending}
                className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
                    mode === 'personal'
                        ? "bg-background shadow-sm text-foreground scale-105 border border-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
            >
                <User className="w-3.5 h-3.5" />
                <span>개인</span>
            </button>

            <button
                onClick={() => handleSwitch('total')}
                disabled={isPending}
                className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
                    mode === 'total'
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
            >
                <Layers className="w-3.5 h-3.5" />
                <span>통합</span>
            </button>

            <button
                onClick={() => handleSwitch('business')}
                disabled={isPending}
                className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
                    mode === 'business'
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
            >
                <Briefcase className="w-3.5 h-3.5" />
                <span>비즈니스</span>
            </button>
        </div>
    );
}
