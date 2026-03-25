'use client';

import { OWNER_LABELS, OWNER_COLORS, OwnerType, OWNER_TYPES } from '@/shared/constants/business';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

interface OwnerToggleProps {
    value: OwnerType | 'all';
    onChange: (value: OwnerType | 'all') => void;
    className?: string;
}

export function OwnerToggle({ value, onChange, className }: OwnerToggleProps) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            <Button
                variant={value === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('all')}
                className={cn(
                    "rounded-full px-4 h-8 text-xs font-semibold transition-all",
                    value === 'all' && "bg-slate-900 text-white shadow-md dark:bg-slate-100 dark:text-slate-900"
                )}
            >
                전체
            </Button>
            {OWNER_TYPES.map((type) => (
                <Button
                    key={type}
                    variant={value === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onChange(type)}
                    className={cn(
                        "rounded-full px-4 h-8 text-xs font-semibold transition-all hover:opacity-90",
                        value === type ? [
                            OWNER_COLORS[type],
                            "text-white border-transparent shadow-md ring-2 ring-offset-2 ring-transparent transition-all ring-offset-background"
                        ] : "border-slate-200 dark:border-slate-800"
                    )}
                >
                    {OWNER_LABELS[type]}
                </Button>
            ))}
        </div>
    );
}
