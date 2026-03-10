import { create } from 'zustand';
import type { MenuItem } from '@/types';

export interface CartItem extends MenuItem {
    quantity: number;
    notes?: string;
}

interface CartState {
    items: CartItem[];
    tableId: string | null;
    tableName: string | null;
    addItem: (item: MenuItem) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    updateNotes: (itemId: string, notes: string) => void;
    clearCart: () => void;
    setTableId: (tableId: string | null, tableName?: string | null) => void;
    subtotal: () => number;
    tax: () => number;
    total: () => number;
}

const TAX_RATE = 0.05; // 5% GST

export const useCart = create<CartState>((set, get) => ({
    items: [],
    tableId: null,
    tableName: null,

    addItem: (item) => {
        const items = get().items;
        const existingItem = items.find((i) => i.id === item.id);

        if (existingItem) {
            set({
                items: items.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                ),
            });
        } else {
            set({ items: [...items, { ...item, quantity: 1 }] });
        }
    },

    removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.id !== itemId) });
    },

    updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(itemId);
            return;
        }
        set({
            items: get().items.map((i) =>
                i.id === itemId ? { ...i, quantity } : i
            ),
        });
    },

    updateNotes: (itemId, notes) => {
        set({
            items: get().items.map((i) =>
                i.id === itemId ? { ...i, notes } : i
            ),
        });
    },

    clearCart: () => set({ items: [], tableId: null, tableName: null }),

    setTableId: (tableId, tableName = null) => set({ tableId, tableName }),

    subtotal: () => {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    tax: () => {
        return Math.round(get().subtotal() * TAX_RATE);
    },

    total: () => {
        return get().subtotal() + get().tax();
    },
}));
