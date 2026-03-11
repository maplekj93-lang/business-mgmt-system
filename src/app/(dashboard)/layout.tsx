import React from 'react';
import { createClient } from '@/shared/api/supabase/server';
import { Header } from '@/widgets/layout/ui/header';
import { Sidebar } from '@/widgets/sidebar/ui/sidebar';
import { GlobalFAB } from '@/components/common/GlobalFAB';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header userEmail={user?.email} />
                
                <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Global Quick Action Button */}
            <GlobalFAB />
        </div>
    );
}
