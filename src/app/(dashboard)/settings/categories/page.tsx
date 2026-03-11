import React from 'react';
import { createClient } from '@/shared/api/supabase/server';
import { getCategoryTree } from '@/entities/category/api/get-categories';
import { CategoryListItem } from '@/features/manage-categories/ui/category-list-item';
import { CategoryFormDialog } from '@/features/manage-categories/ui/category-form-dialog';
import { Button } from '@/shared/ui/button';
import { Plus, Settings2 } from 'lucide-react';

export default async function CategoryManagementPage() {
    const tree = await getCategoryTree();

    return (
        <div>
            <main className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent flex items-center gap-3">
                            <Settings2 className="w-8 h-8 text-primary" />
                            카테고리 관리
                        </h2>
                        <p className="text-muted-foreground">
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
                    {tree.length === 0 ? (
                        <div className="tactile-panel p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Plus className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">아직 카테고리가 없습니다. 대분류를 먼저 추가해 주세요.</p>
                        </div>
                    ) : (
                        tree.map((main) => (
                            <CategoryListItem key={main.id} category={main} isRoot>
                                {main.children.map((sub) => (
                                    <CategoryListItem key={sub.id} category={sub} />
                                ))}
                            </CategoryListItem>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
