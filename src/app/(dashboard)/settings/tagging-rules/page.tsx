import React from 'react';
import { createClient } from '@/shared/api/supabase/server';
import { Badge } from '@/shared/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

export default async function TaggingRulesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch Rules
  const { data: rules } = await supabase
    .from('mdt_allocation_rules')
    .select(`
      id,
      keyword,
      match_type,
      priority,
      category_id,
      is_business,
      business_tag,
      created_at,
      mdt_categories ( name )
    `)
    .eq('user_id', user.id)
    .order('priority', { ascending: true })
    .order('id', { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🤖 스마트 태깅 룰 (Smart Tagging Rules)
        </h2>
        <p className="text-muted-foreground mt-1">
          미분류 내역의 카테고리와 사업비 여부를 자동으로 분류하는 규칙을 관리합니다.
        </p>
      </div>

      <div className="tactile-panel p-4 rounded-xl border">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">등록된 규칙 ({rules?.length || 0}건)</h3>
          {/* TODO: Add 'Add Rule' Modal Component here if needed */}
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>우선순위</TableHead>
                <TableHead>키워드/조건</TableHead>
                <TableHead>일치 방식</TableHead>
                <TableHead>분류 카테고리</TableHead>
                <TableHead>사업비 여부</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!rules || rules.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                    등록된 태깅 규칙이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {rule.priority}
                    </TableCell>
                    <TableCell className="font-medium">
                      {rule.keyword}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {rule.match_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(rule.mdt_categories as any)?.name || '알 수 없음'}
                    </TableCell>
                    <TableCell>
                      {rule.is_business ? (
                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                          사업비 {rule.business_tag && `(${rule.business_tag})`}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          개인 지출
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
