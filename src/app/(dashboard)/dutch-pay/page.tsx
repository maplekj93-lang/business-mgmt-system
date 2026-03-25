'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@/shared/api/supabase/client';
import { 
    HandCoins, 
    Plus, 
    CheckCircle2, 
    Clock, 
    Users, 
    ArrowRight,
    Search,
    Filter,
    MoreHorizontal,
    UserPlus,
    Trash2,
    Calendar as CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/shared/ui/table';

interface DutchPayMember {
    id: string;
    name: string;
    amount_to_pay: number;
    is_paid: boolean;
    paid_at: string | null;
}

interface DutchPayGroup {
    id: string;
    name: string;
    total_amount: number;
    is_settled: boolean;
    created_at: string;
    due_date: string | null;
    transaction_id: string | null;
    members: DutchPayMember[];
}

export default function DutchPayPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<DutchPayGroup[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTxSelectorOpen, setIsTxSelectorOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    
    // New Group State
    const [newName, setNewName] = useState('');
    const [newTotalAmount, setNewTotalAmount] = useState<number>(0);
    const [newDueDate, setNewDueDate] = useState<string>('');
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [newMembers, setNewMembers] = useState<{name: string, amount: number}[]>([
        { name: '나', amount: 0 },
        { name: '아내', amount: 0 }
    ]);

    useEffect(() => {
        fetchDutchPayGroups();
        fetchRecentTransactions();
    }, []);

    const fetchRecentTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            setTransactions(data || []);
        } catch (error: any) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    const fetchDutchPayGroups = async () => {
        try {
            setLoading(true);
            const { data: groupsData, error: groupsError } = await supabase
                .from('dutch_pay_groups')
                .select('*')
                .order('created_at', { ascending: false });

            if (groupsError) throw groupsError;

            if (groupsData) {
                const groupsWithMembers = await Promise.all(groupsData.map(async (group: any) => {
                    const { data: membersData, error: membersError } = await supabase
                        .from('dutch_pay_members')
                        .select('*')
                        .eq('group_id', group.id);
                    
                    if (membersError) throw membersError;
                    return { ...group, members: membersData || [] };
                }));
                setGroups(groupsWithMembers);
            }
        } catch (error: any) {
            toast.error('정산 내역을 불러오는데 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newName || newTotalAmount <= 0) {
            toast.error('이름과 정확한 금액을 입력해주세요.');
            return;
        }

        try {
            const { data: group, error: groupError } = await supabase
                .from('dutch_pay_groups')
                .insert({
                    name: newName,
                    total_amount: newTotalAmount,
                    due_date: newDueDate || null,
                    transaction_id: selectedTxId,
                    owner_id: (await supabase.auth.getUser()).data.user?.id
                })
                .select()
                .single();

            if (groupError) throw groupError;

            const membersToInsert = newMembers.map((m: { name: string; amount: number }) => ({
                group_id: group.id,
                name: m.name,
                amount_to_pay: m.amount,
                is_paid: m.name === '나' // '나'는 정산 시작 시 이미 지불한 것으로 처리 ( payer )
            }));

            const { error: membersError } = await supabase
                .from('dutch_pay_members')
                .insert(membersToInsert);

            if (membersError) throw membersError;

            toast.success('정산이 생성되었습니다.');
            setIsCreateModalOpen(false);
            setNewName('');
            setNewTotalAmount(0);
            setNewDueDate('');
            setSelectedTxId(null);
            setNewMembers([
                { name: '나', amount: 0 },
                { name: '아내', amount: 0 }
            ]);
            fetchDutchPayGroups();
            
            // Log activity
            await supabase.from('activity_logs').insert({
                action_type: 'CREATE',
                entity_type: 'DUTCH_PAY',
                entity_id: group.id,
                new_data: { name: newName, amount: newTotalAmount }
            });

        } catch (error: any) {
            toast.error('정산 생성 실패: ' + error.message);
        }
    };

    const toggleMemberPaid = async (groupId: string, memberId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('dutch_pay_members')
                .update({ 
                    is_paid: !currentStatus,
                    paid_at: !currentStatus ? new Date().toISOString() : null
                })
                .eq('id', memberId);

            if (error) throw error;

            // Check if all members are paid to auto-settle the group
            const { data: members } = await supabase
                .from('dutch_pay_members')
                .select('is_paid')
                .eq('group_id', groupId);

            if (members?.every(m => m.is_paid)) {
                await supabase
                    .from('dutch_pay_groups')
                    .update({ is_settled: true })
                    .eq('id', groupId);
            } else {
                await supabase
                    .from('dutch_pay_groups')
                    .update({ is_settled: false })
                    .eq('id', groupId);
            }

            fetchDutchPayGroups();
        } catch (error: any) {
            toast.error('상태 변경 실패: ' + error.message);
        }
    };

    const autoSplit = () => {
        const splitAmount = Math.floor(newTotalAmount / newMembers.length);
        const remainder = newTotalAmount % newMembers.length;
        
        const updatedMembers = newMembers.map((m, i) => ({
            ...m,
            amount: i === 0 ? splitAmount + remainder : splitAmount
        }));
        setNewMembers(updatedMembers);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <HandCoins className="w-8 h-8 text-primary" />
                        정산 관리
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        공동 지출을 분할하고 정산 상태를 관리합니다.
                    </p>
                </div>
                
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold gap-2 shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4" />
                            새 정산 만들기
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>새 정산 생성</DialogTitle>
                            <DialogDescription>
                                지출 항목과 멤버별 분할 금액을 설정하세요.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">항목명</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="name" 
                                        placeholder="예: 주말 외식, 관리비 등" 
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Dialog open={isTxSelectorOpen} onOpenChange={setIsTxSelectorOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="shrink-0 gap-1 text-xs">
                                                <Search className="w-3 h-3" />
                                                내역 선택
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[400px]">
                                            <DialogHeader>
                                                <DialogTitle>거래 내역 선택</DialogTitle>
                                                <DialogDescription>정산할 지출 내역을 선택하세요.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 py-2">
                                                {transactions.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground text-sm">최근 내역이 없습니다.</div>
                                                ) : (
                                                    transactions.map((tx) => (
                                                        <Button
                                                            key={tx.id}
                                                            variant="ghost"
                                                            className="w-full justify-start text-left h-auto py-3 px-3 gap-3 hover:bg-muted"
                                                            onClick={() => {
                                                                setNewName(tx.description || tx.normalized_name || '지출');
                                                                setNewTotalAmount(tx.amount);
                                                                setSelectedTxId(tx.id);
                                                                setIsTxSelectorOpen(false);
                                                                toast.info('거래 내역이 불러와졌습니다.');
                                                            }}
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                                <ArrowRight className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-sm truncate">{tx.description || tx.normalized_name}</div>
                                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    {format(new Date(tx.date), 'MM월 dd일')} • {tx.source}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm font-black text-right shrink-0">
                                                                {tx.amount.toLocaleString()}원
                                                            </div>
                                                        </Button>
                                                    ))
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">총 금액</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="amount" 
                                        type="number" 
                                        placeholder="0"
                                        value={newTotalAmount}
                                        onChange={(e) => setNewTotalAmount(Number(e.target.value))}
                                    />
                                    <Button variant="outline" onClick={autoSplit} className="shrink-0">
                                        자동 분할
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="due_date">정산 예정일 (선택)</Label>
                                <Input 
                                    id="due_date" 
                                    type="date" 
                                    value={newDueDate}
                                    onChange={(e) => setNewDueDate(e.target.value)}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>멤버별 금액</Label>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-xs gap-1"
                                        onClick={() => setNewMembers([...newMembers, { name: '', amount: 0 }])}
                                    >
                                        <UserPlus className="w-3 h-3" />
                                        멤버 추가
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {newMembers.map((member, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <Input 
                                                className="flex-1" 
                                                placeholder="이름" 
                                                value={member.name}
                                                onChange={(e) => {
                                                    const updated = [...newMembers];
                                                    updated[index].name = e.target.value;
                                                    setNewMembers(updated);
                                                }}
                                            />
                                            <Input 
                                                className="w-32" 
                                                type="number" 
                                                placeholder="금액"
                                                value={member.amount}
                                                onChange={(e) => {
                                                    const updated = [...newMembers];
                                                    updated[index].amount = Number(e.target.value);
                                                    setNewMembers(updated);
                                                }}
                                            />
                                            {index > 1 && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 text-destructive"
                                                    onClick={() => {
                                                        const updated = newMembers.filter((_, i) => i !== index);
                                                        setNewMembers(updated);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-sm pt-1 border-t">
                                    <span>합계: {newMembers.reduce((sum, m) => sum + m.amount, 0).toLocaleString()}원</span>
                                    <span className={cn(
                                        newMembers.reduce((sum, m) => sum + m.amount, 0) === newTotalAmount 
                                            ? "text-green-500" 
                                            : "text-destructive"
                                    )}>
                                        {newMembers.reduce((sum, m) => sum + m.amount, 0) === newTotalAmount ? "일치" : "불일치"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>취소</Button>
                            <Button onClick={handleCreateGroup}>정산 시작하기</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Summary */}
                <Card className="tactile-panel overflow-hidden border-none bg-gradient-to-br from-primary/10 via-background to-background">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            진행 중인 정산
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{groups.filter((g: DutchPayGroup) => !g.is_settled).length}건</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            총 {groups.filter((g: DutchPayGroup) => !g.is_settled).reduce((sum: number, g: DutchPayGroup) => sum + g.total_amount, 0).toLocaleString()}원 대기 중
                        </p>
                    </CardContent>
                </Card>

                <Card className="tactile-panel overflow-hidden border-none bg-gradient-to-br from-green-500/10 via-background to-background">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            완료된 정산
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{groups.filter((g: DutchPayGroup) => g.is_settled).length}건</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            이번 달 총 {groups.filter((g: DutchPayGroup) => g.is_settled).length}건 해결됨
                        </p>
                    </CardContent>
                </Card>

                <Card className="tactile-panel overflow-hidden border-none bg-gradient-to-br from-orange-500/10 via-background to-background">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-500" />
                            미지급 멤버
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">
                            {groups.reduce((sum: number, g: DutchPayGroup) => sum + g.members.filter((m: DutchPayMember) => !m.is_paid).length, 0)}명
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            아직 입금을 기다리고 있는 인원
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 px-1">
                    정산 리스트
                </h2>
                
                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="animate-pulse h-40 tactile-panel" />
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <Card className="tactile-panel border-dashed border-2 bg-transparent">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <HandCoins className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                            <h3 className="text-lg font-bold">진행 중인 정산이 없습니다</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                                지출 내역을 불러오거나 새로운 정산을 직접 생성해보세요.
                            </p>
                            <Button variant="outline" className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
                                첫 정산 시작하기
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {groups.map((group) => (
                            <Card key={group.id} className={cn(
                                "tactile-panel overflow-hidden transition-all hover:shadow-xl group",
                                group.is_settled ? "opacity-75 grayscale-[0.5]" : ""
                            )}>
                                <CardHeader className="pb-3 border-b bg-muted/30">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg font-bold">{group.name}</CardTitle>
                                                {group.is_settled ? (
                                                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">완료됨</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">진행 중</Badge>
                                                )}
                                            </div>
                                            <CardDescription className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    {format(new Date(group.created_at), 'yyyy년 MM월 dd일', { locale: ko })}
                                                </span>
                                                {group.due_date && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span className={cn(
                                                            "flex items-center gap-1",
                                                            !group.is_settled && new Date(group.due_date) < new Date() ? "text-destructive font-bold" : "text-muted-foreground"
                                                        )}>
                                                            마감: {format(new Date(group.due_date), 'MM월 dd일', { locale: ko })}
                                                        </span>
                                                    </>
                                                )}
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span className="font-bold text-foreground">
                                                    {group.total_amount.toLocaleString()}원
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {group.members.map((member) => (
                                            <div 
                                                key={member.id} 
                                                className={cn(
                                                    "p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2",
                                                    member.is_paid 
                                                        ? "bg-green-500/5 border-green-500/20" 
                                                        : "bg-muted/50 border-border hover:border-primary/30"
                                                )}
                                                onClick={() => toggleMemberPaid(group.id, member.id, member.is_paid)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold">{member.name}</span>
                                                    {member.is_paid ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="text-lg font-black leading-none">
                                                    {member.amount_to_pay.toLocaleString()}원
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {member.is_paid 
                                                        ? `${format(new Date(member.paid_at || ''), 'MM/dd HH:mm')} 지불` 
                                                        : '지불 대기 중'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/10 border-t py-3 px-6 flex justify-between items-center text-xs">
                                    <div className="flex gap-4">
                                        <span>정산 완료 인원: <span className="font-bold">{group.members.filter((m: DutchPayMember) => m.is_paid).length}</span>/{group.members.length}</span>
                                        <span>남은 금액: <span className="font-bold text-primary">{group.members.filter((m: DutchPayMember) => !m.is_paid).reduce((sum: number, m: DutchPayMember) => sum + m.amount_to_pay, 0).toLocaleString()}</span>원</span>
                                    </div>
                                    {!group.is_settled && (
                                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 hover:text-primary">
                                            상세 보기
                                            <ArrowRight className="w-3 h-3" />
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
