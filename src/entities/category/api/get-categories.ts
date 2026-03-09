import { createClient } from '@/shared/api/supabase/server';
import { Category, CategoryTreeItem } from '../model/types';

export async function getCategoryTree(): Promise<CategoryTreeItem[]> {
    const supabase = await createClient();

    // Explicitly select all needed columns for types
    const { data: categories, error } = await supabase
        .from('mdt_categories')
        .select('id, name, parent_id, type, is_business_only, ui_config')
        .order('id', { ascending: true });

    if (error) {
        console.error('getCategoryTree Error:', error);
        return [];
    }

    if (!categories) return [];

    const categoryMap = new Map<number, CategoryTreeItem>();
    const tree: CategoryTreeItem[] = [];

    // First pass: Create Map of all items
    categories.forEach((cat: any) => {
        categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: Build Tree
    categories.forEach((cat: any) => {
        const treeItem = categoryMap.get(cat.id)!;
        if (cat.parent_id === null) {
            tree.push(treeItem);
        } else {
            const parent = categoryMap.get(cat.parent_id);
            if (parent) {
                parent.children.push(treeItem);
            } else {
                // Orphan category, treat as root for safety
                tree.push(treeItem);
            }
        }
    });

    return tree;
}

export async function getAllCategories(): Promise<Category[]> {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
        .from('mdt_categories')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('getAllCategories Error:', error);
        return [];
    }

    return (categories as any as Category[]) || [];
}
