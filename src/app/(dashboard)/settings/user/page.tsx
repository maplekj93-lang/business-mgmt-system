import { VirtualSalarySettingsCard } from '@/features/manage-virtual-salary/ui/VirtualSalarySettingsCard'

export const metadata = {
  title: '사용자 설정',
  description: '종합소득세 예약금, 가상 월급 및 재무 안전망 설정',
}

export default function UserSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">사용자 설정</h3>
        <p className="text-sm text-muted-foreground">
          앱 전체에 동작하는 재무 및 개인 설정을 관리합니다.
        </p>
      </div>
      <div className="grid gap-6">
        <VirtualSalarySettingsCard />
      </div>
    </div>
  )
}
