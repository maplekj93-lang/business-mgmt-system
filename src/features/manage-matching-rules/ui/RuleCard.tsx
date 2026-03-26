'use client';

import React, { useState } from 'react';
import { MatchingRuleWithConditions, MatchingConditions } from '@/entities/matching-rule/model/types';
import { updateMatchingRule } from '@/entities/matching-rule/api/update-matching-rule';
import { deleteMatchingRule } from '@/entities/matching-rule/api/delete-matching-rule';
import { Card, CardContent } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion';
import { Lock, Unlock, Trash2, Save, History } from 'lucide-react';
import { ScenarioEditor } from './ScenarioEditor';
import { toast } from 'sonner';

interface RuleCardProps {
  rule: MatchingRuleWithConditions;
  onUpdate: () => void;
}

export function RuleCard({ rule, onUpdate }: RuleCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [editedConditions, setEditedConditions] = useState<MatchingConditions>(rule.conditions || {});

  const handleToggleActive = async (checked: boolean) => {
    try {
      setIsPending(true);
      await updateMatchingRule({ id: rule.id, is_active: checked });
      onUpdate();
      toast.success(checked ? '규칙이 활성화되었습니다.' : '규칙이 비활성화되었습니다.');
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleLock = async () => {
    try {
      setIsPending(true);
      const newLocked = !rule.is_locked;
      await updateMatchingRule({ id: rule.id, is_locked: newLocked });
      onUpdate();
      toast.success(newLocked ? '규칙이 잠겼습니다. 자동 학습이 이 규칙을 수정하지 않습니다.' : '규칙 잠금이 해제되었습니다.');
    } catch (error) {
      toast.error('잠금 설정에 실패했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  const handleSaveConditions = async () => {
    try {
      setIsPending(true);
      await updateMatchingRule({ id: rule.id, conditions: editedConditions });
      onUpdate();
      toast.success('시나리오 조건이 저장되었습니다.');
    } catch (error) {
      toast.error('조건 저장에 실패했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 규칙을 삭제하시겠습니까?')) return;
    try {
      setIsPending(true);
      await deleteMatchingRule(rule.id);
      onUpdate();
      toast.success('규칙이 삭제되었습니다.');
    } catch (error) {
      toast.error('삭제에 실패했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className={`overflow-hidden transition-all border-l-4 ${rule.is_active ? 'border-l-primary' : 'border-l-muted opacity-80'}`}>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details" className="border-none">
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{rule.sender_name}</h3>
                  {rule.is_locked ? (
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0 h-5 bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                      <Lock className="w-3 h-3" />
                      Locked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 px-1.5 py-0 h-5 text-muted-foreground">
                      <Unlock className="w-3 h-3" />
                      Dynamic
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                    {rule.project_keyword}
                  </Badge>
                  <span className="text-[12px]">•</span>
                  <div className="flex items-center gap-1">
                    <History className="w-3 h-3" />
                    <span>{rule.usage_count}회 사용됨</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-muted-foreground">활성</span>
                    <Switch 
                      checked={rule.is_active ?? false} 
                      onCheckedChange={handleToggleActive} 
                      disabled={isPending}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-orange-600"
                    onClick={handleToggleLock}
                    disabled={isPending}
                  >
                    {rule.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </Button>
                </div>
                {rule.last_used_at && (
                  <span className="text-[10px] text-muted-foreground">
                    마지막 사용: {new Date(rule.last_used_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 pb-5">
              <AccordionTrigger className="py-2 hover:no-underline text-xs text-primary font-medium border-t">
                시나리오 조건 상세 설정
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <ScenarioEditor 
                    conditions={editedConditions} 
                    onChange={setEditedConditions} 
                  />
                  <div className="flex items-center justify-between pt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10 h-8 px-2"
                      onClick={handleDelete}
                      disabled={isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      규칙 삭제
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-8 shadow-sm"
                      onClick={handleSaveConditions}
                      disabled={isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      변경사항 저장
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
