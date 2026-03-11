'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { toast } from 'sonner'
import { getUserSettings } from '@/entities/user-settings/api/get-user-settings'
import { updateUserSettings } from '@/entities/user-settings/api/update-user-settings'
import type { UserSettings } from '@/entities/user-settings/model/types'

export function VirtualSalarySettingsCard() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [monthlyExpense, setMonthlyExpense] = useState('3000000')
  const [virtualAmount, setVirtualAmount] = useState('0')
  const [virtualDay, setVirtualDay] = useState('25')
  const [taxRate, setTaxRate] = useState('15')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getUserSettings()
      if (data) {
        setSettings(data)
        setMonthlyExpense(String(data.monthly_living_expense || 3000000))
        setVirtualAmount(String(data.virtual_salary_amount || 0))
        setVirtualDay(String(data.virtual_salary_day || 25))
        setTaxRate(String((data.income_tax_rate || 0.15) * 100))
      }
    } catch (error) {
      console.error(error)
      toast.error('설정을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateUserSettings({
        monthly_living_expense: Number(monthlyExpense),
        virtual_salary_amount: Number(virtualAmount),
        virtual_salary_day: Number(virtualDay),
        income_tax_rate: Number(taxRate) / 100,
      })
      toast.success('설정이 저장되었습니다.')
    } catch (error) {
      console.error(error)
      toast.error('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 border rounded-lg">설정 로딩 중...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>재무 안전망 설정</CardTitle>
        <CardDescription>
          고정 생활비와 가상 월급, 종소세 예비비 환산 비율을 설정합니다. (향후 이 설정은 대시보드 위젯과 실시간 연동됩니다)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
            
            <div className="space-y-2">
                <Label>가상 월급 지급액 (원)</Label>
                <div className="text-xs text-slate-500 mb-1">사업 통장에서 생활비 통장으로 이체될 목표 금액</div>
                <Input 
                    type="number" 
                    value={virtualAmount} 
                    onChange={e => setVirtualAmount(e.target.value)} 
                />
            </div>

            <div className="space-y-2">
                <Label>가상 월급 지급일 (매월 N일)</Label>
                <div className="text-xs text-slate-500 mb-1">1일부터 31일 사이의 날짜</div>
                <Input 
                    type="number" 
                    min={1} max={31}
                    value={virtualDay} 
                    onChange={e => setVirtualDay(e.target.value)} 
                />
            </div>

            <div className="space-y-2">
                <Label>월 고정 생활비 (원)</Label>
                <div className="text-xs text-slate-500 mb-1">3개월 안전망 버퍼를 계산하는 기준이 됩니다 (현재 기준 × 3)</div>
                <Input 
                    type="number" 
                    value={monthlyExpense} 
                    onChange={e => setMonthlyExpense(e.target.value)} 
                />
            </div>

            <div className="space-y-2">
                <Label>종합소득세 에비비 적립 비율 (%)</Label>
                <div className="text-xs text-slate-500 mb-1">총 매출에서 매월 떼어둘 종소세 파우치 비율 (기본 15%)</div>
                <Input 
                    type="number" 
                    min={0} max={100}
                    value={taxRate} 
                    onChange={e => setTaxRate(e.target.value)} 
                />
            </div>

        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t flex justify-between py-4">
          <p className="text-sm text-slate-500">저장 시 대시보드와 자동 동기화됩니다.</p>
          <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '설정 저장'}</Button>
      </CardFooter>
    </Card>
  )
}
