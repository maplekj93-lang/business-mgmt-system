"use client"

import { useState, useEffect, useCallback } from 'react'
import { Plus, Building2, Search, ExternalLink, MoreVertical, Trash2, Mail, Phone, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/shared/ui/dropdown-menu'
import { CreateClientDialog } from '@/entities/client/ui/CreateClientDialog'
import { getClientsWithStats } from '@/entities/client/api/get-clients-with-stats'
import type { Client } from '@/entities/client/model/types'
import { cn } from '@/shared/lib/utils'

export function ClientListWidget() {
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    const loadClients = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getClientsWithStats()
            setClients(data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadClients()
    }, [loadClients])

    const filteredClients = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.business_number?.includes(searchTerm)
    )

    return (
        <Card className="rounded-[2rem] bg-background border-border/40 overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b px-8 pt-8">
                <div>
                    <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Client Directory</CardTitle>
                    <CardDescription className="text-slate-500 font-bold italic mt-1 uppercase text-[10px] tracking-widest">
                        Manage your business relationships and track revenue per client
                    </CardDescription>
                </div>
                <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-primary hover:bg-blue-700 rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-6 bg-slate-50/30 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search by name or business number..." 
                            className="pl-10 h-11 bg-white border-slate-200 rounded-xl text-sm focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Stats</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={4} className="px-8 py-6">
                                            <div className="h-10 bg-slate-100 rounded-lg animate-pulse w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400">
                                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                        <p className="text-sm font-medium">No clients found matching your search.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm uppercase">
                                                    {client.name.substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {client.name}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-medium">#{client.business_number || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Projects</span>
                                                    <span className="text-sm font-bold text-slate-700">{client.project_count || 0}</span>
                                                </div>
                                                <div className="flex flex-col border-l pl-4 border-slate-100">
                                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Last Active</span>
                                                    <span className="text-sm font-bold text-slate-700">{client.last_project_at || 'Never'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-sm font-black text-slate-900">
                                                    ₩{(client.total_revenue || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-200/50">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5 shadow-xl border-slate-100">
                                                    <DropdownMenuItem className="rounded-lg text-xs font-bold gap-2 focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                                                        <ExternalLink className="h-3.5 w-3.5" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-lg text-xs font-bold gap-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            <CreateClientDialog 
                open={isCreateDialogOpen} 
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={loadClients}
            />
        </Card>
    )
}
