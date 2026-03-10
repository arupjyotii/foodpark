import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, MenuItem } from '@/types';

export function useActiveOrder(tableId: string | null) {
    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<(OrderItem & { menu_item: MenuItem })[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchActiveOrder = async () => {
        if (!tableId) return;
        setLoading(true);

        try {
            // Find the most recent unpaid order for this table
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('table_id', tableId)
                .neq('status', 'paid')
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (orderError) {
                if (orderError.code !== 'PGRST116') console.error('Error fetching order:', orderError);
                setOrder(null);
                setItems([]);
            } else {
                setOrder(orderData as Order);

                // Fetch items for this order
                const { data: itemsData, error: itemsError } = await supabase
                    .from('order_items')
                    .select(`
            *,
            menu_item:menu_items(*)
          `)
                    .eq('order_id', orderData.id);

                if (itemsError) throw itemsError;
                setItems(itemsData as any);
            }
        } catch (error) {
            console.error('Error in useActiveOrder:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveOrder();

        // Subscribe to changes
        const channel = supabase
            .channel(`active-order-${tableId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, fetchActiveOrder)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchActiveOrder)
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [tableId]);

    return { order, items, loading, refresh: fetchActiveOrder };
}
