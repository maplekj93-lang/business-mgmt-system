'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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

export function BulkAssigner({ group, categories, businessUnits }: BulkAssignerProps) {
    const [open, setOpen] = React.useState(false);
    const [createRule, setCreateRule] = React.useState(true); // Default checked
    const [isLoading, setIsLoading] = React.useState(false);
    const [businessUnitId, setBusinessUnitId] = React.useState<string | undefined>(undefined);

    const onSelectCategory = async (categoryId: number) => {
        setIsLoading(true);
        setOpen(false);

        const res = await bulkUpdateTransactions(
            group.transactionIds,
            categoryId,
            createRule,
            group.rawName,
            businessUnitId
        );

        if (!res.success) {
            alert(`Failed: ${res.message}`);
            setIsLoading(false);
        } else {
            // Success - item will vanish due to revalidatePath
            // We don't need to unset loading manually as component unmounts likely
        }
    };

    if (isLoading) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
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
                        {/* Income Categories */}
                        {categories.filter(g => g.main.type === 'income').length > 0 && (
                            <div className="px-2 py-1.5 text-[10px] font-bold text-primary uppercase bg-primary/5">
                                💰 수입 카테고리 (Income)
                            </div>
                        )}
                        {categories.filter(g => g.main.type === 'income').map((group) => (
                            <CommandGroup key={group.main.id} heading={group.main.name}>
                                <CommandItem
                                    key={group.main.id}
                                    value={group.main.name}
                                    onSelect={() => onSelectCategory(group.main.id)}
                                    className="font-bold text-primary/80"
                                >
                                    <Check className="mr-2 h-3 w-3 opacity-0" />
                                    {group.main.name} (전체)
                                </CommandItem>
                                {group.subs.map((sub) => (
                                    <CommandItem
                                        key={sub.id}
                                        value={`${group.main.name} ${sub.name}`}
                                        onSelect={() => onSelectCategory(sub.id)}
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
                        {categories.filter(g => g.main.type === 'expense').map((group) => (
                            <CommandGroup key={group.main.id} heading={group.main.name}>
                                <CommandItem
                                    key={group.main.id}
                                    value={group.main.name}
                                    onSelect={() => onSelectCategory(group.main.id)}
                                    className="font-bold text-destructive/80"
                                >
                                    <Check className="mr-2 h-3 w-3 opacity-0" />
                                    {group.main.name} (전체)
                                </CommandItem>
                                {group.subs.map((sub) => (
                                    <CommandItem
                                        key={sub.id}
                                        value={`${group.main.name} ${sub.name}`}
                                        onSelect={() => onSelectCategory(sub.id)}
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
