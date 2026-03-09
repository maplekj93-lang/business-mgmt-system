"use client"

import React, { useRef } from 'react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Printer, Download, FileText } from 'lucide-react'
import { Project } from '@/entities/project'

interface QuoteTemplateProps {
    project: Project;
    profile: any; // BusinessProfile
    items: { description: string; quantity: number; price: number }[];
}

export function QuoteTemplate({ project, profile, items }: QuoteTemplateProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>견적서 - ${project.name}</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        @media print {
                            body { padding: 20mm; }
                            .no-print { display: none; }
                        }
                        body { font-family: 'Pretendard', sans-serif; }
                    </style>
                </head>
                <body>
                    ${content.innerHTML}
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2 no-print">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" /> 인쇄 / PDF 저장
                </Button>
            </div>

            <Card className="border-none shadow-none">
                <CardContent ref={printRef} className="p-8 bg-white text-black min-h-[1100px] flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tighter mb-1">견 적 서</h1>
                            <p className="text-sm text-gray-500 font-mono">QUOTE / ESTIMATE</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-xl font-bold">{profile.business_name || '상호명 미기재'}</p>
                            <p className="text-sm">대표: {profile.representative_name || '이름 미기재'}</p>
                            <p className="text-sm">사업자번호: {profile.business_number || '-'}</p>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="grid grid-cols-2 gap-8 mb-12">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-gray-400">발신 (From)</Label>
                            <div className="border-l-4 border-blue-500 pl-4">
                                <p className="font-bold text-lg">{profile.business_name}</p>
                                <p className="text-sm">{profile.address || ''}</p>
                                <p className="text-sm">{profile.bank_name} {profile.account_number}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <Label className="text-xs uppercase text-gray-400">수신 (To)</Label>
                            <div className="pr-4">
                                <p className="font-bold text-lg">{project.client?.name || '고객 귀하'}</p>
                                <p className="text-sm">프로젝트: {project.name}</p>
                                <p className="text-sm">발행일: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black bg-gray-50">
                                    <th className="py-3 px-2 font-bold mb-2">항목 (Description)</th>
                                    <th className="py-3 px-2 text-right font-bold w-24">수량</th>
                                    <th className="py-3 px-2 text-right font-bold w-32">단가</th>
                                    <th className="py-3 px-2 text-right font-bold w-32">금액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-200">
                                        <td className="py-4 px-2 font-medium">{item.description}</td>
                                        <td className="py-4 px-2 text-right">{item.quantity}</td>
                                        <td className="py-4 px-2 text-right">{item.price.toLocaleString()}</td>
                                        <td className="py-4 px-2 text-right font-bold">{(item.quantity * item.price).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Total */}
                    <div className="border-t-2 border-black mt-8 pt-6">
                        <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-lg">
                            <span className="text-xl font-bold uppercase tracking-widest">합계 (Total Amount)</span>
                            <span className="text-3xl font-black">₩ {totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="mt-8 text-sm text-gray-500 italic">
                            * 본 견적은 발행일로부터 30일간 유효합니다.<br />
                            * 작업 착수 시 계약금 50%를 지불해 주셔야 합니다.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
