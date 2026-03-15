import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useActiveOrder } from '@/hooks/useActiveOrder';
import { formatCurrency } from '@/lib/utils';
import { generateInvoicePDF } from '@/lib/billing';
import { UtensilsCrossed, Printer, X } from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import { useAuth } from '@/store/useAuth';

interface OrderSummaryProps {
    tableId: string;
    tableNumber: string;
    onClose: () => void;
}

export default function OrderSummary({ tableId, tableNumber, onClose }: OrderSummaryProps) {
    const { order, items, loading } = useActiveOrder(tableId);
    const settings = useSettings();
    const currentUser = useAuth(s => s.user);

    if (loading) return <div className="p-8 text-center animate-pulse">Loading order details...</div>;
    if (!order) return (
        <Card className="w-full max-w-lg mx-auto shadow-2xl border-none overflow-hidden">
            <CardHeader className="bg-primary text-white p-6">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <UtensilsCrossed className="w-8 h-8" />
                    {tableNumber}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center text-slate-500">
                <p className="font-medium">No active order for this table.</p>
                <Button variant="outline" className="mt-4" onClick={onClose}>Close</Button>
            </CardContent>
        </Card>
    );

    const handlePrint = async () => {
        const doc = await generateInvoicePDF({
            order,
            items,
            restaurantName: settings.restaurantName,
            tableNumber,
            address: settings.address,
            phone: settings.phone,
            gstin: settings.gstin,
            receiptFooter: settings.receiptFooter,
            billerName: currentUser?.full_name || currentUser?.email,
            taxRate: settings.taxRate,
        });
        doc.save(`bill-${tableNumber}-${order.id.slice(0, 8)}.pdf`);
    };

    return (
        <Card className="w-full max-w-lg mx-auto shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-primary text-white p-6">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                        <UtensilsCrossed className="w-8 h-8" />
                        {tableNumber}
                    </CardTitle>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Active Order
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Items */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Order Items</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800">{item.menu_item.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {item.quantity} × {formatCurrency(item.unit_price)}
                                    </p>
                                </div>
                                <span className="font-bold text-slate-900">{formatCurrency(item.total_price)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="flex justify-between text-slate-500 font-medium">
                        <span>Subtotal</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                        <span>Taxes & Charges ({settings.taxRate}%)</span>
                        <span>{formatCurrency(order.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between text-3xl font-black text-slate-900 pt-2 border-t border-slate-100">
                        <span>Total</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                </div>

                {/* Hint */}
                <p className="text-xs text-slate-400 text-center bg-slate-50 rounded-xl py-2 px-3">
                    Go to <span className="font-bold text-primary">Orders</span> tab to settle payment
                </p>
            </CardContent>

            <CardFooter className="bg-slate-50 p-6 flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-2 border-slate-200 gap-2 font-bold"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                    Close
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-2 border-slate-200 gap-2 font-bold"
                    onClick={handlePrint}
                >
                    <Printer className="w-5 h-5" />
                    Print Bill
                </Button>
            </CardFooter>
        </Card>
    );
}
