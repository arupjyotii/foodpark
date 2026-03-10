import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { printKOT } from '@/lib/billing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ChefHat, Clock, Loader2, RefreshCw, Printer,
    CheckCircle2, FlameKindling, Utensils
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ─── Types ─────────────────────────────────────────────────────────────────
interface KOTItem {
    id: string;
    quantity: number;
    notes?: string;
    menu_item: { name: string } | null;
}

interface KOTOrder {
    id: string;
    status: 'pending' | 'preparing' | 'ready';
    created_at: string;
    table: { number: string; id: string } | null;
    waiter: { full_name: string } | null;
    order_items: KOTItem[];
}

// ─── Column config ──────────────────────────────────────────────────────────
const columns: {
    status: KOTOrder['status'];
    label: string;
    nextStatus: string | null;
    nextLabel: string | null;
    color: string;
    headerColor: string;
    icon: typeof ChefHat;
}[] = [
        {
            status: 'pending',
            label: 'New Orders',
            nextStatus: 'preparing',
            nextLabel: 'Start Preparing',
            color: 'border-amber-200 bg-amber-50',
            headerColor: 'bg-amber-500',
            icon: FlameKindling,
        },
        {
            status: 'preparing',
            label: 'Preparing',
            nextStatus: 'ready',
            nextLabel: 'Mark Ready',
            color: 'border-blue-200 bg-blue-50',
            headerColor: 'bg-blue-500',
            icon: ChefHat,
        },
        {
            status: 'ready',
            label: 'Ready to Serve',
            nextStatus: null,
            nextLabel: null,
            color: 'border-emerald-200 bg-emerald-50',
            headerColor: 'bg-emerald-500',
            icon: Utensils,
        },
    ];

// ─── KOT Card ───────────────────────────────────────────────────────────────
function KOTCard({
    order,
    nextStatus,
    nextLabel,
    onStatusChange,
}: {
    order: KOTOrder;
    nextStatus: string | null;
    nextLabel: string | null;
    onStatusChange: (id: string, status: string) => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleMove = async () => {
        if (!nextStatus) return;
        setLoading(true);
        await onStatusChange(order.id, nextStatus);
        setLoading(false);
    };

    const handleReprintKOT = () => {
        printKOT({
            orderId: order.id,
            tableNumber: order.table?.number ?? '?',
            waiterName: order.waiter?.full_name ?? 'Unknown',
            createdAt: order.created_at,
            items: order.order_items.map(i => ({
                name: i.menu_item?.name ?? '—',
                quantity: i.quantity,
                notes: i.notes,
            })),
        });
    };

    return (
        <Card className="border shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-xl font-black">
                            {order.table?.number ?? '—'}
                        </CardTitle>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {order.waiter?.full_name ?? 'Unknown'}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                            #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 space-y-3">
                {/* Items */}
                <div className="space-y-2 border-t pt-3">
                    {order.order_items.map(item => (
                        <div key={item.id}>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-800">
                                    {item.menu_item?.name ?? '—'}
                                </span>
                                <span className="text-lg font-black text-primary ml-2">
                                    ×{item.quantity}
                                </span>
                            </div>
                            {item.notes && (
                                <p className="text-xs text-slate-400 italic ml-2">↳ {item.notes}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                    {nextStatus && nextLabel && (
                        <Button
                            size="sm"
                            className="flex-1 h-9 font-bold gap-1.5"
                            onClick={handleMove}
                            disabled={loading}
                        >
                            {loading
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <CheckCircle2 className="w-3.5 h-3.5" />
                            }
                            {nextLabel}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-1.5 text-slate-600"
                        onClick={handleReprintKOT}
                        title="Reprint KOT"
                    >
                        <Printer className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function KOTPage() {
    const [orders, setOrders] = useState<KOTOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        try {
            const { data } = await supabase
                .from('orders')
                .select(`
                    id, status, created_at,
                    table:tables(id, number),
                    waiter:profiles(full_name),
                    order_items(id, quantity, notes, menu_item:menu_items(name))
                `)
                .in('status', ['pending', 'preparing', 'ready'])
                .order('created_at', { ascending: true });

            setOrders((data as unknown as KOTOrder[]) || []);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel('kot-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchOrders]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        // Optimistic update
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: newStatus as KOTOrder['status'] } : o
        ));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="font-medium">Loading kitchen orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="bg-primary text-white p-2 rounded-xl">
                            <ChefHat className="w-6 h-6" />
                        </div>
                        Kitchen Display
                    </h1>
                    <p className="text-slate-500 font-medium ml-11">
                        {orders.filter(o => o.status === 'pending').length} new ·{' '}
                        {orders.filter(o => o.status === 'preparing').length} preparing ·{' '}
                        {orders.filter(o => o.status === 'ready').length} ready
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => fetchOrders(true)}
                    disabled={refreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* 3-column Kanban board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {columns.map(col => {
                    const ColIcon = col.icon;
                    const colOrders = orders.filter(o => o.status === col.status);
                    return (
                        <div key={col.status} className="flex flex-col gap-3">
                            {/* Column header */}
                            <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-white ${col.headerColor}`}>
                                <span className="font-bold flex items-center gap-2">
                                    <ColIcon className="w-4 h-4" />
                                    {col.label}
                                </span>
                                <span className="bg-white/30 text-white text-xs font-black px-2 py-0.5 rounded-full">
                                    {colOrders.length}
                                </span>
                            </div>

                            {/* Cards */}
                            {colOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                                    <ColIcon className="w-8 h-8 mb-2 opacity-40" />
                                    <p className="text-sm font-medium">No orders</p>
                                </div>
                            ) : (
                                colOrders.map(order => (
                                    <KOTCard
                                        key={order.id}
                                        order={order}
                                        nextStatus={col.nextStatus}
                                        nextLabel={col.nextLabel}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
