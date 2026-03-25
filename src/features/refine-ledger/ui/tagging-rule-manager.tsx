'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/shared/api/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Plus, Trash2, Search, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AllocationRule {
  id: number;
  keyword: string;
  category_id: number;
  match_type: 'exact' | 'contains';
  priority: number;
  is_business: boolean;
  business_tag: string | null;
  mdt_categories: {
    name: string;
  } | null;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

export function TaggingRuleManager() {
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 신규 규칙 State
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [newMatchType, setNewMatchType] = useState<'exact' | 'contains'>('contains');
  const [newIsBusiness, setNewIsBusiness] = useState(false);

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 룰 조회 (MD 헌법 준수: priority 순)
      const { data: rulesData } = await supabase
        .from('mdt_allocation_rules')
        .select('*, mdt_categories(name)')
        .order('priority', { ascending: true });

      // 카테고리 조회
      const { data: catsData } = await supabase
        .from('mdt_categories')
        .select('id, name, type')
        .order('name');

      if (rulesData) {
        setRules(rulesData
          .filter(r => r.category_id !== null)
          .map(r => ({
            ...r,
            category_id: r.category_id as number,
            match_type: r.match_type as 'exact' | 'contains',
            priority: r.priority ?? 10,
            is_business: !!r.is_business,
            mdt_categories: r.mdt_categories as { name: string } | null
          })));
      }
      if (catsData) {
        setCategories(catsData.map(c => ({
          ...c,
          type: c.type || 'expense' // Default or non-null
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
    if (!newKeyword || !newCategoryId) {
      toast.error('키워드와 카테고리를 입력해주세요.');
      return;
    }

    const { error } = await supabase.from('mdt_allocation_rules').insert({
      keyword: newKeyword,
      category_id: parseInt(newCategoryId),
      match_type: newMatchType,
      is_business: newIsBusiness,
      priority: newMatchType === 'exact' ? 1 : 10, // Exact Match 우선
      user_id: (await supabase.auth.getUser()).data.user?.id
    });

    if (error) {
      toast.error('규칙 추가 실패: ' + error.message);
    } else {
      toast.success('새로운 규칙이 추가되었습니다.');
      setNewKeyword('');
      setNewCategoryId('');
      fetchData();
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('이 규칙을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('mdt_allocation_rules').delete().eq('id', id);

    if (error) {
      toast.error('삭제 실패');
    } else {
      toast.success('규칙이 삭제되었습니다.');
      fetchData();
    }
  };

  const filteredRules = rules.filter(r => 
    r.keyword.toLowerCase().includes(search.toLowerCase()) ||
    r.mdt_categories?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 룰 추가 카드 */}
      <Card className="border-indigo-500/20 bg-indigo-500/5 shadow-none border-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-400">
            <Plus className="w-4 h-4" /> 새 규칙 등록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-xs font-medium opacity-70 text-foreground/70">키워드 (Keyword)</label>
              <Input 
                placeholder="가맹점명 또는 키워드" 
                value={newKeyword} 
                onChange={e => setNewKeyword(e.target.value)}
                className="bg-background/50 border-indigo-500/10"
              />
            </div>
            <div className="w-[180px] space-y-2">
              <label className="text-xs font-medium opacity-70 text-foreground/70">분류 (Category)</label>
              <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                <SelectTrigger className="bg-background/50 border-indigo-500/10">
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
            <div className="w-[120px] space-y-2">
              <label className="text-xs font-medium opacity-70 text-foreground/70">매칭 방식</label>
              <Select value={newMatchType} onValueChange={(val: any) => setNewMatchType(val)}>
                <SelectTrigger className="bg-background/50 border-indigo-500/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">정확히 일치</SelectItem>
                  <SelectItem value="contains">포함</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                id="isBusiness" 
                checked={newIsBusiness} 
                onChange={e => setNewIsBusiness(e.target.checked)}
                className="w-4 h-4 accent-indigo-500"
              />
              <label htmlFor="isBusiness" className="text-sm font-medium cursor-pointer text-foreground/80">사업비 자동 지정</label>
            </div>
            <Button onClick={handleAddRule} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">추가</Button>
          </div>
        </CardContent>
      </Card>

      {/* 룰 목록 */}
      <Card className="shadow-none border-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2 h-16">
          <CardTitle className="text-lg">등록된 규칙 ({filteredRules.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="검색어 입력..."
              className="pl-9 h-9 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500/30"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-none">
                <TableHead className="w-[60px] text-center">우선순위</TableHead>
                <TableHead>키워드</TableHead>
                <TableHead>매칭</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>속성</TableHead>
                <TableHead className="w-[80px] text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-none"><TableCell colSpan={6} className="h-32 text-center opacity-50">로딩 중...</TableCell></TableRow>
              ) : filteredRules.length === 0 ? (
                <TableRow className="border-none"><TableCell colSpan={6} className="h-32 text-center opacity-50 text-sm">등록된 규칙이 없습니다.</TableCell></TableRow>
              ) : filteredRules.map((rule) => (
                <TableRow key={rule.id} className="border-indigo-500/5">
                  <TableCell className="text-center border-none">
                    <Badge variant="outline" className="font-mono text-[10px] opacity-60 border-indigo-500/20">P{rule.priority}</Badge>
                  </TableCell>
                  <TableCell className="font-medium border-none">{rule.keyword}</TableCell>
                  <TableCell className="border-none">
                    <Badge variant="secondary" className={rule.match_type === 'exact' ? "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none font-normal" : "bg-slate-100 dark:bg-slate-800 shadow-none font-normal"}>
                      {rule.match_type === 'exact' ? '정확히 일치' : '포함'}
                    </Badge>
                  </TableCell>
                  <TableCell className="border-none">{rule.mdt_categories?.name}</TableCell>
                  <TableCell className="border-none">
                    {rule.is_business && (
                      <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 shadow-none font-normal">사업비</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right border-none">
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
            <p className="font-bold text-amber-700 dark:text-amber-500">매칭 우선순위 안내</p>
            <p className="text-muted-foreground leading-relaxed">
              1. <b>정확히 일치(Exact)</b> 규칙이 가장 먼저 적용됩니다.<br />
              2. 그 다음 <b>포함(Contains)</b> 규칙이 우선순위(Priority) 숫자가 낮은 순서대로 적용됩니다.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-bold text-indigo-700 dark:text-indigo-400">자동 사업비 태깅</p>
            <p className="text-muted-foreground leading-relaxed">
              '사업비 자동 지정'이 활성화된 규칙은 매칭 시 자동으로 개인 지출 통계에서 <b>제외(Double-Count Prevention)</b> 처리됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
