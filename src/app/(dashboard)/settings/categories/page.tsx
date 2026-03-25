import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { CategoryManager } from '@/features/manage-categories/ui/category-manager';
import { TaggingRuleManager } from '@/features/refine-ledger/ui/tagging-rule-manager';
import { getCategoryTree } from '@/entities/category/api/get-categories';
import { Settings2, Tag, ListTree } from 'lucide-react';

export default async function CategoriesPage() {
    const tree = await getCategoryTree();

    return (
        <main className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent flex items-center gap-3">
                        <Settings2 className="w-8 h-8 text-primary" />
                        분류 및 규칙 설정
                    </h2>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                        지출과 수입을 정리하는 <code className="bg-muted px-1 rounded text-primary font-mono">카테고리</code>와 거래처별 <code className="bg-muted px-1 rounded text-primary font-mono">태깅 규칙</code>을 한 곳에서 관리하세요.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="categories" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="categories" className="flex items-center gap-2">
                        <ListTree className="w-4 h-4" />
                        카테고리 트리
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        키워드 태깅 규칙
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-4 border-none p-0 outline-none">
                    <CategoryManager initialTree={tree} />
                </TabsContent>

                <TabsContent value="rules" className="space-y-4 border-none p-0 outline-none">
                    <TaggingRuleManager />
                </TabsContent>
            </Tabs>
        </main>
    );
}
