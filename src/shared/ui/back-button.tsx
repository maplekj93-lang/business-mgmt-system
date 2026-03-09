'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './button';

export function BackButton({ label = '뒤로' }: { label?: string }) {
    const router = useRouter();
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 text-muted-foreground hover:text-foreground -ml-1 h-8"
        >
            <ArrowLeft className="w-3.5 h-3.5" />
            {label}
        </Button>
    );
}
