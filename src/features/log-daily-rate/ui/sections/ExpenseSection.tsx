"use client";

import { Receipt, Trash2, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { EXPENSE_CATEGORIES } from "@/shared/constants/business";
import type { SiteExpense } from "@/entities/daily-rate/model/types";

interface ExpenseSectionProps {
  expenses: Omit<SiteExpense, "id" | "daily_rate_log_id">[];
  onChange: (expenses: Omit<SiteExpense, "id" | "daily_rate_log_id">[]) => void;
  showExpenses: boolean;
  onToggle: () => void;
}

export function ExpenseSection({
  expenses,
  onChange,
  showExpenses,
  onToggle,
}: ExpenseSectionProps) {
  const addExpense = () => {
    onChange([
      ...expenses,
      { category: "주차비", amount: 0, included_in_invoice: true, memo: "" },
    ]);
  };

  const removeExpense = (index: number) => {
    onChange(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (
    index: number,
    updates: Partial<Omit<SiteExpense, "id" | "daily_rate_log_id">>
  ) => {
    const next = [...expenses];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  return (
    <div className="border-t border-white/5 pt-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between px-2 h-8 hover:bg-white/5 text-slate-300"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Receipt className="h-4 w-4 text-amber-400" />
          현장 진행비 {expenses.length > 0 && `(${expenses.length})`}
        </div>
        <span className="text-xs opacity-50">{showExpenses ? "접기" : "펼치기"}</span>
      </Button>

      {showExpenses && (
        <div className="mt-4 space-y-4 pl-3 border-l-2 border-amber-500/20">
          {expenses.map((e, i) => (
            <div
              key={i}
              className="relative grid grid-cols-12 gap-3 items-end bg-white/5 p-4 rounded-xl shadow-sm border border-white/5"
            >
              <div className="col-span-6 sm:col-span-4 space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  항목
                </Label>
                <Select
                  value={e.category}
                  onValueChange={(category) => updateExpense(i, { category })}
                >
                  <SelectTrigger className="h-9 text-sm bg-slate-900/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {EXPENSE_CATEGORIES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-6 sm:col-span-4 space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  금액
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    className="h-9 text-sm pr-7 bg-slate-900/50 border-white/10 text-white font-bold"
                    placeholder="0"
                    value={e.amount || ""}
                    onChange={(val) =>
                      updateExpense(i, { amount: Number(val.target.value) })
                    }
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-slate-500">
                    원
                  </span>
                </div>
              </div>

              <div className="col-span-9 sm:col-span-3 pb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`inc-${i}`}
                  className="w-4 h-4 rounded border-white/20 bg-slate-800 text-amber-600 focus:ring-amber-500/30"
                  checked={e.included_in_invoice}
                  onChange={(v) =>
                    updateExpense(i, { included_in_invoice: v.target.checked })
                  }
                />
                <Label
                  htmlFor={`inc-${i}`}
                  className="text-xs font-medium cursor-pointer text-slate-400"
                >
                  청구 포함
                </Label>
              </div>

              <div className="col-span-3 sm:col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
                  onClick={() => removeExpense(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-9 border-dashed bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            onClick={addExpense}
          >
            <Plus className="h-3.5 w-3.5 mr-2" /> 진행비 추가
          </Button>
        </div>
      )}
    </div>
  );
}
