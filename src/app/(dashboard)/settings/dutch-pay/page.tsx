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
    MoreHorizontal,
    UserPlus,
    Trash2,
    Calendar as CalendarIcon,
    SplitSquareHorizontal
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

export default function DutchPaySettingsPage() {
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
            const { data: userData } = await supabase.auth.getUser();
            const { data: group, error: groupError } = await supabase
                .from('dutch_pay_groups')
                .insert({
                    name: newName,
                    total_amount: newTotalAmount,
                    due_date: newDueDate || null,
                    transaction_id: selectedTxId,
                    owner_id: userData.user?.id
                })
                .select()
                .single();

            if (groupError) throw groupError;

            const membersToInsert = newMembers.map((m: { name: string; amount: number }) => ({
                group_id: group.id,
                name: m.name,
                amount_to_pay: m.amount,
                is_paid: m.name === '나'
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

    const handleDeleteGroup = async (id: string) => {
        if (!confirm('이 정산 내역을 삭제하시겠습니까? 연결된 멤버 정보도 모두 삭제됩니다.')) return;

        try {
            const { error } = await supabase
                .from('dutch_pay_groups')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('정산 내역이 삭제되었습니다.');
            fetchDutchPayGroups();
        } catch (error: any) {
            toast.error('삭제 실패: ' + error.message);
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
        <div className="pb-20">
            <main className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent flex items-center gap-3">
                            <SplitSquareHorizontal className="w-8 h-8 text-primary" />
                            더치페이 정산 관리
                        </h2>
                        <p className="text-muted-foreground">
                            공동 지출을 멤버들과 분할하고 입금 여부를 추적하세요.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-full shadow-lg shadow-primary/20">
                                    <Plus className="w-4 h-4 mr-2" />
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
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>취소</Button>
                                    <Button onClick={handleCreateGroup}>정산 시작</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="tactile-panel bg-white/5 border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                진행 중인 정산
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">{groups.filter((g) => !g.is_settled).length}건</div>
                        </CardContent>
                    </Card>

                    <Card className="tactile-panel bg-white/5 border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                완료된 정산
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">{groups.filter((g) => g.is_settled).length}건</div>
                        </CardContent>
                    </Card>

                    <Card className="tactile-panel bg-white/5 border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Users className="w-4 h-4 text-orange-500" />
                                미지급 멤버
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">
                                {groups.reduce((sum, g) => sum + g.members.filter((m) => !m.is_paid).length, 0)}명
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">목록을 불러오는 중입니다...</div>
                    ) : groups.length === 0 ? (
                        <Card className="tactile-panel border-dashed bg-transparent p-12 text-center">
                            <HandCoins className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">진행 중인 정산 내역이 없습니다.</p>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {groups.map((group) => (
                                <Card key={group.id} className={cn(
                                    "tactile-panel overflow-hidden transition-all",
                                    group.is_settled && "opacity-60"
                                )}>
                                    <CardHeader className="pb-3 border-b bg-white/5">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <CardTitle className="text-lg font-bold">{group.name}</CardTitle>
                                                {group.is_settled ? (
                                                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20">완료</Badge>
                                                ) : (
                                                    <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/10 border-orange-500/20">진행 중</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold">{group.total_amount.toLocaleString()}원</span>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteGroup(group.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <CalendarIcon className="w-3 h-3" />
                                            {format(new Date(group.created_at), 'yyyy년 MM월 dd일', { locale: ko })}
                                            {group.due_date && ` • 마감: ${format(new Date(group.due_date), 'MM월 dd일', { locale: ko })}`}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {group.members.map((member) => (
                                                <div 
                                                    key={member.id} 
                                                    className={cn(
                                                        "p-4 rounded-xl border transition-all cursor-pointer",
                                                        member.is_paid 
                                                            ? "bg-green-500/5 border-green-500/20" 
                                                            : "bg-white/5 border-white/10 hover:border-primary/30"
                                                    )}
                                                    onClick={() => toggleMemberPaid(group.id, member.id, member.is_paid)}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-sm">{member.name}</span>
                                                        {member.is_paid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                                                    </div>
                                                    <div className="text-lg font-black">{member.amount_to_pay.toLocaleString()}원</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
