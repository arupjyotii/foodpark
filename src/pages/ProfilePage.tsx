import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/useAuth';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import {
    User, ShoppingBag, Receipt, TrendingUp,
    Banknote, CreditCard, Smartphone, Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
    ordersCreated: number;       // for waiters
    billsSettled: number;        // for cashier/manager/owner
    totalRevenue: number;        // for cashier/manager/owner
    cashCount: number;
    cardCount: number;
    upiCount: number;
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner',
    manager: 'Manager',
    cashier: 'Cashier',
    waiter: 'Waiter',
    kitchen: 'Kitchen Staff',
};

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-violet-100 text-violet-700',
    manager: 'bg-blue-100 text-blue-700',
    cashier: 'bg-emerald-100 text-emerald-700',
    waiter: 'bg-amber-100 text-amber-700',
    kitchen: 'bg-rose-100 text-rose-700',
};

export default function ProfilePage() {
    const user = useAuth(s => s.user);
    const [stats, setStats] = useState<Stats>({
        ordersCreated: 0, billsSettled: 0, totalRevenue: 0,
        cashCount: 0, cardCount: 0, upiCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchStats = async () => {
            setLoading(true);

            // Waiter: orders they created
            if (user.role === 'waiter') {
                const { count } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('waiter_id', user.id);
                setStats(s => ({ ...s, ordersCreated: count ?? 0 }));
            }

            // Cashier / manager / owner: bills settled (transactions) where biller = current user
            // We approximate by counting transactions recorded — since all transactions go through one cashier
            // The transactions table doesn't store biller_id yet, so we count global paid orders for now
            if (['cashier', 'manager', 'owner'].includes(user.role)) {
                const { data: txs } = await supabase
                    .from('transactions')
                    .select('amount, payment_method')
                    .eq('status', 'success');

                if (txs) {
                    const revenue = txs.reduce((s, t) => s + (t.amount ?? 0), 0);
                    setStats(s => ({
                        ...s,
                        billsSettled: txs.length,
                        totalRevenue: revenue,
                        cashCount: txs.filter(t => t.payment_method === 'cash').length,
                        cardCount: txs.filter(t => t.payment_method === 'card').length,
                        upiCount: txs.filter(t => t.payment_method === 'upi').length,
                    }));
                }
            }

            setLoading(false);
        };
        fetchStats();
    }, [user]);

    if (!user) return null;

    const isWaiter = user.role === 'waiter';
    const isBiller = ['cashier', 'manager', 'owner'].includes(user.role);
    const roleColor = ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700';
    const initials = user.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Profile Card */}
            <Card className="border-none shadow-md overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary to-violet-500" />
                <CardContent className="pt-0 pb-6 px-6 -mt-12">
                    <div className="flex items-end gap-4 mb-4">
                        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center">
                            <span className="text-2xl font-black text-primary">{initials}</span>
                        </div>
                        <div className="mb-2">
                            <h1 className="text-xl font-black text-white">{user.full_name}</h1>
                            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full capitalize ${roleColor}`}>
                                {ROLE_LABELS[user.role] ?? user.role}
                            </span>
                        </div>
                    </div>

                    {/* Read-only fields */}
                    <div className="space-y-3 border-t pt-4">
                        <InfoRow icon={User} label="Name" value={user.full_name} />
                        <InfoRow icon={Receipt} label="Email" value={user.email} />
                        <InfoRow icon={Calendar} label="Joined" value={format(new Date(user.created_at), 'dd MMM yyyy')} />
                        <InfoRow
                            icon={ShoppingBag}
                            label="Status"
                            value={user.is_active ? 'Active' : 'Inactive'}
                            valueClass={user.is_active ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Activity Stats */}
            {loading ? (
                <div className="grid grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Waiter Stats */}
                    {isWaiter && (
                        <Card className="border-none shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <StatBig
                                    icon={ShoppingBag}
                                    color="bg-amber-500"
                                    label="Orders Taken"
                                    value={stats.ordersCreated}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Biller Stats */}
                    {isBiller && (
                        <div className="space-y-4">
                            <Card className="border-none shadow-md">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Billing Activity</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <StatBig
                                            icon={Receipt}
                                            color="bg-emerald-500"
                                            label="Bills Settled"
                                            value={stats.billsSettled}
                                        />
                                        <StatBig
                                            icon={TrendingUp}
                                            color="bg-primary"
                                            label="Total Revenue"
                                            value={formatCurrency(stats.totalRevenue)}
                                            isText
                                        />
                                    </div>

                                    {/* Payment method breakdown */}
                                    <div className="border-t pt-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">By Payment Method</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <MethodStat icon={Banknote} label="Cash" count={stats.cashCount} color="text-emerald-600 bg-emerald-50" />
                                            <MethodStat icon={CreditCard} label="Card" count={stats.cardCount} color="text-blue-600 bg-blue-50" />
                                            <MethodStat icon={Smartphone} label="UPI" count={stats.upiCount} color="text-violet-600 bg-violet-50" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── Helper sub-components ─────────────────────────────────────── */

function InfoRow({
    icon: Icon, label, value, valueClass = 'text-slate-700',
}: { icon: typeof User; label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">{label}</span>
                <span className={`text-sm ${valueClass}`}>{value}</span>
            </div>
        </div>
    );
}

function StatBig({
    icon: Icon, color, label, value, isText = false,
}: { icon: typeof Receipt; color: string; label: string; value: string | number; isText?: boolean }) {
    return (
        <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`font-black ${isText ? 'text-base' : 'text-2xl'} text-slate-900`}>{value}</p>
            </div>
        </div>
    );
}

function MethodStat({
    icon: Icon, label, count, color,
}: { icon: typeof Banknote; label: string; count: number; color: string }) {
    return (
        <div className={`rounded-xl p-3 ${color} flex flex-col items-center gap-1`}>
            <Icon className="w-5 h-5" />
            <span className="text-lg font-black">{count}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
        </div>
    );
}
