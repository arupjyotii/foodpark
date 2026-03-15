import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/useAuth';
import { useCart } from '@/store/useCart';
import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { printKOT } from '@/lib/billing';
import { useSettings } from '@/store/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default function Cart() {
    const { items, updateQuantity, removeItem, clearCart, subtotal, tax, total, tableId, tableName } = useCart();
    const settings = useSettings();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isPlacing, setIsPlacing] = useState(false);

    const handlePlaceOrder = async () => {
        if (!user || items.length === 0) return;
        setIsPlacing(true);

        try {
            // 1. Create the order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    table_id: tableId,
                    waiter_id: user.id,
                    status: 'pending',
                    subtotal: subtotal(),
                    tax_amount: tax(),
                    total_amount: total(),
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create order items
            const orderItems = items.map((item) => ({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity,
                notes: item.notes,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Auto-print KOT for kitchen
            const { data: tableRow } = await supabase
                .from('tables')
                .select('number')
                .eq('id', tableId ?? '')
                .single();

            printKOT({
                orderId: order.id,
                tableNumber: tableRow?.number ?? '?',
                waiterName: user.full_name,
                createdAt: order.created_at,
                items: items.map(i => ({ name: i.name, quantity: i.quantity, notes: i.notes })),
            });

            // 4. Update table status to occupied
            if (tableId) {
                await supabase
                    .from('tables')
                    .update({ status: 'occupied' })
                    .eq('id', tableId);
            }

            clearCart();
            navigate('/');
        } catch (error) {
            console.error('Failed to place order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setIsPlacing(false);
        }
    };

    if (items.length === 0) {
        return (
            <Card className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 border-dashed border-2">
                <div className="bg-slate-100 p-6 rounded-full mb-6 text-slate-300">
                    <ShoppingCart className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-400">Your cart is empty</h3>
                <p className="text-slate-400 text-center mt-2 max-w-[200px]">
                    Add delicious items from the menu to start an order
                </p>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col shadow-2xl border-none">
            <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-primary" />
                        Current Order
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={clearCart} className="text-slate-400 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                {tableId && (
                    <div className="mt-2 inline-flex bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        🪑 {tableName ?? tableId}
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">
                                    {item.name[0]}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                            <p className="text-sm font-black text-primary mt-1">{formatCurrency(item.price)}</p>

                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-slate-300 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>

            <CardFooter className="flex flex-col border-t border-slate-100 p-6 bg-slate-50/50">
                <div className="w-full space-y-3 mb-6">
                    <div className="flex justify-between items-center text-slate-500 font-medium">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal())}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 font-medium text-sm">
                        <span>Taxes & Charges ({settings.taxRate}%)</span>
                        <span>{formatCurrency(tax())}</span>
                    </div>
                    <div className="flex justify-between items-center text-2xl font-black text-slate-900 pt-3 border-t border-slate-200">
                        <span>Total</span>
                        <span>{formatCurrency(total())}</span>
                    </div>
                </div>

                <Button
                    className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-xl shadow-primary/20"
                    onClick={handlePlaceOrder}
                    disabled={isPlacing}
                >
                    {isPlacing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Place Order
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
