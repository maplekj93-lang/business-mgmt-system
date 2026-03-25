"use client"

import * as React from "react"
import { FileDropzone } from "./file-dropzone"
import { Button } from "@/shared/ui/button"
import { parseExcel, ParseResult } from "../model/parser"
import { ImportSyncGuide } from "./ImportSyncGuide"
import { fetchFxRates, FxRates, FX_FALLBACK_RATES } from "../lib/fx-rate"
import { createClient } from "@/shared/api/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Label } from "@/shared/ui/label"
import { getAssets } from "@/entities/asset/api/get-assets"
import { Asset } from "@/entities/asset/model/schema"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/ui/dialog";
import { Button as ShadcnButton } from "@/shared/ui/button"; // Renamed to avoid conflict with existing Button import
import { format } from "date-fns";

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
    const [matchingResults, setMatchingResults] = React.useState<any[] | null>(null)
    const [isMatchingMode, setIsMatchingMode] = React.useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
    const [assets, setAssets] = React.useState<Asset[]>([])
    const [selectedAssetId, setSelectedAssetId] = React.useState<string>("auto")

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
        const loadAssets = async () => {
            const data = await getAssets()
            setAssets(data)
        }
        loadRates().catch(console.error)
        loadAssets().catch(console.error)
    }, [])

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile)
        setParseResult(null)
        setMatchingResults(null)
        setIsMatchingMode(false)
    }

    const handleParse = async () => {
        if (!file) return
        setIsProcessing(true)
        try {
            // 환율이 아직 로드 안 됐으면 다시 시도
            const rates = fxRates ?? await fetchFxRates()
            const result = await parseExcel(file, { fxRates: rates.rates })
            
            // 카카오페이 거래내역서 감지 시 매칭 모드로 전환
            if (result.stats.bankIdentified?.includes('카카오페이(거래내역서)')) {
                const { matchKakaoTransactions } = await import("../../kakao-pay-matcher/model/matcher")
                const supabase = createClient()
                // '카카오페이'가 포함된 미분류 거래 조회
                const { data: txs } = await supabase
                    .from("transactions")
                    .select("*")
                    .ilike("description", "%카카오%") // '카카오페이'에서 '카카오' 전체로 확장
                    .not("description", "ilike", "%뱅크%") // 뱅크 이체 내역은 제외
                    .is("breakdown_source_id", null);

                if (txs) {
                    // result.transactions를 KakaoPayRow 리스트로 변환 (파일 재읽기 방지)
                    const kakaoRows = result.transactions.map((t, idx) => ({
                        _import_idx: idx,
                        date: t.date.split('T')[0].replace(/-/g, '.'),
                        time: t.date.split('T')[1] || '',
                        type: (t.source_raw_data as any)?.raw_type || '', // parser에서 저장한 원본 유형
                        amount: Math.abs(t.amount),
                        merchant: t.description,
                        currency: 'KRW'
                    }));
                    
                    console.log("=== KAKAO MATCHER DEBUG ===");
                    console.log("DB TARGETS (txs count):", txs.length);
                    console.log("DB TARGETS SAMPLE:", txs.slice(0, 3).map(t => ({ id: t.id, desc: t.description, date: t.date, amount: t.amount })));
                    console.log("KAKAO ROWS (count):", kakaoRows.length);
                    console.log("KAKAO ROWS SAMPLE:", kakaoRows.slice(0, 3));
                    
                    const matches = await matchKakaoTransactions(txs, kakaoRows)
                    
                    console.log("MATCH RESULT COUNT:", matches.length);
                    console.log("===========================");
                    
                    setMatchingResults(matches)
                    setIsMatchingMode(true)
                }
            }

            setParseResult(result)

            // 자동 매핑 제안 (은행명이 포함된 자산 찾기)
            if (result.stats.bankIdentified) {
                const searchKey = result.stats.bankIdentified.toLowerCase()
                const suggested = assets.find(a => 
                    a.name.toLowerCase().includes(searchKey) || 
                    (a.identifier_keywords || []).some((k: string) => searchKey.includes(k.toLowerCase()))
                )
                if (suggested) {
                    setSelectedAssetId(suggested.id)
                }
            }
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
            if (isMatchingMode && matchingResults) {
                const { saveKakaoMappings } = await import("../../kakao-pay-matcher/model/matcher")
                await saveKakaoMappings(matchingResults)
                
                // 1. 매칭된 행의 오리지널 인덱스 수집
                const matchedIndices = new Set(matchingResults.map(m => m.kakaoPayRow._import_idx));
                
                // 2. 미매칭된 행 필터링 (원본 ValidatedTransaction 유지)
                const unmatchedTransactions = parseResult.transactions.filter((_, idx) => !matchedIndices.has(idx));

                let addedMsg = "";
                if (unmatchedTransactions.length > 0) {
                    // 3. 미매칭 건들을 기존 배치 업로드 로직을 태워 신규 내역으로 등록
                    const { uploadBatchAction } = await import("../api/upload-batch")
                    const batchResult = await uploadBatchAction(unmatchedTransactions);
                    
                    if (batchResult.success && batchResult.insertedIds) {
                        // 4. 자동 태깅 룰 적용
                        const { applyTaggingRules } = await import("../../refine-ledger/api/apply-tagging-rules")
                        const ruleResult = await applyTaggingRules(batchResult.insertedIds)
                        addedMsg = `\n(미매칭 지출 ${batchResult.addedCount}건 등록 및 ${ruleResult.auto_applied}건 자동 분류됨)`;
                    } else if (batchResult.success) {
                        addedMsg = `\n(미매칭 지출 ${batchResult.addedCount}건 신규 내역 등록됨)`;
                    } else {
                        console.error("미매칭 건 자동 등록 실패:", batchResult.errors);
                    }
                }
                
                alert(`✅ 카카오페이 매칭 갱신 완료! (${matchingResults.length}건 업데이트)${addedMsg}`)
                setFile(null)
                setParseResult(null)
                setMatchingResults(null)
                setIsMatchingMode(false)
                window.location.reload()
                return
            }

            const { uploadBatchAction } = await import("../api/upload-batch")
            const result = await uploadBatchAction(
                parseResult.transactions, 
                selectedAssetId === "auto" ? undefined : selectedAssetId
            )

            if (result.success) {
                let ruleMsg = "";
                if (result.insertedIds && result.insertedIds.length > 0) {
                    const { applyTaggingRules } = await import("../../refine-ledger/api/apply-tagging-rules")
                    const ruleResult = await applyTaggingRules(result.insertedIds)
                    if (ruleResult.auto_applied > 0) {
                        ruleMsg = `\n(이 중 ${ruleResult.auto_applied}건이 기존 규칙에 의해 자동 분류되었습니다.)`
                    }
                }

                alert(`✅ 저장 완료! ${result.count}건이 DB에 등록되었습니다.${ruleMsg}`)
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
        setIsResetDialogOpen(false);
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
        <div className="w-full max-w-4xl mx-auto space-y-8 tactile-panel p-8 relative">
            {/* 데이터 초기화 버튼 & 모달 */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="absolute top-4 right-4 text-xs text-red-400 hover:text-red-600 underline"
                    >
                        [데이터 초기화]
                    </button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>데이터 전체 초기화</DialogTitle>
                        <DialogDescription>
                            정말 모든 거래내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <ShadcnButton variant="ghost" onClick={() => setIsResetDialogOpen(false)}>취소</ShadcnButton>
                        <ShadcnButton variant="destructive" onClick={handleReset}>모두 삭제하기</ShadcnButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
                <div className="flex justify-end pt-4 border-t">
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
                <div className="flex flex-col items-center gap-4 pt-4 border-t animate-in fade-in slide-in-from-bottom-4">
                    {/* 기본 통계 */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mb-2">
                        <div className="bg-card p-4 rounded-lg text-center border border-primary/10">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Format</div>
                            <div className="font-bold text-primary truncate px-2">{parseResult.stats.bankIdentified || 'Unknown'}</div>
                        </div>
                        <div className="bg-card p-4 rounded-lg text-center border border-primary/10">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Found</div>
                            <div className="font-bold text-green-500">{parseResult.transactions.length}건</div>
                        </div>
                        <div className="bg-card p-4 rounded-lg text-center border border-primary/10">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Filtered</div>
                            <div className="font-bold text-orange-500">{parseResult.stats.filteredCount}건</div>
                        </div>
                    </div>

                    {/* 자산 선택 및 기간 확인 [NEW] */}
                    <div className="w-full max-w-2xl bg-secondary/30 p-6 rounded-xl border border-primary/5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <Label className="text-sm font-semibold">대상 자산 (계좌/카드) 선택</Label>
                                <p className="text-xs text-muted-foreground">이 내역을 어느 자산에 몰아서 기록할까요?</p>
                            </div>
                            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                                <SelectTrigger className="w-full sm:w-[280px] bg-background">
                                    <SelectValue placeholder="자산 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">자동 인식 (기본값)</SelectItem>
                                    {assets.map(a => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.owner_type === 'kwangjun' ? '👤 ' : 
                                             a.owner_type === 'euiyoung' ? '👩 ' : 
                                             a.owner_type === 'joint' ? '👥 ' : 
                                             a.owner_type === 'business' ? '🏢 ' : '💰 '}
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {parseResult.transactions.length > 0 && (
                            <div className="pt-4 border-t border-primary/5 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">데이터 기간</span>
                                <span className="font-medium text-primary">
                                    {format(new Date(parseResult.transactions[0].date), 'yyyy.MM.dd')} 
                                    {" ~ "}
                                    {format(new Date(parseResult.transactions[parseResult.transactions.length - 1].date), 'yyyy.MM.dd')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 해외 결제 알림 배너 */}
                    {hasForeignTx && (
                        <div className="w-full max-w-2xl rounded-lg bg-amber-50 border-amber-200 px-4 py-3 text-sm text-amber-800">
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

                    {/* 카카오페이 매칭 결과 표시 */}
                    {isMatchingMode && matchingResults && (
                        <div className="w-full max-w-2xl mt-4 bg-yellow-50/50 border border-yellow-200 rounded-lg overflow-hidden">
                            <div className="bg-yellow-100/50 px-4 py-2 border-b border-yellow-200">
                                <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                                    <span>🟡</span> 카카오페이 가맹점 매칭 결과 ({matchingResults.length}건)
                                </h3>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                <table className="min-w-full divide-y divide-yellow-200 text-xs">
                                    <thead className="bg-yellow-50/50 text-yellow-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left">날짜/시간</th>
                                            <th className="px-4 py-2 text-left">가맹점(매칭)</th>
                                            <th className="px-4 py-2 text-right">금액</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-yellow-100">
                                        {matchingResults.map((m, i) => (
                                            <tr key={i} className="hover:bg-yellow-100/30">
                                                <td className="px-4 py-2 opacity-60">{m.kakaoPayRow.date} {m.kakaoPayRow.time}</td>
                                                <td className="px-4 py-2 font-bold text-yellow-900">{m.kakaoPayRow.merchant}</td>
                                                <td className="px-4 py-2 text-right">{m.kakaoPayRow.amount.toLocaleString()}원</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="text-center text-sm text-muted-foreground">
                        {isMatchingMode && matchingResults ? (
                            <p className="font-medium text-yellow-700">
                                업로드한 카카오페이 내역 {parseResult.transactions.length}건 중 
                                **{matchingResults.length}건**이 기존 은행/카드 내역과 매칭되었습니다.
                            </p>
                        ) : (
                            <p>총 {parseResult.stats.totalRows}행 중 {parseResult.transactions.length}건의 유효 데이터를 추출했습니다.</p>
                        )}
                        {parseResult.stats.filteredCount > 0 && (
                            <p className="text-orange-400">※ 결제 후 즉시 취소된 {parseResult.stats.filteredCount}건의 중복 내역이 자동으로 제외되었습니다.</p>
                        )}
                    </div>

                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={isProcessing}
                        className={`w-full sm:w-auto ${isMatchingMode ? 'bg-yellow-400 hover:bg-yellow-500 text-black font-bold' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isProcessing ? "저장 중..." : isMatchingMode ? "매칭 결과 반영하기" : "DB에 저장하기"}
                    </Button>
                </div>
            )}
        </div>
    )
}
