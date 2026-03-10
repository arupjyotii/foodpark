import { useState, useEffect, useMemo } from 'react';
import { Search, Bookmark } from 'lucide-react';
import { useMenu } from '@/store/useMenu';
import MenuItemCard from './MenuItemCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function MenuGrid() {
    const { categories, items, loading, fetchMenu } = useMenu();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.description?.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory ? item.category_id === activeCategory : true;
            return matchesSearch && matchesCategory;
        });
    }, [items, search, activeCategory]);

    if (loading && items.length === 0) {
        return (
            <div className="p-6 space-y-8">
                <div className="h-10 w-full max-w-sm bg-slate-100 rounded-xl" />
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search menu items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-12 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-primary/20"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    <Button
                        variant={activeCategory === null ? 'default' : 'outline'}
                        onClick={() => setActiveCategory(null)}
                        className="rounded-full px-6 h-10 font-bold whitespace-nowrap"
                    >
                        All Items
                    </Button>
                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={activeCategory === cat.id ? 'default' : 'outline'}
                            onClick={() => setActiveCategory(cat.id)}
                            className="rounded-full px-6 h-10 font-bold whitespace-nowrap"
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {filteredItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <Bookmark className="w-12 h-12 text-slate-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">No items found</h3>
                    <p className="text-slate-400">Try adjusting your search or category filter</p>
                </div>
            )}
        </div>
    );
}
