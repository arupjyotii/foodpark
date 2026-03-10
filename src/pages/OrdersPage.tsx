import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { generateInvoicePDF } from '@/lib/billing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Receipt, Clock, CheckCircle2, ChefHat, XCircle, Loader2, TrendingUp, IndianRupee, ShoppingBag, RefreshCw, Printer, X, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { format, startOfDay, subDays } from 'date-fns';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useSettings } from '@/store/useSettings';
import { useAuth } from '@/store/useAuth';

interface OrderItem {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    menu_item: { name: string } | null;
}

interface OrderWithItems {
    id: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    created_at: string;
    table: { number: string } | null;
    waiter: { full_name: string } | null;
    order_items: OrderItem[];
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    pending: { label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200' },
    preparing: { label: 'Preparing', icon: ChefHat, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    ready: { label: 'Ready', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-200' },
    served: { label: 'Served', icon: CheckCircle2, color: 'bg-slate-100 text-slate-700 border-slate-200' },
    paid: { label: 'Paid', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
};

function formatAxisCurrency(value: number) {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${(value / 100).toFixed(0)}`;
}

// ---- Payment Method Dialog ----
type PayMethod = 'cash' | 'card' | 'upi';
const PAY_META: { method: PayMethod; label: string; icon: typeof Banknote; color: string }[] = [
    { method: 'cash', label: 'Cash', icon: Banknote, color: 'border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500' },
    { method: 'card', label: 'Card', icon: CreditCard, color: 'border-blue-300 hover:bg-blue-50 hover:border-blue-500' },
    { method: 'upi', label: 'UPI', icon: Smartphone, color: 'border-violet-300 hover:bg-violet-50 hover:border-violet-500' },
];

function PaymentDialog({
    order,
    onConfirm,
    onClose,
    paying,
}: {
    order: OrderWithItems;
    onConfirm: (method: PayMethod) => void;
    onClose: () => void;
    paying: boolean;
}) {
    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm rounded-2xl border-none p-0 overflow-hidden">
                <div className="bg-primary text-white px-6 py-5">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Settle Payment
                    </h2>
                    <p className="text-white/70 text-sm mt-0.5">
                        {order.table?.number ?? '—'} &middot; {formatCurrency(order.total_amount)}
                    </p>
                </div>
                <div className="p-5 space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Payment Method</p>
                    <div className="grid grid-cols-3 gap-3">
                        {PAY_META.map(({ method, label, icon: Icon, color }) => (
                            <button
                                key={method}
                                disabled={paying}
                                onClick={() => onConfirm(method)}
                                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${color} disabled:opacity-50`}
                            >
                                {paying ? <Loader2 className="w-6 h-6 animate-spin" /> : <Icon className="w-6 h-6" />}
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <X className="w-4 h-4" /> Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ---- Bill Dialog Component ----
function BillDialog({ order, onClose }: { order: OrderWithItems; onClose: () => void }) {
    const cfg = statusConfig[order.status] ?? statusConfig.pending;
    const Icon = cfg.icon;
    const settings = useSettings();
    const currentUser = useAuth(s => s.user);

    const handlePrint = () => {
        const doc = generateInvoicePDF({
            order: order as any,
            items: order.order_items as any,
            restaurantName: settings.restaurantName,
            tableNumber: order.table?.number ?? '—',
            address: settings.address,
            phone: settings.phone,
            gstin: settings.gstin,
            receiptFooter: settings.receiptFooter,
            taxRate: settings.taxRate,
            billerName: currentUser?.full_name || currentUser?.email,
        });
        doc.save(`bill-T${order.table?.number}-${order.id.slice(0, 8)}.pdf`);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 border-none overflow-hidden rounded-2xl">
                {/* Header */}
                <div className="bg-primary text-white p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black flex items-center gap-2">
                                <Receipt className="w-5 h-5" />
                                Bill #{order.id.slice(0, 8).toUpperCase()}
                            </h2>
                            <p className="text-white/70 text-sm mt-1">
                                {order.table?.number ?? '—'} · {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                            </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                        </span>
                    </div>
                </div>

                {/* Items */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b">
                            <span>Item</span>
                            <div className="flex gap-8">
                                <span>Qty</span>
                                <span>Amount</span>
                            </div>
                        </div>
                        {order.order_items.map(item => (
                            <div key={item.id} className="flex justify-between items-center">
                                <span className="text-sm text-slate-700 font-medium">{item.menu_item?.name ?? 'Unknown'}</span>
                                <div className="flex gap-8 text-sm">
                                    <span className="text-slate-500 w-6 text-center">{item.quantity}</span>
                                    <span className="font-bold text-slate-800 w-20 text-right">{formatCurrency(item.total_price)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Tax ({settings.taxRate}%)</span>
                            <span>{formatCurrency(order.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t">
                            <span>TOTAL</span>
                            <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                    </div>

                    {/* Waiter info */}
                    {order.waiter?.full_name && (
                        <p className="text-xs text-slate-400 text-center">Served by: {order.waiter.full_name}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" /> Close
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Printer className="w-4 h-4" /> Print Bill
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ---- Main Page ----
export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
    const [paymentTarget, setPaymentTarget] = useState<OrderWithItems | null>(null);
    const [paying, setPaying] = useState(false);

    const settings = useSettings();
    const currentUser = useAuth(s => s.user);

    const fetchOrders = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);

        const { data, error } = await supabase
            .from('orders')
            .select(`
                id, status, subtotal, tax_amount, total_amount, created_at,
                table:tables(number),
                waiter:profiles(full_name),
                order_items(id, quantity, unit_price, total_price, menu_item:menu_items(name))
            `)
            .order('created_at', { ascending: false });

        if (!error) {
            setOrders((data as unknown as OrderWithItems[]) || []);
            setLastRefresh(new Date());
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => fetchOrders(), 30000);

        const channel = supabase
            .channel('orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [fetchOrders]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        fetchOrders();
    };

    const handlePay = async (method: PayMethod) => {
        if (!paymentTarget) return;
        setPaying(true);
        try {
            const orderId = paymentTarget.id;

            // 1. Record the transaction with payment method
            await supabase.from('transactions').insert({
                order_id: orderId,
                amount: paymentTarget.total_amount,
                payment_method: method,
                status: 'success',
            });

            // 2. Mark order as paid
            await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);

            // 3. Free the table
            const { data: tableData } = await supabase
                .from('orders').select('table_id').eq('id', orderId).single();
            if (tableData?.table_id) {
                await supabase.from('tables')
                    .update({ status: 'available' })
                    .eq('id', tableData.table_id);
            }

            // 4. Auto-print the bill
            const methodLabel = { cash: 'Cash', card: 'Card', upi: 'UPI' }[method];
            const doc = generateInvoicePDF({
                order: paymentTarget as any,
                items: paymentTarget.order_items as any,
                restaurantName: settings.restaurantName,
                tableNumber: paymentTarget.table?.number ?? '—',
                address: settings.address,
                phone: settings.phone,
                gstin: settings.gstin,
                receiptFooter: settings.receiptFooter,
                taxRate: settings.taxRate,
                billerName: `${currentUser?.full_name || currentUser?.email || 'Staff'} (${methodLabel})`,
            });
            doc.save(`bill-${paymentTarget.table?.number ?? 'T'}-${orderId.slice(0, 8)}.pdf`);

            setPaymentTarget(null);
            fetchOrders();
        } finally {
            setPaying(false);
        }
    };

    // Analytics
    const today = startOfDay(new Date());
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    const todayRevenue = todayOrders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0);
    const todayBills = todayOrders.filter(o => o.status === 'paid').length;
    const activeOrders = orders.filter(o => !['paid', 'cancelled'].includes(o.status)).length;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const day = subDays(new Date(), 6 - i);
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        const paid = orders.filter(o => o.status === 'paid' && new Date(o.created_at) >= dayStart && new Date(o.created_at) < dayEnd);
        return { day: format(day, 'EEE'), revenue: paid.reduce((s, o) => s + o.total_amount, 0), bills: paid.length };
    });

    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    // Analytics visible only to roles with canManageStaff (owner, manager) — driven by settings
    const canViewAnalytics = settings.permissions?.[currentUser?.role ?? '']?.canManageStaff ?? false;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="font-medium">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">

            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Receipt className="w-7 h-7 text-primary" />
                        Orders & Billing
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {orders.length} total · Last updated {format(lastRefresh, 'hh:mm:ss a')}
                    </p>
                </div>
                <button
                    onClick={() => fetchOrders(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-xl disabled:opacity-60"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Stat Cards — owner/manager only */}
            {canViewAnalytics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <CardContent className="p-5">
                            <IndianRupee className="w-8 h-8 mb-3 opacity-80" />
                            <p className="text-sm font-medium opacity-80">Today's Revenue</p>
                            <p className="text-2xl font-black mt-1">{formatCurrency(todayRevenue)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-5">
                            <Receipt className="w-8 h-8 mb-3 opacity-80" />
                            <p className="text-sm font-medium opacity-80">Bills Settled</p>
                            <p className="text-2xl font-black mt-1">{todayBills}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                        <CardContent className="p-5">
                            <ShoppingBag className="w-8 h-8 mb-3 opacity-80" />
                            <p className="text-sm font-medium opacity-80">Active Orders</p>
                            <p className="text-2xl font-black mt-1">{activeOrders}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-gradient-to-br from-primary to-violet-600 text-white">
                        <CardContent className="p-5">
                            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
                            <p className="text-sm font-medium opacity-80">Avg Bill Size</p>
                            <p className="text-2xl font-black mt-1">{todayBills > 0 ? formatCurrency(todayRevenue / todayBills) : '—'}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts — owner/manager only */}
            {canViewAnalytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />Revenue – Last 7 Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={last7Days} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={formatAxisCurrency} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(val: number | undefined) => [val != null ? formatCurrency(val) : '—', 'Revenue']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-emerald-500" />Bills Settled – Last 7 Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={last7Days} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(val: number | undefined) => [val ?? 0, 'Bills']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="bills" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${filter === s ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                            }`}>
                        {s}{s !== 'all' && ` (${orders.filter(o => o.status === s).length})`}
                    </button>
                ))}
            </div>

            {/* Orders Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Receipt className="w-16 h-16 mb-4 opacity-30" />
                    <h3 className="font-bold text-lg">No orders found</h3>
                    <p className="text-sm mt-1">Orders placed from the POS will appear here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(order => {
                        const cfg = statusConfig[order.status] ?? statusConfig.pending;
                        const Icon = cfg.icon;
                        return (
                            <Card key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="shadow-sm hover:shadow-lg transition-all border cursor-pointer hover:border-primary/30 hover:-translate-y-0.5">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <CardTitle className="text-lg font-black">{order.table?.number ?? '—'}</CardTitle>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {order.waiter?.full_name ?? 'Unknown'} · {format(new Date(order.created_at), 'dd MMM, hh:mm a')}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                                            <Icon className="w-3 h-3" />{cfg.label}
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <div className="space-y-1">
                                        {order.order_items.slice(0, 3).map(item => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-slate-600"><span className="font-bold text-primary">{item.quantity}×</span> {item.menu_item?.name ?? '—'}</span>
                                                <span className="font-medium">{formatCurrency(item.total_price)}</span>
                                            </div>
                                        ))}
                                        {order.order_items.length > 3 && (
                                            <p className="text-xs text-slate-400">+{order.order_items.length - 3} more items</p>
                                        )}
                                    </div>

                                    <div className="flex justify-between font-black text-slate-900 text-base pt-3 border-t">
                                        <span>Total</span>
                                        <span>{formatCurrency(order.total_amount)}</span>
                                    </div>

                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                        {order.status === 'ready' && (
                                            <button onClick={() => handleStatusChange(order.id, 'served')}
                                                className="flex-1 text-xs font-bold py-2 rounded-xl bg-slate-500 text-white hover:bg-slate-600 transition-colors">
                                                Mark Served
                                            </button>
                                        )}
                                        {order.status === 'served' && (
                                            <button
                                                onClick={() => setPaymentTarget(order)}
                                                className="flex-1 text-xs font-bold py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5">
                                                <IndianRupee className="w-3.5 h-3.5" /> Settle Payment
                                            </button>
                                        )}
                                        {!['paid', 'cancelled', 'served'].includes(order.status) && (
                                            <button onClick={() => handleStatusChange(order.id, 'cancelled')}
                                                className="px-3 text-xs font-bold py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                                                Cancel
                                            </button>
                                        )}
                                        {['pending', 'preparing'].includes(order.status) && (
                                            <span className="flex-1 text-center text-xs text-slate-400 py-2 italic">
                                                Kitchen handling via KOT
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-center text-slate-400">Tap card to view full bill</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Bill Dialog */}
            {selectedOrder && (
                <BillDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}

            {/* Payment Method Dialog */}
            {paymentTarget && (
                <PaymentDialog
                    order={paymentTarget}
                    onConfirm={handlePay}
                    onClose={() => setPaymentTarget(null)}
                    paying={paying}
                />
            )}
        </div>
    );
}
