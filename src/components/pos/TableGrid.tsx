import { useState, useEffect } from 'react';
import { useTables } from '@/store/useTables';
import { supabase } from '@/lib/supabase';
import TableCard from './TableCard';
import OrderSummary from './OrderSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { Grid2X2, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Table } from '@/types';

export default function TableGrid() {
    const { tables, loading, fetchTables, subscribeToTables } = useTables();
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchTables();
        setTimeout(() => setRefreshing(false), 600);
    };

    useEffect(() => {
        fetchTables();
        const unsubscribe = subscribeToTables();

        // 2-minute auto-clean: reset 'cleaning' tables to 'available'
        const cleanInterval = setInterval(async () => {
            const { data: cleaningTables } = await supabase
                .from('tables')
                .select('id')
                .eq('status', 'cleaning');
            if (cleaningTables && cleaningTables.length > 0) {
                await supabase
                    .from('tables')
                    .update({ status: 'available' })
                    .in('id', cleaningTables.map(t => t.id));
                fetchTables();
            }
        }, 120000);

        return () => {
            unsubscribe();
            clearInterval(cleanInterval);
        };
    }, [fetchTables, subscribeToTables]);

    if (loading && tables.length === 0) {
        return (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="bg-primary text-white p-2 rounded-xl">
                            <Grid2X2 className="w-6 h-6" />
                        </div>
                        Floor Plan
                    </h1>
                    <p className="text-slate-500 font-medium ml-11">Manage guest seating and active tables</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search table number..."
                            className="pl-10 h-11 border-slate-200 bg-white"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0 border-slate-200 bg-white"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        title="Refresh tables"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {tables.map((table) => (
                    <TableCard
                        key={table.id}
                        table={table}
                        onSelect={(t) => setSelectedTable(t)}
                    />
                ))}
                {tables.length === 0 && !loading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <Grid2X2 className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">No tables found</h3>
                        <p className="text-slate-400">Add tables in the management settings</p>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
                <DialogContent className="sm:max-w-max p-0 border-none bg-transparent shadow-none">
                    {selectedTable && (
                        <OrderSummary
                            tableId={selectedTable.id}
                            tableNumber={selectedTable.number}
                            onClose={() => setSelectedTable(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
