import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MenuGrid from '@/components/pos/MenuGrid';
import Cart from '@/components/pos/Cart';
import { useCart } from '@/store/useCart';
import { ShoppingCart, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function MenuPage() {
    const [searchParams] = useSearchParams();
    const { setTableId, items, total } = useCart();
    const tableNumber = searchParams.get('table');
    const [cartOpen, setCartOpen] = useState(false);

    useEffect(() => {
        if (tableNumber) {
            setTableId(tableNumber);
        }
    }, [tableNumber, setTableId]);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <div className="flex h-full overflow-hidden relative">
            {/* Menu Section */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-0">
                <MenuGrid />
            </div>

            {/* Cart Sidebar - Desktop only */}
            <div className="hidden lg:block w-[400px] border-l border-slate-200 bg-white overflow-y-auto no-scrollbar">
                <Cart />
            </div>

            {/* Mobile: Floating Cart Button (only when items in cart) */}
            {totalItems > 0 && (
                <button
                    onClick={() => setCartOpen(true)}
                    className="lg:hidden fixed bottom-24 right-4 z-30 flex items-center gap-3 bg-primary text-white pl-4 pr-5 py-3 rounded-2xl shadow-2xl shadow-primary/40 hover:bg-primary/90 transition-all active:scale-95"
                >
                    <div className="relative">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                            {totalItems}
                        </span>
                    </div>
                    <span className="font-bold text-sm">View Cart</span>
                    <span className="font-black text-sm">· {formatCurrency(total())}</span>
                </button>
            )}

            {/* Mobile: Cart Overlay */}
            {cartOpen && (
                <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setCartOpen(false)}
                    />

                    {/* Cart Sheet */}
                    <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                        {/* Handle */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100">
                            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-primary" />
                                Your Cart
                            </h2>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 no-scrollbar">
                            <Cart />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
