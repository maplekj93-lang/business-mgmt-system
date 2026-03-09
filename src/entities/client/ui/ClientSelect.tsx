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
import { getClients, type Client } from "../index"

interface ClientSelectProps {
    value?: string
    onValueChange: (value: string) => void
}

export function ClientSelect({ value, onValueChange }: ClientSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [clients, setClients] = React.useState<Client[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        getClients()
            .then(setClients)
            .finally(() => setLoading(false))
    }, [])

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
                    <CommandInput placeholder="거래처 검색..." />
                    <CommandList>
                        <CommandEmpty>거래처가 없습니다.</CommandEmpty>
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
