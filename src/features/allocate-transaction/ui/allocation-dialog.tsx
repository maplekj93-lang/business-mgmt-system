'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { BusinessUnit } from '@/entities/business';
import { allocateTransactionAction } from '../api/allocate';
import { Loader2, Briefcase } from 'lucide-react';

interface AllocationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    transactionIds: string[];
    onSuccess?: () => void;
    businessUnits: BusinessUnit[]; // Passed from Server Component or fetched via React Query (here passed via props)
}

export function AllocationDialog({
    isOpen,
    onClose,
    transactionIds,
    onSuccess,
    businessUnits
}: AllocationDialogProps) {
    const [selectedUnitId, setSelectedUnitId] = React.useState<string>('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleConfirm = async () => {
        if (!selectedUnitId) return;

        setIsSubmitting(true);
        const result = await allocateTransactionAction(transactionIds, selectedUnitId);
        setIsSubmitting(false);

        if (result.success) {
            onSuccess?.();
            onClose();
        } else {
            alert(result.message || 'Allocation failed');
        }
    };

    // Find selected unit for display details
    const selectedUnit = businessUnits.find(u => u.id === selectedUnitId);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] glass-panel bg-background/90 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        사업 비용 처리 (Allocation)
                    </DialogTitle>
                    <DialogDescription>
                        선택한 {transactionIds.length}건의 내역을 비즈니스 유닛으로 이동합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            귀속될 사업 단위 (Business Unit)
                        </label>
                        <Select onValueChange={setSelectedUnitId} value={selectedUnitId}>
                            <SelectTrigger className="w-full bg-white/5 border-white/10">
                                <SelectValue placeholder="사업 단위를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {businessUnits.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="font-semibold">{unit.name}</span>
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {unit.metadata.owner} • {unit.type}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedUnit && (
                        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm">
                            <p className="font-medium text-indigo-400">💡 {selectedUnit.name}</p>
                            <p className="text-muted-foreground mt-1">
                                이 내역은 이제 <b>Business Context</b>에서만 보이며,
                                <b>{selectedUnit.metadata.owner}</b>님의 순수익 계산에 반영됩니다.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="border-white/10 hover:bg-white/5">
                        취소
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedUnitId || isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        확인
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
