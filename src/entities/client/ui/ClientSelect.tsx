"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/shared/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui/popover"
import { Input } from "@/shared/ui/input"
import { getClients, type Client, upsertClient } from "../index"
import { Plus, Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { CreateClientDialog } from "./CreateClientDialog"

interface ClientSelectProps {
    value?: string
    onValueChange: (value: string) => void
}

export function ClientSelect({ value, onValueChange }: ClientSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [clients, setClients] = React.useState<Client[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")

    const fetchClients = React.useCallback(async () => {
        setLoading(true)
        try {
            const data = await getClients()
            setClients(data)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchClients()
    }, [fetchClients])

    const handleCreateSuccess = (newClient: Client) => {
        setClients(prev => [newClient, ...prev])
        onValueChange(newClient.id)
        setOpen(false)
        setSearch("")
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={loading}
                    >
                        {loading
                            ? "불러오는 중..."
                            : value
                                ? clients.find((client) => client.id === value)?.name
                                : "거래처를 선택하세요"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command className="border-0">
                        <CommandInput
                            placeholder="거래처 검색..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty className="py-6 text-center text-sm">
                                <p className="text-slate-500 mb-4">검색 결과가 없습니다.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-dashed"
                                    onClick={() => setDialogOpen(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    '{search}' 신규 추가하기
                                </Button>
                            </CommandEmpty>
                            <CommandGroup heading="거래처 목록">
                                {clients.map((client) => (
                                    <CommandItem
                                        key={client.id}
                                        value={client.name}
                                        onSelect={() => {
                                            onValueChange(client.id)
                                            setOpen(false)
                                        }}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4 text-blue-600",
                                                    value === client.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="font-medium text-slate-700">{client.name}</span>
                                        </div>
                                        {client.business_number && (
                                            <span className="text-[10px] text-slate-400 font-mono">{client.business_number}</span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>

                        {/* 하단 고정 버튼 */}
                        <div className="p-1 border-t bg-slate-50/50">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold"
                                onClick={() => {
                                    setDialogOpen(true)
                                }}
                            >
                                <UserPlus className="h-4 w-4" />
                                <span>새로운 거래처 직접 추가</span>
                            </Button>
                        </div>
                    </Command>
                </PopoverContent>
            </Popover>

            <CreateClientDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={handleCreateSuccess}
                initialName={search}
            />
        </>
    )
}
