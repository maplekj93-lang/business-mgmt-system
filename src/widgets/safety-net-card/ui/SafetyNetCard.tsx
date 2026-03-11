'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Progress } from '@/shared/ui/progress'
import { AlertTriangle, ShieldCheck, ShieldAlert, Settings } from 'lucide-react'
import { getUserSettings } from '@/entities/user-settings/api/get-user-settings'
import { getSafetyNetBalance } from '@/entities/user-settings/api/get-safety-net-balance'
import type { UserSettings } from '@/entities/user-settings/model/types'
import { toast } from 'sonner'
import Link from 'next/link'

export function SafetyNetCard() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [userSettings, safetyBalance] = await Promise.all([
        getUserSettings(),
        getSafetyNetBalance()
      ])
      setSettings(userSettings)
      setBalance(safetyBalance)
    } catch (error) {
      console.error('Failed to load safety net data:', error)
      toast.error('안전망 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">로딩 중...</div>
  }

  const defaultExpense = 3000000
  const monthlyExpense = settings?.monthly_living_expense || defaultExpense
  const target = monthlyExpense * 3
  
  // Calculate percentage (max 100%)
  const percentage = Math.min((balance / target) * 100, 100)

  // Color logic
  let colorClass = 'bg-red-500'
  let Icon = ShieldAlert
  let iconColor = 'text-red-600'
  let message = '⚠️ 안전망이 부족합니다. 고정 지출을 최소화하세요.'
  
  if (percentage >= 80) {
    colorClass = 'bg-green-500'
    Icon = ShieldCheck
    iconColor = 'text-green-600'
    message = '✅ 3개월치 생활비가 충분히 확보되었습니다.'
  } else if (percentage >= 50) {
    colorClass = 'bg-yellow-500'
    Icon = AlertTriangle
    iconColor = 'text-yellow-600'
    message = '🟡 안전망을 더 확보해야 합니다.'
  }

  return (
    <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base flex items-center gap-2 text-blue-900">
            <ShieldCheck className="h-4 w-4" />
            안전망 (3개월 버퍼)
          </CardTitle>
          <Link href="/settings/user" className="text-blue-500 hover:text-blue-700 transition">
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="bg-white/50 rounded-lg p-3 border-blue-100/50">
          <p className="text-xs text-blue-600/70 font-medium mb-1">현재 안전 잔고</p>
          <p className="text-2xl font-bold text-blue-900">
            {balance.toLocaleString()}원
          </p>
          <div className="flex justify-between items-end mt-2">
            <p className="text-xs text-blue-600">
              목표: {target.toLocaleString()}원
            </p>
            <p className="text-xs font-bold text-blue-800">
              {percentage.toFixed(1)}% 달성
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Progress 
            value={percentage} 
            className="h-2 bg-blue-100" 
            indicatorClassName={colorClass} 
          />
        </div>

        {/* Status Indicator */}
        <div className="bg-white/30 rounded-lg p-2 border-blue-100/30 flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <p className="text-xs text-slate-700 font-medium">
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
