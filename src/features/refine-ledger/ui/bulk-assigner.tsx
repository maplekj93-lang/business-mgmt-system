'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/shared/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/shared/ui/popover';
import { Checkbox } from '@/shared/ui/checkbox';
import { bulkUpdateTransactions } from '../api/bulk-update';
import { UnclassifiedGroup } from '@/entities/transaction/api/get-unclassified';

import { BusinessUnit } from '@/entities/business';
import { getRecommendationsAction, Recommendation } from '../api/get-recommendations';
import { Sparkles } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense' | 'transfer';
}

interface CategoryGroup {
    main: Category;
    subs: Category[];
}

interface BulkAssignerProps {
    group: UnclassifiedGroup;
    categories: CategoryGroup[];
    businessUnits: BusinessUnit[];
}

import { useRouter } from 'next/navigation';

export function BulkAssigner({ group, categories, businessUnits }: BulkAssignerProps) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [createRule, setCreateRule] = React.useState(true); // Default checked
    const [isLoading, setIsLoading] = React.useState(false);
    const [businessUnitId, setBusinessUnitId] = React.useState<string | undefined>(undefined);
    const [recommendation, setRecommendation] = React.useState<Recommendation | null>(null);

    React.useEffect(() => {
        const fetchRec = async () => {
            const rec = await getRecommendationsAction(group.rawName);
            setRecommendation(rec);
        };
        fetchRec();
    }, [group.rawName]);

    const onSelectCategory = async (categoryId: number, categoryName?: string) => {
        setIsLoading(true);
        setOpen(false);

        const toastId = toast.loading(`"${group.rawName}" 분류 중... (${group.count}건)`);

        try {
            const res = await bulkUpdateTransactions(
                group.transactionIds,
                categoryId,
                createRule,
                group.rawName,
                businessUnitId
            );

            if (!res.success) {
                toast.error(`분류 실패: ${res.message}`, { id: toastId });
                setIsLoading(false);
            } else {
                // Success
                toast.success(
                    `✅ "${group.rawName}" → ${categoryName || '카테고리'} (${group.count}건 완료)` +
                    (createRule ? ' · 자동분류 규칙 저장됨' : ''),
                    { id: toastId, duration: 4000 }
                );
                router.refresh();
                setTimeout(() => setIsLoading(false), 2000);
            }
        } catch (error) {
            console.error(error);
            toast.error('예기치 않은 오류가 발생했습니다.', { id: toastId });
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground delay-0 duration-100" />;
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[220px] justify-between h-8 text-xs bg-muted/50"
                >
                    카테고리 선택...
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="start">
                <Command>
                    {/* Business Unit Selection */}
                    <div className="p-3 border-b bg-muted/20">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Context (Allocation)
                            </label>
                            <select
                                className="w-full text-xs bg-background border border-border/50 rounded p-1 outline-none"
                                value={businessUnitId || ''}
                                onChange={(e) => setBusinessUnitId(e.target.value || undefined)}
                            >
                                <option value="">Personal (개인 가계부)</option>
                                {businessUnits.map(unit => (
                                    <option key={unit.id} value={unit.id}>
                                        Business: {unit.name} ({unit.metadata.owner})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <CommandInput placeholder="카테고리 검색..." />
                    <CommandList className="max-h-[250px] overflow-y-auto">
                        <CommandEmpty>결과 없음.</CommandEmpty>

                        {/* Smart Recommendation */}
                        {recommendation && (
                            <CommandGroup heading="✨ Smart Recommendation">
                                <CommandItem
                                    onSelect={() => onSelectCategory(recommendation.categoryId, recommendation.categoryName)}
                                    className="bg-indigo-500/10 text-indigo-400 font-bold hover:bg-indigo-500/20"
                                >
                                    <Sparkles className="mr-2 h-3 w-3" />
                                    {recommendation.categoryName}
                                    <span className="ml-auto text-[10px] opacity-60">
                                        {Math.round(recommendation.confidence * 100)}% Match
                                    </span>
                                </CommandItem>
                            </CommandGroup>
                        )}

                        {/* Income Categories */}
                        {categories.filter(g => g.main.type === 'income').length > 0 && (
                            <div className="px-2 py-1.5 text-[10px] font-bold text-primary uppercase bg-primary/5">
                                💰 수입 카테고리 (Income)
                            </div>
                        )}
                        {categories.filter(g => g.main.type === 'income').map((catGroup) => (
                            <CommandGroup key={catGroup.main.id} heading={catGroup.main.name}>
                                <CommandItem
                                    key={catGroup.main.id}
                                    value={catGroup.main.name}
                                    onSelect={() => onSelectCategory(catGroup.main.id, catGroup.main.name)}
                                    className="font-bold text-primary/80"
                                >
                                    <Check className="mr-2 h-3 w-3 opacity-0" />
                                    {catGroup.main.name} (전체)
                                </CommandItem>
                                {catGroup.subs.map((sub) => (
                                    <CommandItem
                                        key={sub.id}
                                        value={`${catGroup.main.name} ${sub.name}`}
                                        onSelect={() => onSelectCategory(sub.id, `${catGroup.main.name} > ${sub.name}`)}
                                        className="pl-6 text-xs"
                                    >
                                        <span className="opacity-30 mr-2">└</span>
                                        {sub.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}

                        {/* Expense Categories */}
                        <div className="px-2 py-1.5 text-[10px] font-bold text-destructive uppercase bg-destructive/5 mt-2">
                            💸 지출 카테고리 (Expense)
                        </div>
                        {categories.filter(g => g.main.type === 'expense').map((catGroup) => (
                            <CommandGroup key={catGroup.main.id} heading={catGroup.main.name}>
                                <CommandItem
                                    key={catGroup.main.id}
                                    value={catGroup.main.name}
                                    onSelect={() => onSelectCategory(catGroup.main.id, catGroup.main.name)}
                                    className="font-bold text-destructive/80"
                                >
                                    <Check className="mr-2 h-3 w-3 opacity-0" />
                                    {catGroup.main.name} (전체)
                                </CommandItem>
                                {catGroup.subs.map((sub) => (
                                    <CommandItem
                                        key={sub.id}
                                        value={`${catGroup.main.name} ${sub.name}`}
                                        onSelect={() => onSelectCategory(sub.id, `${catGroup.main.name} > ${sub.name}`)}
                                        className="pl-6 text-xs"
                                    >
                                        <span className="opacity-30 mr-2">└</span>
                                        {sub.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}

                        {/* Transfer Categories */}
                        {categories.filter(g => g.main.type === 'transfer').length > 0 && (
                            <div className="px-2 py-1.5 text-[10px] font-bold text-amber-600 uppercase bg-amber-500/5 mt-2">
                                🔄 이체 / 내부거래 (Transfer)
                            </div>
                        )}
                        {categories.filter(g => g.main.type === 'transfer').map((catGroup) => (
                            <CommandGroup key={catGroup.main.id} heading={catGroup.main.name}>
                                <CommandItem
                                    key={catGroup.main.id}
                                    value={catGroup.main.name}
                                    onSelect={() => onSelectCategory(catGroup.main.id, catGroup.main.name)}
                                    className="font-bold text-amber-600/80"
                                >
                                    <Check className="mr-2 h-3 w-3 opacity-0" />
                                    {catGroup.main.name} (전체)
                                </CommandItem>
                                {catGroup.subs.map((sub) => (
                                    <CommandItem
                                        key={sub.id}
                                        value={`${catGroup.main.name} ${sub.name}`}
                                        onSelect={() => onSelectCategory(sub.id, `${catGroup.main.name} > ${sub.name}`)}
                                        className="pl-6 text-xs"
                                    >
                                        <span className="opacity-30 mr-2">└</span>
                                        {sub.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>

                    {/* Rule Engine Toggle */}
                    <div className="p-3 border-t bg-muted/20">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={`rule-${group.rawName}`}
                                checked={createRule}
                                onCheckedChange={(c: boolean | 'indeterminate') => setCreateRule(c === true)}
                            />
                            <label
                                htmlFor={`rule-${group.rawName}`}
                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                            >
                                '{group.rawName}' 자동 분류 규칙 생성
                            </label>
                        </div>
                    </div>

                </Command>
            </PopoverContent>
        </Popover>
    );
}
