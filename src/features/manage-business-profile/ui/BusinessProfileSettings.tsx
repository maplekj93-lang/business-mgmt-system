"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Switch } from '@/shared/ui/switch'
import { OWNER_LABELS, type OwnerType } from '@/shared/constants/business'
import { getBusinessProfiles, updateBusinessProfile } from '../api/business-profile-api'
import { toast } from 'sonner'
import { Building, Wallet, Landmark, Globe } from 'lucide-react'

export function BusinessProfileSettings() {
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getBusinessProfiles().then(setProfiles).finally(() => setLoading(false))
    }, [])

    const handleUpdate = async (id: string, data: any) => {
        try {
            await updateBusinessProfile(id, data)
            toast.success('프로필이 업데이트되었습니다.')
            setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
        } catch (error) {
            toast.error('업데이트 실패')
        }
    }

    if (loading) return <div>프로필 정보를 불러오는 중...</div>

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
                <Card key={profile.id} className="shadow-sm">
                    <CardHeader className="pb-3 border-b mb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building className="h-5 w-5 text-blue-500" />
                                {OWNER_LABELS[profile.owner_type as OwnerType]} 프로필
                            </CardTitle>
                        </div>
                        <CardDescription>견적서 및 세무 처리에 사용되는 기본 정보</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-xs">상호명 / 이름</Label>
                            <Input
                                value={profile.business_name}
                                onChange={e => handleUpdate(profile.id, { business_name: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs">사업자 번호</Label>
                            <Input
                                value={profile.business_number || ''}
                                placeholder="예: 000-00-00000"
                                onChange={e => handleUpdate(profile.id, { business_number: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs">은행 및 계좌 (입금용)</Label>
                            <div className="flex gap-2">
                                <Input
                                    className="flex-1"
                                    value={profile.bank_name || ''}
                                    placeholder="은행"
                                    onChange={e => handleUpdate(profile.id, { bank_name: e.target.value })}
                                />
                                <Input
                                    className="flex-[2]"
                                    value={profile.account_number || ''}
                                    placeholder="계좌번호"
                                    onChange={e => handleUpdate(profile.id, { account_number: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold">견적서 내 포트폴리오</Label>
                                    <p className="text-[10px] text-muted-foreground">PDF 생성 시 포트폴리오 정보를 포함합니다.</p>
                                </div>
                                <Switch
                                    checked={profile.include_portfolio}
                                    onCheckedChange={val => handleUpdate(profile.id, { include_portfolio: val })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Globe className="h-3 w-3" /> 포트폴리오 URL
                                </div>
                                <Input
                                    className="h-8 text-xs"
                                    value={profile.portfolio_url || ''}
                                    placeholder="https://..."
                                    onChange={e => handleUpdate(profile.id, { portfolio_url: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
