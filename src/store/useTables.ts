import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Table } from '@/types';

interface TableState {
    tables: Table[];
    loading: boolean;
    fetchTables: () => Promise<void>;
    updateTableStatus: (tableId: string, status: Table['status']) => Promise<void>;
    subscribeToTables: () => () => void;
}

export const useTables = create<TableState>((set) => ({
    tables: [],
    loading: false,
    fetchTables: async () => {
        set({ loading: true });
        const { data } = await supabase
            .from('tables')
            .select('*')
            .order('number', { ascending: true });
        set({ tables: (data as Table[]) || [], loading: false });
    },
    updateTableStatus: async (tableId, status) => {
        const { error } = await supabase
            .from('tables')
            .update({ status })
            .eq('id', tableId);

        if (error) {
            console.error('Error updating table status:', error);
            return;
        }

        set((state) => ({
            tables: state.tables.map((t) =>
                t.id === tableId ? { ...t, status } : t
            ),
        }));
    },
    subscribeToTables: () => {
        const subscription = supabase
            .channel('table-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'tables' },
                (payload) => {
                    const updatedTable = payload.new as Table;
                    set((state) => ({
                        tables: state.tables.map((t) =>
                            t.id === updatedTable.id ? updatedTable : t
                        ),
                    }));
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    },
}));
