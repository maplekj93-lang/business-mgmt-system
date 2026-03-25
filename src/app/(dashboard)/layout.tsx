import React from 'react';
import { createClient } from '@/shared/api/supabase/server';
import { Header } from '@/widgets/layout/ui/header';
import { Sidebar } from '@/widgets/sidebar/ui/sidebar';
import { GlobalFAB } from '@/components/common/GlobalFAB';
import { SidebarProvider } from '@/shared/ui/sidebar-provider';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
                {/* 
                   Sidebar는 SidebarProvider 내부에서 클라이언트 상태(isOpen)를 
                   사용하여 모바일에서는 Overlay로, 데스크톱에서는 배정된 너비만큼 차지합니다.
                */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                    <Header userEmail={user?.email} />
                    
                    <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Global Quick Action Button */}
                <GlobalFAB />
            </div>
        </SidebarProvider>
    );
}
