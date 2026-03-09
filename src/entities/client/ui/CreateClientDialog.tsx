"use client"
import * as React from "react"
import { Plus, Loader2, User, Phone, Mail, Building, Briefcase } from "lucide-react"
import { Button } from "@/shared/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "sonner"
import { upsertClient } from "../api/upsert-client"
import type { Client, Contact } from "../model/types"

interface CreateClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (client: Client) => void
    initialName?: string
}

export function CreateClientDialog({
    open,
    onOpenChange,
    onSuccess,
    initialName = ""
}: CreateClientDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [name, setName] = React.useState(initialName)
    const [businessNumber, setBusinessNumber] = React.useState("")

    // 주 연락처 정보
    const [contactName, setContactName] = React.useState("")
    const [contactRole, setContactRole] = React.useState("")
    const [contactPhone, setContactPhone] = React.useState("")
    const [contactEmail, setContactEmail] = React.useState("")

    React.useEffect(() => {
        if (open) {
            setName(initialName)
        }
    }, [open, initialName])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error("거래처명을 입력해주세요.")
            return
        }

        setIsLoading(true)
        try {
            const contacts: Contact[] = []
            if (contactName.trim()) {
                contacts.push({
                    name: contactName.trim(),
                    role: contactRole.trim() || undefined,
                    phone: contactPhone.trim() || undefined,
                    email: contactEmail.trim() || undefined
                })
            }

            const newClient = await upsertClient({
                name: name.trim(),
                business_number: businessNumber.trim() || undefined,
                contacts: contacts,
                files: []
            })

            toast.success(`'${name}' 거래처가 생성되었습니다.`)
            onSuccess(newClient as unknown as Client)
            handleClose()
        } catch (error) {
            console.error(error)
            toast.error("거래처 생성에 실패했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        onOpenChange(false)
        if (!isLoading) {
            setName("")
            setBusinessNumber("")
            setContactName("")
            setContactRole("")
            setContactPhone("")
            setContactEmail("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-blue-500" /> 신규 거래처 추가
                        </DialogTitle>
                        <DialogDescription>
                            새로운 거래처 정보를 입력하여 즉시 생성합니다.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* 기본 정보 세션 */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                                <Building className="h-3.5 w-3.5" /> 기본 정보
                            </h4>
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-xs">거래처명 *</Label>
                                <Input
                                    id="name"
                                    placeholder="예: (주)현대자동차"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="businessNumber" className="text-xs">사업자 등록번호</Label>
                                <Input
                                    id="businessNumber"
                                    placeholder="000-00-00000"
                                    value={businessNumber}
                                    onChange={(e) => setBusinessNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 연락처 세션 */}
                        <div className="space-y-3 border-t pt-3 mt-1">
                            <h4 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                                <User className="h-3.5 w-3.5" /> 주 연락처 (담당자)
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="contactName" className="text-xs">담당자명</Label>
                                    <Input
                                        id="contactName"
                                        placeholder="홍길동"
                                        value={contactName}
                                        onChange={(e) => setContactName(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contactRole" className="text-xs">직함</Label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            id="contactRole"
                                            className="pl-8"
                                            placeholder="과장"
                                            value={contactRole}
                                            onChange={(e) => setContactRole(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contactPhone" className="text-xs">연락처</Label>
                                <div className="relative">
                                    <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        id="contactPhone"
                                        className="pl-8"
                                        placeholder="010-0000-0000"
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contactEmail" className="text-xs">이메일</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        id="contactEmail"
                                        type="email"
                                        className="pl-8"
                                        placeholder="example@email.com"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
                            취소
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading || !name.trim()}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    생성 중...
                                </>
                            ) : (
                                "거래처 생성"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
