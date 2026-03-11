'use client'

import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Category } from '@/entities/category/model/types';
import { Button } from '@/shared/ui/button';
import { Edit2, Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { deleteCategory } from '../api/delete-category';
import { CategoryFormDialog } from './category-form-dialog';
import { cn } from '@/shared/lib/utils';

interface CategoryListItemProps {
    category: Category;
    children?: React.ReactNode;
    isRoot?: boolean;
}

export function CategoryListItem({ category, children, isRoot = false }: CategoryListItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Color Mapping for Tailwind dynamic classes
    const colorMap: Record<string, { text: string; bg: string; border: string }> = {
        slate: { text: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
        red: { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        orange: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
        amber: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        yellow: { text: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        lime: { text: 'text-lime-500', bg: 'bg-lime-500/10', border: 'border-lime-500/20' },
        green: { text: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        teal: { text: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
        sky: { text: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
        blue: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        indigo: { text: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
        violet: { text: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
        purple: { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        pink: { text: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
        rose: { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    };

    const config = colorMap[category.ui_config?.color ?? 'slate'] || colorMap.slate;
    const colorClass = config.text;
    const bgClass = config.bg;
    const borderClass = config.border;

    // Dynamic Icon Rendering
    const IconComponent = (LucideIcons as any)[category.ui_config?.icon ?? 'Package'] || LucideIcons.Package;

    const handleDelete = async () => {
        if (!confirm(`'${category.name}' 카테고리를 삭제하시겠습니까?`)) return;

        setIsDeleting(true);
        const result = await deleteCategory(category.id);
        setIsDeleting(false);

        if (!result.success) {
            alert(result.message);
        }
    };

    return (
        <div className={cn("space-y-1", isRoot ? "mb-4" : "ml-6 border-l  pl-4 py-1")}>
            <div className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all tactile-panel">
                <div className="flex items-center gap-3">
                    {children && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 hover:bg-transparent"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                    )}

                    <div className={cn("p-2 rounded-md", bgClass)}>
                        <IconComponent className={cn("w-4 h-4", colorClass)} />
                    </div>

                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{category.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase text-muted-foreground tracking-wider">{category.type}</span>
                            {category.is_business_only && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border-blue-500/20">BUSINESS</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isRoot && (
                        <CategoryFormDialog
                            parent_id={category.id}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            }
                        />
                    )}

                    <CategoryFormDialog
                        category={category}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                <Edit2 className="w-4 h-4" />
                            </Button>
                        }
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {isExpanded && children && (
                <div className="space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
}
