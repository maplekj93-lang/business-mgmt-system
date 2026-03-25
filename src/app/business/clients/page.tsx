import { ClientListWidget } from '@/widgets/client-list';
import { Metadata } from 'next';
import { Briefcase } from 'lucide-react';

export const metadata: Metadata = {
    title: '거래처 관리 | ERP',
    description: '거래처별 매출 분석 및 상세 정보 관리',
};

export default async function ClientsPage() {
    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <div className="flex items-center gap-3 border-b pb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">거래처 관리</h1>
                    <p className="text-muted-foreground">
                        등록된 모든 거래처의 현황과 누적 매출 데이터를 한눈에 확인하세요.
                    </p>
                </div>
            </div>

            <ClientListWidget />
        </div>
    );
}
