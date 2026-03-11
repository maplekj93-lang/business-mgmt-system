'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { AlertCircle, CheckCircle, FileText } from 'lucide-react'
import { getCurrentMonthVat } from '@/entities/vat/api/vat-api'
import type { VatReserve } from '@/entities/vat/model/types'
import { toast } from 'sonner'

export function VatReserveCard() {
  const [vat, setVat] = useState<VatReserve | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVat()
  }, [])

  const loadVat = async () => {
    try {
      setLoading(true)
      const data = await getCurrentMonthVat()
      setVat(data)
    } catch (error) {
      console.error('Failed to load VAT data:', error)
      toast.error('부가세 정보 로드 실패')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">로딩 중...</div>
  }

  if (!vat) {
    return (
      <Card className="border-amber-200/50 bg-amber-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-amber-900">
            <AlertCircle className="h-4 w-4" />
            세금 보유금
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700">
            아직 이번 달 수입이 매칭되지 않았습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const statusIcon = vat.status === 'paid' ? (
    <CheckCircle className="h-4 w-4 text-green-600" />
  ) : vat.status === 'filed' ? (
    <FileText className="h-4 w-4 text-primary" />
  ) : (
    <AlertCircle className="h-4 w-4 text-amber-600" />
  )

  const statusLabel = {
    pending: '준비금 적립 중',
    paid: '납부 완료',
    filed: '신고 완료',
  }[vat.status]

  return (
    <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base flex items-center gap-2 text-amber-900">
            <AlertCircle className="h-4 w-4" />
            세금 보유금 (부가세 10%)
          </CardTitle>
          <div className="flex items-center gap-2">
            {statusIcon}
            <span className="text-xs font-medium text-amber-700">{statusLabel}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* VAT Amount */}
        <div className="bg-white/50 rounded-lg p-3 border-amber-100/50">
          <p className="text-xs text-amber-600/70 font-medium mb-1">이번 달 부가세</p>
          <p className="text-2xl font-bold text-amber-900">
            {vat.vat_10_percent.toLocaleString()}원
          </p>
          <p className="text-xs text-amber-600 mt-2">
            누적 매출: {vat.total_income.toLocaleString()}원
          </p>
        </div>

        {/* Tax Calculation Info */}
        <div className="bg-white/30 rounded-lg p-2 border-amber-100/30">
          <p className="text-xs text-amber-700 font-medium mb-1">계산식</p>
          <p className="text-xs text-amber-600">
            {vat.total_income.toLocaleString()}원 × 10% = {vat.vat_10_percent.toLocaleString()}원
          </p>
        </div>

        {/* Status Indicator */}
        {vat.status === 'pending' && (
          <div className="bg-amber-100/40 rounded-lg p-2 border-amber-200/50">
            <p className="text-xs text-amber-800">
              💡 월 말까지 계속 적립될 예정입니다
            </p>
          </div>
        )}

        {vat.status === 'paid' && vat.vat_paid_date && (
          <div className="bg-green-100/40 rounded-lg p-2 border-green-200/50">
            <p className="text-xs text-green-800">
              ✓ {new Date(vat.vat_paid_date).toLocaleDateString()} 납부 완료
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
