"use client"

import { BusinessProfileSettings } from "@/features/manage-business-profile/ui/BusinessProfileSettings"
import { Briefcase } from "lucide-react"

export default function BusinessProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <Briefcase className="w-6 h-6 text-blue-500" /> 비즈니스 프로필
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    견적서 발행 및 정산 시 사용될 사업 주체 정보를 관리합니다.
                </p>
            </div>

            <BusinessProfileSettings />
        </div>
    )
}
