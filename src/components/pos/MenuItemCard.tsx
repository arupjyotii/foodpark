import { Plus, Leaf } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/types';
import { useCart } from '@/store/useCart';
import { cn } from '@/lib/utils';

interface MenuItemCardProps {
    item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
    const { addItem, items } = useCart();
    const cartItem = items.find(i => i.id === item.id);
    const qty = cartItem?.quantity ?? 0;

    return (
        <div
            className={cn(
                'relative flex flex-col w-full rounded-2xl border-2 overflow-hidden transition-all duration-200 group bg-white',
                item.is_available
                    ? 'border-slate-100 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10'
                    : 'border-slate-100 bg-slate-50 opacity-50',
                qty > 0 && 'border-primary/30 shadow-md shadow-primary/10'
            )}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shrink-0">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-black text-slate-300 select-none">
                            {item.name[0]}
                        </span>
                    </div>
                )}

                {/* Veg / Non-veg badges top-left */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {item.is_vegetarian && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                            <Leaf className="w-3 h-3 text-white" />
                        </span>
                    )}
                    {item.is_spicy && (
                        <span className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center shadow" title="Non Veg">
                            <span className="w-2.5 h-2.5 rounded-full bg-white" />
                        </span>
                    )}
                </div>

                {/* Cart qty badge top-right */}
                {qty > 0 && (
                    <span className="absolute top-2 right-2 bg-primary text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                        {qty}
                    </span>
                )}

                {!item.is_available && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border">Unavailable</span>
                    </div>
                )}
            </div>

            {/* Name */}
            <div className="px-2.5 pt-2 pb-1.5 flex-1">
                <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.name}
                </p>
            </div>

            {/* Bottom Add button with price */}
            <button
                onClick={() => addItem(item)}
                disabled={!item.is_available}
                className={cn(
                    'w-full flex items-center justify-between px-3 py-2 transition-all duration-200 active:scale-95',
                    item.is_available
                        ? 'bg-primary hover:bg-primary/90 cursor-pointer'
                        : 'bg-slate-200 cursor-not-allowed',
                )}
            >
                <span className="text-white font-black text-sm">{formatCurrency(item.price)}</span>
                <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                </span>
            </button>
        </div>
    );
}
