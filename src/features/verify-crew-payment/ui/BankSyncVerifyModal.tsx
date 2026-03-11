'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Badge } from '@/shared/ui/badge'
import { FileUp, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { parseBankExport, type BankRecord } from '../api/parse-bank-export'
import { matchCrewPayments, type CrewPaymentMatch } from '../api/match-crew-payments'
import { confirmBankVerification } from '../api/confirm-bank-verification'

export function BankSyncVerifyModal({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<CrewPaymentMatch[]>([])
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const records = await parseBankExport(file)
      
      if (records.length === 0) {
        toast.error('출금 내역을 찾을 수 없습니다.')
        return
      }

      const matchResults = await matchCrewPayments(records)
      setMatches(matchResults)
      setStep('review')

    } catch (err) {
      console.error(err)
      toast.error('파일 파싱 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleConfirm = async () => {
    try {
      setLoading(true)
      const res = await confirmBankVerification(matches)
      if (res.success) {
        toast.success(`${res.updated_count}건의 지급 내역이 교차 검증되었습니다.`)
        setOpen(false)
        setStep('upload')
        setMatches([])
        // TODO: Reload table data or router.refresh() if necessary
        window.location.reload()
      }
    } catch (error) {
      console.error(error)
      toast.error('확정 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
        setOpen(val)
        if (!val) {
            setStep('upload')
            setMatches([])
        }
    }}>
      <DialogTrigger asChild>
        {children || <Button variant="outline"><FileUp className="w-4 h-4 mr-2" /> 현장 지급 통장 대조</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🏦 크루 페이 통장 교차 검증 (Bank Sync)</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50 border-slate-200">
            <FileUp className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">은행 엑셀 내역 업로드</h3>
            <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
              기업은행 또는 카카오뱅크 입출금 내역 (CSV/XLSX) 파일을 업로드하여 '지급 완료'된 크루 페이와 실제 출금 내역을 대조합니다.
            </p>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={loading}>
              {loading ? '파싱 중...' : '파일 선택'}
            </Button>
          </div>
        )}

        {step === 'review' && (
           <div className="space-y-4 pt-4">
             <div className="flex gap-4 mb-4">
                <div className="bg-slate-100 p-3 rounded-lg flex-1 text-center">
                    <p className="text-xs text-slate-500">총 검증 대상</p>
                    <p className="text-xl font-bold">{matches.length}건</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg flex-1 text-center">
                    <p className="text-xs text-green-600">완벽 매칭 (확정 가능)</p>
                    <p className="text-xl font-bold text-green-700">{matches.filter(m => m.match_status === 'matched').length}건</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg flex-1 text-center">
                    <p className="text-xs text-yellow-600">이름 미확인</p>
                    <p className="text-xl font-bold text-yellow-700">{matches.filter(m => m.match_status === 'candidate').length}건</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg flex-1 text-center">
                    <p className="text-xs text-red-600">미송금 의심</p>
                    <p className="text-xl font-bold text-red-700">{matches.filter(m => m.match_status === 'app_only').length}건</p>
                </div>
             </div>

             <div className="border rounded-lg overflow-hidden">
             <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>앱 기록 (크루명/날짜/금액)</TableHead>
                        <TableHead>은행 통장 출금 (메모/날짜/금액)</TableHead>
                        <TableHead>매칭 결과</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {matches.map((m, idx) => (
                        <TableRow key={idx}>
                            <TableCell>
                                {m.match_status !== 'bank_only' ? (
                                    <div className="space-y-1">
                                        <div className="font-medium">{m.crew_name}</div>
                                        <div className="text-xs text-slate-500">{m.paid_date}</div>
                                        <div className="text-sm">{m.amount_net?.toLocaleString()}원</div>
                                    </div>
                                ) : <span className="text-slate-400 italic">앱 기록 없음 (통장 단독 출금)</span>}
                            </TableCell>
                            <TableCell>
                                {m.bank_record ? (
                                    <div className="space-y-1 text-slate-700">
                                        <div className="font-medium">{m.bank_record.memo || '메모 없음'}</div>
                                        <div className="text-xs text-slate-500">{m.bank_record.date}</div>
                                        <div className="text-sm">{m.bank_record.amount.toLocaleString()}원</div>
                                    </div>
                                ) : <span className="text-red-400 italic">은행 출금 내역 없음</span>}
                            </TableCell>
                            <TableCell>
                                {m.match_status === 'matched' && <Badge className="bg-green-100 hover:bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> 일치함</Badge>}
                                {m.match_status === 'candidate' && <Badge className="bg-yellow-100 hover:bg-yellow-100 text-yellow-700 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" /> 후보 확인요망</Badge>}
                                {m.match_status === 'app_only' && <Badge className="bg-red-100 hover:bg-red-100 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> 미송금 의심</Badge>}
                                {m.match_status === 'bank_only' && <Badge variant="outline" className="text-slate-500"><HelpCircle className="w-3 h-3 mr-1" /> 통장 기타지출</Badge>}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
             </div>

             <div className="flex justify-end gap-2 pt-4 border-t">
                 <Button variant="outline" onClick={() => setStep('upload')}>다시 업로드</Button>
                 <Button onClick={handleConfirm} disabled={loading || matches.filter(m => m.match_status === 'matched').length === 0}>
                     {loading ? '처리 중...' : '완벽 매칭 항목만 일괄 확정'}
                 </Button>
             </div>
           </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
