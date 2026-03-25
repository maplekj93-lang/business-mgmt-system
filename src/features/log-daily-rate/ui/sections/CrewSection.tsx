"use client";

import { UserPlus, Trash2, Plus } from "lucide-react";
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
import { CREW_ROLES } from "@/shared/constants/business";
import type { CrewPayment, VatType } from "@/entities/daily-rate/model/types";
import type { CrewProfile } from "@/entities/crew/model/types";

interface CrewSectionProps {
  crew: Omit<CrewPayment, "id" | "daily_rate_log_id" | "amount_net">[];
  onChange: (
    crew: Omit<CrewPayment, "id" | "daily_rate_log_id" | "amount_net">[]
  ) => void;
  crewProfiles: CrewProfile[];
  crewLoading: boolean;
  showCrew: boolean;
  onToggle: () => void;
}

export function CrewSection({
  crew,
  onChange,
  crewProfiles,
  crewLoading,
  showCrew,
  onToggle,
}: CrewSectionProps) {
  const addCrew = () => {
    onChange([
      ...crew,
      {
        crew_name: "",
        role: "세컨",
        amount_gross: 0,
        vat_type: "none",
        withholding_rate: 0.033,
        paid: false,
      },
    ]);
  };

  const removeCrew = (index: number) => {
    onChange(crew.filter((_, i) => i !== index));
  };

  const updateCrew = (
    index: number,
    updates: Partial<Omit<CrewPayment, "id" | "daily_rate_log_id" | "amount_net">>
  ) => {
    const next = [...crew];
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
          <UserPlus className="h-4 w-4 text-blue-400" />
          크루 인건비 {crew.length > 0 && `(${crew.length})`}
        </div>
        <span className="text-xs opacity-50">{showCrew ? "접기" : "펼치기"}</span>
      </Button>

      {showCrew && (
        <div className="mt-4 space-y-4 pl-3 border-l-2 border-blue-500/20">
          {crew.map((c, i) => (
            <div
              key={i}
              className="relative grid grid-cols-12 gap-3 items-end bg-white/5 p-4 rounded-xl shadow-sm border border-white/5"
            >
              <div className="col-span-12 sm:col-span-4 space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  이름
                </Label>
                <Select
                  value={c.crew_name}
                  onValueChange={(crewName) => {
                    const selectedCrew = crewProfiles.find(
                      (cp) => cp.name === crewName
                    );
                    updateCrew(i, {
                      crew_name: crewName,
                      withholding_rate: selectedCrew?.withholding_rate || 0.033,
                    });
                  }}
                >
                  <SelectTrigger className="h-9 text-sm bg-slate-900/50 border-white/10 text-white">
                    <SelectValue
                      placeholder={crewLoading ? "로딩 중..." : "크루 선택"}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white max-h-48">
                    {crewProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.name}>
                        {profile.name} (
                        {(profile.withholding_rate * 100).toFixed(1)}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-6 sm:col-span-3 space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  역할
                </Label>
                <Select
                  value={c.role}
                  onValueChange={(role) => updateCrew(i, { role })}
                >
                  <SelectTrigger className="h-9 text-sm bg-slate-900/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {CREW_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-6 sm:col-span-4 space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  금액 (세전)
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      className="h-9 text-sm pr-7 bg-slate-900/50 border-white/10 text-white font-bold"
                      placeholder="0"
                      value={c.amount_gross || ""}
                      onChange={(e) =>
                        updateCrew(i, { amount_gross: Number(e.target.value) })
                      }
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500">
                      원
                    </span>
                  </div>
                  <Select 
                    value={c.vat_type || 'none'} 
                    onValueChange={(val) => updateCrew(i, { vat_type: val as VatType })}
                  >
                    <SelectTrigger className="w-[85px] h-9 text-[11px] bg-slate-900/50 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="none">부가세 無</SelectItem>
                      <SelectItem value="exclude">별도</SelectItem>
                      <SelectItem value="include">포함</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="col-span-12 sm:col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
                  onClick={() => removeCrew(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="col-span-12 mt-1 flex justify-between items-center bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10">
                <span className="text-[10px] text-blue-400 font-medium">실수령액 (원천세 차감)</span>
                <span className="text-sm font-bold text-blue-400">
                  {(
                    c.amount_gross *
                    (1 - (c.withholding_rate || 0.033))
                  ).toLocaleString()}
                  원
                </span>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-9 border-dashed bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            onClick={addCrew}
          >
            <Plus className="h-3.5 w-3.5 mr-2" /> 크루 추가
          </Button>
        </div>
      )}
    </div>
  );
}
