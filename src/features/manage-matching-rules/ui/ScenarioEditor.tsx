'use client';

import React from 'react';
import { MatchingConditions } from '@/entities/matching-rule/model/types';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Checkbox } from '@/shared/ui/checkbox';

interface ScenarioEditorProps {
  conditions: MatchingConditions;
  onChange: (conditions: MatchingConditions) => void;
}

export function ScenarioEditor({ conditions, onChange }: ScenarioEditorProps) {
  const handleDayChange = (index: 0 | 1, value: string) => {
    const newDays = [...(conditions.day_of_range || [1, 31])] as [number, number];
    newDays[index] = Math.min(31, Math.max(1, parseInt(value) || 1));
    onChange({ ...conditions, day_of_range: newDays });
  };

  const handleAmountTypeChange = (type: 'variance' | 'range') => {
    onChange({
      ...conditions,
      amount_condition: {
        type,
        ...(type === 'variance' 
          ? { base: 0, percentage: 10 } 
          : { min: 0, max: 0 })
      }
    });
  };

  return (
    <div className="space-y-6 pt-4 border-t">
      <div className="space-y-3">
        <div className="flex items-center justify-between transition-all">
          <Label className="text-sm font-semibold flex items-center gap-2">
            📅 입금일 조건 (날짜 범위)
          </Label>
          <Badge variant="outline" className="text-[10px]">Recommended</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-muted-foreground ml-1">시작일</span>
            <Input 
              type="number" 
              min={1} 
              max={31} 
              value={conditions.day_of_range?.[0] || ''} 
              onChange={(e) => handleDayChange(0, e.target.value)}
              placeholder="1"
              className="h-9"
            />
          </div>
          <span className="mt-5 text-muted-foreground">~</span>
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-muted-foreground ml-1">종료일</span>
            <Input 
              type="number" 
              min={1} 
              max={31} 
              value={conditions.day_of_range?.[1] || ''} 
              onChange={(e) => handleDayChange(1, e.target.value)}
              placeholder="31"
              className="h-9"
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          * 해당 기간 외에 입금된 건은 매칭 추천 점수가 낮아집니다.
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold flex items-center gap-2">
          💰 금액 조건 (가변 범위)
        </Label>
        
        <div className="flex gap-4">
          <div 
            className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              conditions.amount_condition?.type === 'variance' ? 'border-primary bg-primary/5' : 'border-muted'
            }`}
            onClick={() => handleAmountTypeChange('variance')}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full border ${conditions.amount_condition?.type === 'variance' ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
              <span className="text-xs font-medium">오차 범위 (%)</span>
            </div>
            <p className="text-[10px] text-muted-foreground">기준 금액 대비 ±N% 허용</p>
          </div>
          <div 
            className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              conditions.amount_condition?.type === 'range' ? 'border-primary bg-primary/5' : 'border-muted'
            }`}
            onClick={() => handleAmountTypeChange('range')}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full border ${conditions.amount_condition?.type === 'range' ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
              <span className="text-xs font-medium">직접 입력 (Range)</span>
            </div>
            <p className="text-[10px] text-muted-foreground">최소 ~ 최대 금액 지정</p>
          </div>
        </div>

        {conditions.amount_condition?.type === 'variance' && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground ml-1">기준 금액</span>
              <Input 
                type="number" 
                value={conditions.amount_condition.base || ''} 
                onChange={(e) => onChange({
                  ...conditions,
                  amount_condition: { ...conditions.amount_condition!, base: parseInt(e.target.value) || 0 }
                })}
                placeholder="30,000"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground ml-1">오차 (%)</span>
              <Input 
                type="number" 
                value={conditions.amount_condition.percentage || ''} 
                onChange={(e) => onChange({
                  ...conditions,
                  amount_condition: { ...conditions.amount_condition!, percentage: parseInt(e.target.value) || 0 }
                })}
                placeholder="10"
                className="h-9"
              />
            </div>
          </div>
        )}

        {conditions.amount_condition?.type === 'range' && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground ml-1">최소 금액</span>
              <Input 
                type="number" 
                value={conditions.amount_condition.min || ''} 
                onChange={(e) => onChange({
                  ...conditions,
                  amount_condition: { ...conditions.amount_condition!, min: parseInt(e.target.value) || 0 }
                })}
                placeholder="0"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground ml-1">최대 금액</span>
              <Input 
                type="number" 
                value={conditions.amount_condition.max || ''} 
                onChange={(e) => onChange({
                  ...conditions,
                  amount_condition: { ...conditions.amount_condition!, max: parseInt(e.target.value) || 0 }
                })}
                placeholder="1,000,000"
                className="h-9"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
