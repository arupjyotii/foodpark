import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Category, MenuItem } from '@/types';

interface MenuState {
    categories: Category[];
    items: MenuItem[];
    loading: boolean;
    fetchMenu: () => Promise<void>;
    searchItems: (query: string) => MenuItem[];
    filterByCategory: (categoryId: string | null) => MenuItem[];
}

export const useMenu = create<MenuState>((set, get) => ({
    categories: [],
    items: [],
    loading: false,

    fetchMenu: async () => {
        set({ loading: true });

        const [categoriesRes, itemsRes] = await Promise.all([
            supabase.from('categories').select('*').order('name'),
            supabase.from('menu_items').select('*').eq('is_available', true).order('name'),
        ]);

        set({
            categories: (categoriesRes.data as Category[]) || [],
            items: (itemsRes.data as MenuItem[]) || [],
            loading: false
        });
    },

    searchItems: (query: string) => {
        const term = query.toLowerCase();
        return get().items.filter((item) =>
            item.name.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term)
        );
    },

    filterByCategory: (categoryId: string | null) => {
        if (!categoryId) return get().items;
        return get().items.filter((item) => item.category_id === categoryId);
    },
}));
