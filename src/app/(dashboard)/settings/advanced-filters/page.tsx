'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/shared/api/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Plus, Trash2, Search, Settings2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FixedExpenseRule {
  id: string;
  name: string;
  amount: number;
  day_of_month: number;
  tolerance_days: number;
  category_id: number | null;
  owner_type: 'personal' | 'business';
  is_active: boolean;
  mdt_categories: {
    name: string;
  } | null;
}

interface Category {
  id: number;
  name: string;
  type: string | null;
}

export default function AdvancedFiltersPage() {
  const [rules, setRules] = useState<FixedExpenseRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 신규 규칙 State
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDayOfMonth, setNewDayOfMonth] = useState('1');
  const [newToleranceDays, setNewToleranceDays] = useState('2');
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [newOwnerType, setNewOwnerType] = useState<'personal' | 'business'>('personal');

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 룰 조회
      const { data: rulesData } = await supabase
        .from('fixed_expense_rules')
        .select('*, mdt_categories(name)')
        .order('created_at', { ascending: false });

      // 카테고리 조회
      const { data: catsData } = await supabase
        .from('mdt_categories')
        .select('id, name, type')
        .order('name');

      if (rulesData) {
        setRules(rulesData.map(r => ({
          ...r,
          category_id: r.category_id as number | null,
          owner_type: r.owner_type as 'personal' | 'business',
          mdt_categories: r.mdt_categories as { name: string } | null
        })));
      }
      if (catsData) {
        setCategories(catsData.map(c => ({
          ...c,
          type: c.type as string | null
        })));
      }
    } catch (error) {
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRule = async () => {
    if (!newName || !newAmount || !newCategoryId) {
      toast.error('필수 정보를 모두 입력해주세요.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('fixed_expense_rules').insert({
      name: newName,
      amount: parseFloat(newAmount),
      day_of_month: parseInt(newDayOfMonth),
      tolerance_days: parseInt(newToleranceDays),
      category_id: parseInt(newCategoryId),
      owner_type: newOwnerType,
      user_id: user.id
    });

    if (error) {
      toast.error('규칙 추가 실패: ' + error.message);
    } else {
      toast.success('고정지출 규칙이 추가되었습니다.');
      setNewName('');
      setNewAmount('');
      setNewCategoryId('');
      fetchData();
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('이 규칙을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('fixed_expense_rules').delete().eq('id', id);

    if (error) {
      toast.error('삭제 실패');
    } else {
      toast.success('규칙이 삭제되었습니다.');
      fetchData();
    }
  };

  const filteredRules = rules.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.mdt_categories?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">고급 필터링 (고정지출 설정)</h1>
        <p className="text-muted-foreground italic">금액과 날짜 오차범위를 설정하여 정기적인 고정지출을 자동으로 분류합니다.</p>
      </div>

      {/* 룰 추가 카드 */}
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-400">
            <Plus className="w-4 h-4" /> 새 고정지출 규칙 등록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-xs font-medium opacity-70">규칙 이름 (e.g. 월세, 보험료)</label>
              <Input 
                placeholder="규칙 이름" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium opacity-70">금액 (절대값)</label>
              <Input 
                type="number"
                placeholder="금액" 
                value={newAmount} 
                onChange={e => setNewAmount(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium opacity-70">카테고리</label>
              <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name} ({c.type === 'income' ? '수입' : '지출'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-[120px] space-y-2">
              <label className="text-xs font-medium opacity-70">매월 결제일</label>
              <Input 
                type="number"
                min="1"
                max="31"
                value={newDayOfMonth} 
                onChange={e => setNewDayOfMonth(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="w-[120px] space-y-2">
              <label className="text-xs font-medium opacity-70">날짜 오차 (±N일)</label>
              <Input 
                type="number"
                min="0"
                max="10"
                value={newToleranceDays} 
                onChange={e => setNewToleranceDays(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="w-[150px] space-y-2">
              <label className="text-xs font-medium opacity-70">소유 구분</label>
              <Select value={newOwnerType} onValueChange={(val: any) => setNewOwnerType(val)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">개인 (Personal)</SelectItem>
                  <SelectItem value="business">사업 (Business)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddRule} className="bg-indigo-600 hover:bg-indigo-700 ml-auto">규칙 추가</Button>
          </div>
        </CardContent>
      </Card>

      {/* 룰 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 h-16">
          <CardTitle className="text-lg">등록된 고정지출 규칙 ({filteredRules.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="검색어 입력..."
              className="pl-9 h-9 bg-muted/30 border-0"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>규칙명</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>매칭 조건</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>구분</TableHead>
                <TableHead className="w-[80px] text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center opacity-50">로딩 중...</TableCell></TableRow>
              ) : filteredRules.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center opacity-50 text-sm">등록된 규칙이 없습니다.</TableCell></TableRow>
              ) : filteredRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-bold">{rule.name}</TableCell>
                  <TableCell className="font-mono">{rule.amount.toLocaleString()}원</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100">
                      매월 {rule.day_of_month}일 (±{rule.tolerance_days}일)
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.mdt_categories?.name}</TableCell>
                  <TableCell>
                    <Badge className={rule.owner_type === 'business' ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}>
                      {rule.owner_type === 'business' ? '사업' : '개인'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 안내 도움말 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-bold text-amber-700">고정지출 필터링 원리</p>
            <p className="text-muted-foreground leading-relaxed">
              설정된 <b>금액이 일치</b>하고, 매월 지정하신 <b>날짜의 ±N일 이내</b>에 발생한 거래를 자동으로 분류합니다. 통신비, 월세, 구독료 등에 효과적입니다.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-bold text-indigo-700">키워드 매칭 우선</p>
            <p className="text-muted-foreground leading-relaxed">
              일반적인 키워드 기반 태깅 규칙으로 분류되지 않은 거래에 대해 2차적으로 고정지출 규칙을 적용합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
