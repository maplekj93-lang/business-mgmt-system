'use client'

import React from 'react';
import { User } from 'lucide-react';

interface UserBadgeProps {
    email?: string | null;
}

export function UserBadge({ email }: UserBadgeProps) {
    if (!email) return null;

    return (
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
            <User className="w-3 h-3" />
            {email}
        </div>
    );
}
