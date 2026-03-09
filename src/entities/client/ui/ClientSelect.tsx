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
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ClientSelectProps {
    value?: string
    onValueChange: (value: string) => void
}

export function ClientSelect({ value, onValueChange }: ClientSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [clients, setClients] = React.useState<Client[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [isCreating, setIsCreating] = React.useState(false)

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

    const handleCreateClient = async (name: string) => {
        if (!name.trim()) return
        setIsCreating(true)
        try {
            const newClient = await upsertClient({ name: name.trim() })
            setClients(prev => [newClient as unknown as Client, ...prev])
            onValueChange((newClient as any).id)
            setOpen(false)
            setSearch("")
            toast.success(`'${name}' 거래처가 생성되었습니다.`)
        } catch (error) {
            toast.error("거래처 생성에 실패했습니다.")
        } finally {
            setIsCreating(false)
        }
    }

    return (
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
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput
                        placeholder="거래처 검색..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty className="p-2">
                            <div className="text-sm text-muted-foreground mb-3 px-2">거래처가 없습니다.</div>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start gap-2 h-9"
                                onClick={() => handleCreateClient(search)}
                                disabled={isCreating || !search.trim()}
                            >
                                {isCreating ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Plus className="h-3.5 w-3.5 text-blue-500" />
                                )}
                                <span className="font-bold text-xs">'<span className="text-blue-600">{search}</span>' 신규 추가</span>
                            </Button>
                        </CommandEmpty>
                        <CommandGroup>
                            {clients.map((client) => (
                                <CommandItem
                                    key={client.id}
                                    value={client.name}
                                    onSelect={() => {
                                        onValueChange(client.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === client.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {client.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
