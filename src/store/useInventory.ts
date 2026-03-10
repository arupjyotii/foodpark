import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Ingredient, Supplier, StockMovement, RecipeItem, Profile } from '@/types';

interface InventoryState {
    ingredients: Ingredient[];
    suppliers: Supplier[];
    movements: (StockMovement & { ingredient?: Ingredient; user?: Profile })[];
    loading: boolean;
    error: string | null;
    fetchIngredients: () => Promise<void>;
    fetchSuppliers: () => Promise<void>;
    fetchMovements: () => Promise<void>;
    addIngredient: (ingredient: Omit<Ingredient, 'id' | 'created_at'>) => Promise<void>;
    updateIngredient: (id: string, updates: Partial<Ingredient>) => Promise<void>;
    addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at'>) => Promise<void>;
    updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
    logMovement: (movement: Omit<StockMovement, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
    getRecipe: (menuItemId: string) => Promise<(RecipeItem & { ingredient: Ingredient })[]>;
    addRecipeItem: (recipeItem: Omit<RecipeItem, 'id'>) => Promise<void>;
    removeRecipeItem: (id: string) => Promise<void>;
}

export const useInventory = create<InventoryState>((set, get) => ({
    ingredients: [],
    suppliers: [],
    movements: [],
    loading: false,
    error: null,

    fetchIngredients: async () => {
        set({ loading: true });
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .order('name');

        if (error) {
            set({ error: error.message, loading: false });
        } else {
            set({ ingredients: data as Ingredient[], loading: false });
        }
    },

    fetchSuppliers: async () => {
        set({ loading: true });
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name');

        if (error) {
            set({ error: error.message, loading: false });
        } else {
            set({ suppliers: data as Supplier[], loading: false });
        }
    },

    addIngredient: async (ingredient) => {
        set({ loading: true });
        const { error } = await supabase.from('ingredients').insert(ingredient);
        if (error) {
            set({ error: error.message, loading: false });
        } else {
            await get().fetchIngredients();
        }
    },

    updateIngredient: async (id, updates) => {
        set({ loading: true });
        const { error } = await supabase.from('ingredients').update(updates).eq('id', id);
        if (error) {
            set({ error: error.message, loading: false });
        } else {
            await get().fetchIngredients();
        }
    },

    addSupplier: async (supplier) => {
        set({ loading: true });
        const { error } = await supabase.from('suppliers').insert(supplier);
        if (error) {
            set({ error: error.message, loading: false });
        } else {
            await get().fetchSuppliers();
        }
    },

    updateSupplier: async (id, updates) => {
        set({ loading: true });
        const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
        if (error) {
            set({ error: error.message, loading: false });
        } else {
            await get().fetchSuppliers();
        }
    },

    fetchMovements: async () => {
        set({ loading: true });
        const { data, error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                ingredient:ingredients(*),
                user:profiles(*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            set({ error: error.message, loading: false });
        } else {
            set({ movements: data as any[], loading: false });
        }
    },

    logMovement: async (movement) => {
        set({ loading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ error: 'User not authenticated', loading: false });
            return;
        }

        const { error } = await supabase.from('stock_movements').insert({
            ...movement,
            created_by: user.id
        });

        if (error) {
            set({ error: error.message, loading: false });
        } else {
            await get().fetchIngredients();
        }
    },

    getRecipe: async (menuItemId) => {
        const { data, error } = await supabase
            .from('recipe_items')
            .select(`
                *,
                ingredient:ingredients(*)
            `)
            .eq('menu_item_id', menuItemId);

        if (error) {
            console.error('Error fetching recipe:', error);
            return [];
        }
        return data as (RecipeItem & { ingredient: Ingredient })[];
    },

    addRecipeItem: async (recipeItem) => {
        set({ loading: true });
        const { error } = await supabase.from('recipe_items').insert(recipeItem);
        if (error) {
            set({ error: error.message, loading: false });
        } else {
            set({ loading: false });
        }
    },

    removeRecipeItem: async (id) => {
        set({ loading: true });
        const { error } = await supabase.from('recipe_items').delete().eq('id', id);
        if (error) {
            set({ error: error.message, loading: false });
        } else {
            set({ loading: false });
        }
    },
}));
