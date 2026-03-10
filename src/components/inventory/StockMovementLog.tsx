import { useEffect } from 'react';
import { useInventory } from '@/store/useInventory';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Recycle, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StockMovementLog() {
    const { movements, fetchMovements, loading } = useInventory();

    useEffect(() => {
        fetchMovements();
    }, [fetchMovements]);

    const getIconAndColor = (type: string) => {
        switch (type) {
            case 'in':
                return { icon: ArrowDownRight, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' };
            case 'out':
                return { icon: ArrowUpRight, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' };
            case 'waste':
                return { icon: Recycle, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200' };
            case 'adjustment':
                return { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' };
            default:
                return { icon: ArrowDownRight, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' };
        }
    };

    return (
        <Card className="border-slate-200">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Ingredient</th>
                                <th className="px-6 py-4 font-medium">Quantity</th>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {movements.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        {loading ? 'Loading movements...' : 'No stock movements logged yet.'}
                                    </td>
                                </tr>
                            ) : (
                                movements.map((movement) => {
                                    const { icon: Icon, color, bg } = getIconAndColor(movement.type);
                                    return (
                                        <tr key={movement.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                {format(new Date(movement.created_at!), 'MMM d, yyyy HH:mm')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`font-medium ${bg} ${color}`}>
                                                    <Icon className="w-3 h-3 mr-1" />
                                                    {movement.type.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {movement.ingredient?.name || 'Unknown Item'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-medium ${color}`}>
                                                    {movement.type === 'in' || (movement.type === 'adjustment' && movement.quantity > 0) ? '+' : ''}
                                                    {movement.type === 'out' || movement.type === 'waste' ? '-' : ''}
                                                    {Math.abs(movement.quantity)} {movement.ingredient?.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {movement.user?.full_name || movement.user?.email || 'System'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate" title={movement.notes}>
                                                {movement.notes || '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
