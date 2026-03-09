"use client"

import * as React from "react"
import { FileDropzone } from "./file-dropzone"
import { Button } from "@/shared/ui/button"
import { parseExcel, ParseResult } from "../model/parser"
import { ImportSyncGuide } from "./ImportSyncGuide"
import { fetchFxRates, FxRates, FX_FALLBACK_RATES } from "../lib/fx-rate"
import { createClient } from "@/shared/api/supabase/client"

/** DB app_settings에서 사용자 설정 fallback 환율 로드 */
async function loadDbFallbackRates(): Promise<Record<string, number> | null> {
    try {
        const supabase = createClient()
        const { data } = await (supabase as any)
            .from('app_settings')
            .select('value')
            .eq('key', 'fx_fallback_rates')
            .single()
        return (data?.value as Record<string, number>) ?? null
    } catch {
        return null
    }
}

export function LedgerImportWidget() {
    const [file, setFile] = React.useState<File | null>(null)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [parseResult, setParseResult] = React.useState<ParseResult | null>(null)
    const [fxRates, setFxRates] = React.useState<FxRates | null>(null)

    // 컴포넌트 마운트 시 환율 미리 로드
    // 우선순위: DB 설정 fallback → 실시간 API → 하드코딩 fallback
    React.useEffect(() => {
        const loadRates = async () => {
            const dbFallback = await loadDbFallbackRates()
            const fx = await fetchFxRates()
            // API 성공 시 그대로 사용, 실패(fallback) 시 DB 설정으로 보완
            if (fx.source === 'fallback' && dbFallback) {
                setFxRates({ ...fx, rates: { ...dbFallback, ...fx.rates } })
            } else {
                setFxRates(fx)
            }
        }
        loadRates().catch(console.error)
    }, [])

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile)
        setParseResult(null)
    }

    const handleParse = async () => {
        if (!file) return
        setIsProcessing(true)
        try {
            // 환율이 아직 로드 안 됐으면 다시 시도
            const rates = fxRates ?? await fetchFxRates()
            const result = await parseExcel(file, { fxRates: rates.rates })
            setParseResult(result)
        } catch (error: any) {
            console.error(error)
            alert(`파싱 오류: ${error.message}`)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSave = async () => {
        if (!parseResult) return
        setIsProcessing(true)
        try {
            const { uploadBatchAction } = await import("../api/upload-batch")
            const result = await uploadBatchAction(parseResult.transactions)

            if (result.success) {
                alert(`✅ 저장 완료! ${result.count}건이 DB에 등록되었습니다.`)
                setFile(null)
                setParseResult(null)
                window.location.reload()
            } else {
                alert(`❌ 저장 실패: ${result.errors.join(", ")}`)
            }
        } catch (error: any) {
            console.error(error)
            alert(`저장 중 오류: ${error.message}`)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReset = async () => {
        if (!confirm("정말 모든 거래내역을 삭제하시겠습니까? (되돌릴 수 없습니다)")) return;
        setIsProcessing(true);
        try {
            const { resetTransactionsAction } = await import("../api/reset-data");
            const res = await resetTransactionsAction();
            if (res.success) {
                alert("🗑️ 초기화 완료. 다시 업로드해주세요.");
                window.location.reload();
            } else {
                alert("삭제 실패: " + res.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    }

    const hasForeignTx = (parseResult?.stats.foreignCurrencyCount ?? 0) > 0

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 glass-panel p-8 relative">
            <button
                onClick={handleReset}
                className="absolute top-4 right-4 text-xs text-red-400 hover:text-red-600 underline"
            >
                [데이터 초기화]
            </button>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    통합 가계부 가져오기 (V2.0)
                </h2>
                <p className="text-muted-foreground">
                    은행/카드사 엑셀 파일을 업로드하세요. (삼성, 현대, BC, 카카오 등 자동인식)
                </p>
                {/* 환율 상태 표시 */}
                {fxRates && (
                    <p className="text-xs text-muted-foreground/60">
                        USD/KRW {fxRates.rates.USD?.toLocaleString()}원
                        {fxRates.source === 'fallback' && ' (fallback)'}
                        {fxRates.source === 'api' && ' (실시간)'}
                        · 해외카드 임포트 시 적용
                    </p>
                )}
            </div>

            <ImportSyncGuide />

            <FileDropzone onFileSelect={handleFileSelect} isProcessing={isProcessing} />

            {file && !parseResult && (
                <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button
                        size="lg"
                        onClick={handleParse}
                        disabled={isProcessing}
                        className="w-full sm:w-auto"
                    >
                        {isProcessing ? "분석 중..." : "데이터 분석 시작"}
                    </Button>
                </div>
            )}

            {parseResult && (
                <div className="flex flex-col items-center gap-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-bottom-4">
                    {/* 기본 통계 */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mb-2">
                        <div className="bg-card p-4 rounded-lg border text-center">
                            <div className="text-xs text-muted-foreground uppercase">Format</div>
                            <div className="font-bold text-primary">{parseResult.stats.bankIdentified || 'Unknown'}</div>
                        </div>
                        <div className="bg-card p-4 rounded-lg border text-center">
                            <div className="text-xs text-muted-foreground uppercase">Found</div>
                            <div className="font-bold text-green-500">{parseResult.transactions.length}건</div>
                        </div>
                        <div className="bg-card p-4 rounded-lg border text-center">
                            <div className="text-xs text-muted-foreground uppercase">Filtered (Net-Zero)</div>
                            <div className="font-bold text-orange-500">{parseResult.stats.filteredCount}건</div>
                        </div>
                    </div>

                    {/* 해외 결제 알림 배너 */}
                    {hasForeignTx && (
                        <div className="w-full max-w-2xl rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                            <div className="flex items-start gap-2">
                                <span className="text-lg leading-none">🌐</span>
                                <div>
                                    <p className="font-semibold">
                                        해외 결제 {parseResult.stats.foreignCurrencyCount}건 감지됨
                                    </p>
                                    <p className="text-xs mt-0.5 text-amber-700">
                                        원화 미결제분은 USD 기준 <strong>1{parseResult.stats.fxRatesUsed?.USD?.toLocaleString()}원</strong> 환율로
                                        근사 변환되었습니다. (KRW 결제분은 정확)
                                        실제 청구금액은 매출전표 접수 시 환율 기준이므로 다를 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-center text-sm text-muted-foreground">
                        <p>총 {parseResult.stats.totalRows}행 중 {parseResult.transactions.length}건의 유효 데이터를 추출했습니다.</p>
                        {parseResult.stats.filteredCount > 0 && (
                            <p className="text-orange-400">※ 결제 후 즉시 취소된 {parseResult.stats.filteredCount}건의 중복 내역이 자동으로 제외되었습니다.</p>
                        )}
                    </div>

                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={isProcessing}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    >
                        {isProcessing ? "저장 중..." : "DB에 저장하기"}
                    </Button>
                </div>
            )}
        </div>
    )
}
