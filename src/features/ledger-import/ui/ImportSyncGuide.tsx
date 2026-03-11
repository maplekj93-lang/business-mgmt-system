'use client';

import { Info, ExternalLink } from 'lucide-react';
import { useImportSyncGuide } from '../model/useImportSyncGuide';
import { formatDateKo, formatDateTimeKo, getBankLink } from '../lib/utils';
import type { AssetSyncInfo } from '@/entities/asset/model/schema';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/shared/ui/accordion';

// [NOTE] 스켈레톤과 에러 등을 함께 위치 (WORK ORDER Step 6)

export function ImportSyncGuide() {
    const { data, isLoading, isError } = useImportSyncGuide();

    if (isLoading) return <SyncGuideSkeleton />;
    if (isError) return <SyncGuideError />;
    if (!data || data.length === 0) return null;

    // Sort data: items with older last_transaction_date come first. Items with no date go last.
    const sortedData = [...data].sort((a, b) => {
        if (!a.last_transaction_date) return 1;
        if (!b.last_transaction_date) return -1;
        return new Date(a.last_transaction_date).getTime() - new Date(b.last_transaction_date).getTime();
    });

    return (
        <section className="mb-6">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="sync-guide" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-2">
                        <h2 className="text-sm font-semibold text-gray-600">
                            📥 자산별 엑셀 다운로드 가이드
                        </h2>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="rounded-xl border-gray-200 bg-white overflow-hidden shadow-sm mt-2">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-muted">
                                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[30%]">자산</th>
                                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">권장 다운로드 구간</th>
                                        <th className="w-10 py-2.5" />
                                        <th className="w-10 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sortedData.map((asset: AssetSyncInfo) => (
                                        <AssetRow key={asset.asset_id} asset={asset} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    );
}

function AssetRow({ asset }: { asset: AssetSyncInfo }) {
    const bankLink = getBankLink(asset.asset_name);
    const isCard = asset.asset_type === 'card';

    return (
        <tr className="hover:bg-muted/60 transition-colors">
            {/* 자산명 + 유형 뱃지 */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <AssetTypeBadge type={asset.asset_type} />
                    <span className="font-medium text-gray-900 truncate">{asset.asset_name}</span>
                </div>
            </td>

            {/* 권장 다운로드 구간 */}
            <td className="px-4 py-3">
                <span className="text-blue-700 font-medium">
                    {formatDateKo(asset.recommended_start_date)}
                </span>
                <span className="text-gray-400 mx-1.5">~</span>
                <span className="text-blue-700 font-medium">
                    {isCard ? '어제' : '오늘'}
                </span>
            </td>

            {/* 상세 정보 툴팁 */}
            <td className="pr-1 py-3">
                <div className="relative group flex justify-center">
                    <button
                        className="p-1 rounded text-gray-300 hover:text-muted-foreground transition-colors"
                        aria-label="상세 정보"
                    >
                        <Info className="w-3.5 h-3.5" />
                    </button>

                    {/* 호버 툴팁 */}
                    <div
                        className="absolute z-20 hidden group-hover:block right-0 top-8 w-56 rounded-xl bg-gray-900 text-white text-xs p-3 space-y-2 pointer-events-none"
                    >
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-400 shrink-0">마지막 거래일</span>
                            <span className="font-medium text-right">{formatDateKo(asset.last_transaction_date)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-400 shrink-0">마지막 동기화</span>
                            <span className="font-medium text-right">{formatDateTimeKo(asset.last_synced_at)}</span>
                        </div>
                        {isCard && (
                            <div className="pt-1 border-t border-gray-700 text-amber-400 leading-snug">
                                ⚠️ 오늘 결제건은 매입 확정 전일 수 있어 어제까지 권장합니다.
                            </div>
                        )}
                        {/* 말풍선 꼬리 */}
                        <div className="absolute -top-1.5 right-4 w-3 h-3 bg-gray-900 rotate-45" />
                    </div>
                </div>
            </td>

            {/* 은행 바로가기 */}
            <td className="pl-1 pr-3 py-3">
                {bankLink ? (
                    <a
                        href={bankLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${bankLink.label} 바로가기`}
                        className="flex justify-center p-1 rounded text-gray-300 hover:text-blue-500 transition-colors"
                        aria-label={`${bankLink.label} 바로가기`}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                ) : (
                    <div className="w-6" />
                )}
            </td>
        </tr>
    );
}

const ASSET_TYPE_STYLES: Record<string, { label: string; className: string }> = {
    bank: { label: '통장', className: 'bg-sky-100 text-sky-700' },
    card: { label: '카드', className: 'bg-rose-100 text-rose-700' },
    cash: { label: '현금', className: 'bg-green-100 text-green-700' },
    investment: { label: '투자', className: 'bg-amber-100 text-amber-700' },
};

function AssetTypeBadge({ type }: { type: string }) {
    const style = ASSET_TYPE_STYLES[type] ?? { label: type, className: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${style.className}`}>
            {style.label}
        </span>
    );
}

function SyncGuideSkeleton() {
    return (
        <div className="mb-6 rounded-xl border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="h-9 bg-muted border-b border-gray-100" />
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 px-4 flex items-center gap-3 border-b border-gray-50 last:border-0">
                    <div className="w-10 h-5 bg-gray-100 rounded animate-pulse" />
                    <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="ml-auto w-32 h-4 bg-gray-100 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );
}

function SyncGuideError() {
    return (
        <div className="mb-6 rounded-xl border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            동기화 정보를 불러오지 못했습니다. 새로고침 해주세요.
        </div>
    );
}
