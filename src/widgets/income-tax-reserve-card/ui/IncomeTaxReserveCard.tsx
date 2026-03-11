'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { AlertCircle, Wallet } from 'lucide-react'
import { getIncomeTaxReserve, type IncomeTaxReserve } from '@/entities/vat/api/get-income-tax-reserve'
import { toast } from 'sonner'
import Link from 'next/link'

export function IncomeTaxReserveCard() {
  const [reserve, setReserve] = useState<IncomeTaxReserve | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getIncomeTaxReserve()
      setReserve(data)
    } catch (error) {
      console.error('Failed to load income tax data:', error)
      toast.error('종소세 정보 로드 실패')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">로딩 중...</div>
  }

  if (!reserve || reserve.total_income === 0) {
    return (
      <Card className="border-purple-200/50 bg-purple-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-purple-900">
            <Wallet className="h-4 w-4" />
            세금 보유금 (종소세)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-purple-700">
            아직 이번 달 수입이 기록되지 않았습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const displayRate = (reserve.rate * 100).toFixed(0)

  return (
    <Card className="border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-fuchsia-50/30">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base flex items-center gap-2 text-purple-900">
            <Wallet className="h-4 w-4" />
            세금 보유금 (종소세 {displayRate}%)
          </CardTitle>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">준비금 적립 요망</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Tax Amount */}
        <div className="bg-white/50 rounded-lg p-3 border-purple-100/50">
          <p className="text-xs text-purple-600/70 font-medium mb-1">이번 달 종소세 예비비</p>
          <p className="text-2xl font-bold text-purple-900">
            {reserve.income_tax_amount.toLocaleString()}원
          </p>
          <p className="text-xs text-purple-600 mt-2">
            누적 매출: {reserve.total_income.toLocaleString()}원
          </p>
        </div>

        {/* Tax Calculation Info */}
        <div className="bg-white/30 rounded-lg p-2 border-purple-100/30 flex justify-between items-center">
          <div>
            <p className="text-xs text-purple-700 font-medium mb-1">계산식</p>
            <p className="text-xs text-purple-600">
              총 매출 × {displayRate}% = {reserve.income_tax_amount.toLocaleString()}원
            </p>
          </div>
          <Link href="/settings/user" className="text-xs text-purple-500 hover:text-purple-700 underline underline-offset-2">
            세율 변경
          </Link>
        </div>

        {/* Status Indicator */}
        <div className="bg-purple-100/40 rounded-lg p-2 border-purple-200/50">
          <p className="text-xs text-purple-800">
            💡 종소세 통장으로 이체해두세요
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
