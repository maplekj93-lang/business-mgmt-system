'use client';

import React from 'react';
import { CategoryListItem } from '@/features/manage-categories/ui/category-list-item';
import { CategoryFormDialog } from '@/features/manage-categories/ui/category-form-dialog';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { CategoryTreeItem } from '@/entities/category/model/types';

interface CategoryManagerProps {
    initialTree: CategoryTreeItem[];
}

export function CategoryManager({ initialTree }: CategoryManagerProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold tracking-tight">카테고리 구조</h3>
                    <p className="text-sm text-muted-foreground">
                        장부의 카테고리 구조를 설정하고 아이콘을 커스텀하세요.
                    </p>
                </div>

                <CategoryFormDialog
                    trigger={
                        <Button className="rounded-full shadow-primary/20 gap-2">
                            <Plus className="w-4 h-4" />
                            대분류 추가
                        </Button>
                    }
                />
            </div>

            <div className="grid gap-4">
                {initialTree.length === 0 ? (
                    <div className="tactile-panel p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <Plus className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">아직 카테고리가 없습니다. 대분류를 먼저 추가해 주세요.</p>
                    </div>
                ) : (
                    initialTree.map((main) => (
                        <CategoryListItem key={main.id} category={main} isRoot>
                            {main.children.map((sub) => (
                                <CategoryListItem key={sub.id} category={sub} />
                            ))}
                        </CategoryListItem>
                    ))
                )}
            </div>
        </div>
    );
}
