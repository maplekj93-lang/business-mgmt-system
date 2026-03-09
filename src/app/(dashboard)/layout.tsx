import React from 'react';
import { createClient } from '@/shared/api/supabase/server';
import { Header } from '@/widgets/layout/ui/header';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen bg-background">
            <Header userEmail={user?.email} defaultMode="business" />
            <main>
                {children}
            </main>
        </div>
    );
}
