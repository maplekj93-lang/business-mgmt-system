'use client'

import { useState } from 'react'
import { DailyRateTable } from '@/features/manage-daily-rate/ui/DailyRateTable'
import { LogDailyRateModal } from '@/features/log-daily-rate/ui/LogDailyRateModal'
import { Button } from '@/shared/ui/button'
import { Plus, Calendar } from 'lucide-react'
import { DailyRateLog } from '@/entities/daily-rate/model/types'

export default function DailyRatesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedLog, setSelectedLog] = useState<DailyRateLog | undefined>(undefined)
    const [refreshKey, setRefreshKey] = useState(0)

    function handleCreate() {
        setSelectedLog(undefined)
        setIsModalOpen(true)
    }

    function handleEdit(log: DailyRateLog) {
        setSelectedLog(log)
        setIsModalOpen(true)
    }

    function handleSuccess() {
        setIsModalOpen(false)
        setRefreshKey(prev => prev + 1)
    }

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">일당/현장 관리</h1>
                        <p className="text-muted-foreground">
                            현장별 일당 기록과 크루 인건비, 진행비를 통합 관리하세요.
                        </p>
                    </div>
                </div>
                <Button 
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <Plus className="h-5 w-5 mr-2" /> 새 기록 추가
                </Button>
            </div>

            <DailyRateTable 
                refreshKey={refreshKey} 
                onRowClick={handleEdit} 
            />

            <LogDailyRateModal 
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                initialData={selectedLog}
            />
        </div>
    )
}
