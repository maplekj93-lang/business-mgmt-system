import { Calendar, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { BusinessSummary } from '@/entities/daily-rate/api/get-business-summary';

interface QuickInfoFooterProps {
    summary: BusinessSummary;
}

export function QuickInfoFooter({ summary }: QuickInfoFooterProps) {
    return (
        <div className="tactile-panel mt-8 p-1 rounded-2xl bg-background overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
                {/* Unpaid Payroll */}
                <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:scale-110 transition-transform">
                        <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">인건비 미지급액</p>
                        <p className="text-sm font-bold text-white">₩{summary.unpaid_crew_amount.toLocaleString()}</p>
                    </div>
                </div>

                {/* Overdue Tasks/Logs */}
                <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="bg-rose-500/10 p-2 rounded-lg text-rose-500 group-hover:scale-110 transition-transform">
                        <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">미결제 항목</p>
                        <p className="text-sm font-bold text-white">{summary.pending_logs_count}건 대기 중</p>
                    </div>
                </div>

                {/* Project Health */}
                <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500 group-hover:scale-110 transition-transform">
                        <Zap className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">진행률 지표</p>
                        <p className="text-sm font-bold text-white text-emerald-400">최적화 상태</p>
                    </div>
                </div>

                {/* Last Audit */}
                <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">데이터 동기화</p>
                        <p className="text-sm font-bold text-white">정상 작동 중</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
