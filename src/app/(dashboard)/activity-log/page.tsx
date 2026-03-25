'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/shared/api/supabase/client'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { format } from 'date-fns'
import { History, User, Database, Info } from 'lucide-react'

interface ActivityLog {
  id: string
  created_at: string
  action_type: string
  entity_type: string
  entity_id: string
  new_data: any
  previous_data: any
  user_id: string | null
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error
        // @ts-ignore - Supabase types might be slightly off in the client instantiation here
        setLogs(data || [])
      } catch (err) {
        console.error('Failed to fetch activity logs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [supabase])

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black">CREATE</Badge>
      case 'update': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-black">UPDATE</Badge>
      case 'delete': return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-black">DELETE</Badge>
      case 'import': return <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[10px] font-black">IMPORT</Badge>
      default: return <Badge variant="outline" className="text-[10px] font-black">{action.toUpperCase()}</Badge>
    }
  }

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'transaction': return <Database className="w-3.5 h-3.5" />
      case 'recurring_expense': return <History className="w-3.5 h-3.5" />
      case 'dutch_pay_group': return <Info className="w-3.5 h-3.5" /> // Added Dutch Pay icon
      default: return <Info className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground">활동 로그</h1>
        <p className="text-sm text-muted-foreground font-medium">가계부에서 발생한 모든 변경 내역과 작업을 추적합니다.</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="tactile-panel p-12 text-center text-muted-foreground">로그를 불러오는 중...</div>
        ) : logs.length === 0 ? (
          <div className="tactile-panel p-12 text-center text-muted-foreground">기록된 활동이 없습니다.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="tactile-panel p-4 flex items-center gap-4 bg-white/50 border-border/50 hover:bg-white transition-colors">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.03] border border-border/30 flex items-center justify-center shrink-0">
                {getEntityIcon(log.entity_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-black text-foreground uppercase tracking-tight">{log.entity_type.replace(/_/g, ' ')} {log.action_type}</span>
                  {getActionBadge(log.action_type)}
                </div>
                <p className="text-sm font-medium text-foreground truncate">
                  {log.new_data?.name || log.new_data?.description || log.new_data?.title || `${log.entity_type} #${log.entity_id?.slice(0, 8)}`}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {log.user_id ? 'Authenticated User' : 'System'}</span>
                  <span>•</span>
                  <span>{log.created_at ? format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}</span>
                </div>
              </div>

              <div className="hidden md:block">
                <Badge variant="outline" className="text-[10px] font-bold border-border/50 text-muted-foreground">
                   #{log.id.slice(0, 6)}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
