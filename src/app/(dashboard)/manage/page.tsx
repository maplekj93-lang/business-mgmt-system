'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Building2, Plus, Users, Mail, Phone, Briefcase } from 'lucide-react'
import { getClients } from '@/entities/client/api/get-clients'
import { CreateClientDialog } from '@/entities/client/ui/CreateClientDialog'
import type { Client } from '@/entities/client/model/types'
import { Badge } from '@/shared/ui/badge'

export default function ClientManagementPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        setLoading(true)
        try {
            const data = await getClients()
            setClients(data)
        } catch (error) {
            console.error('Failed to load clients:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSuccess = (newClient: Client) => {
        setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)))
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-background/50 p-6 rounded-2xl border-none [box-shadow:var(--tactile-shadow-sm)]">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-primary" /> 거래처 관리
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        모든 거래처와 담당자 연락처를 한 곳에서 관리하세요.
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shadow-sm rounded-xl h-11 px-5">
                    <Plus className="w-4 h-4" /> 신규 거래처 추가
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse h-48 bg-muted/40" />
                    ))}
                </div>
            ) : clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center bg-background/50 rounded-2xl border-2 border-dashed border-muted text-muted-foreground">
                    <Building2 className="w-12 h-12 mb-4 text-slate-300" />
                    <p>등록된 거래처가 없습니다.</p>
                    <p className="text-sm mt-1">우측 상단의 버튼을 눌러 첫 거래처를 등록해보세요.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map(client => (
                        <Card key={client.id} className="transition-all hover:[box-shadow:var(--tactile-shadow-sm)] hover:border-primary/20 group">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex justify-between items-start">
                                    <span className="text-lg font-bold group-hover:text-primary transition-colors">{client.name}</span>
                                    {client.business_number && (
                                        <Badge variant="outline" className="text-[10px] text-slate-500 font-mono">
                                            {client.business_number}
                                        </Badge>
                                    )}
                                </CardTitle>
                                {client.project_count !== undefined && (
                                    <CardDescription className="text-xs font-semibold text-slate-400">
                                        진행 프로젝트: {client.project_count}건
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                {client.contacts && client.contacts.length > 0 ? (
                                    <div className="space-y-3">
                                        {client.contacts.map((contact, idx) => (
                                            <div key={idx} className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-700">{contact.name}</span>
                                                    {contact.role && (
                                                        <Badge variant="secondary" className="text-[10px] bg-slate-200/50 text-slate-600 px-1.5 py-0">
                                                            {contact.role}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {(contact.phone || contact.email) && (
                                                    <div className="space-y-1 mt-2 text-xs text-slate-600 pl-5 border-l-2 border-slate-200">
                                                        {contact.phone && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone className="w-3 h-3 text-slate-400" /> {contact.phone}
                                                            </div>
                                                        )}
                                                        {contact.email && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Mail className="w-3 h-3 text-slate-400" /> {contact.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400 italic flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" /> 등록된 담당자 연락처가 없습니다.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CreateClientDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
