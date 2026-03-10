import { useNavigate } from 'react-router-dom';
import { Users, Timer, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Table } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

interface TableCardProps {
    table: Table;
    onSelect: (table: Table) => void;
}

const statusConfig = {
    available: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        indicator: 'bg-emerald-500',
        label: 'Available'
    },
    occupied: {
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        indicator: 'bg-rose-500',
        label: 'Occupied'
    },
    reserved: {
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        indicator: 'bg-amber-500',
        label: 'Reserved'
    },
    cleaning: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        indicator: 'bg-blue-500',
        label: 'Cleaning'
    }
};

export default function TableCard({ table, onSelect }: TableCardProps) {
    const navigate = useNavigate();
    const config = statusConfig[table.status];

    const handleClick = () => {
        if (table.status === 'occupied') {
            onSelect(table);
        } else {
            navigate(`/orders/new?table=${table.id}`);
        }
    };

    return (
        <Card
            onClick={handleClick}
            className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 border-2",
                config.color
            )}
        >
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <span className="text-3xl font-black">{table.number}</span>
                        <div className="flex items-center gap-1 mt-1 opacity-80">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-widest">{table.capacity} Seats</span>
                        </div>
                    </div>
                    <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border", config.color, "bg-white/50")}>
                        {table.status}
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    {table.status === 'occupied' ? (
                        <div className="flex items-center gap-2 text-rose-600">
                            <Timer className="w-4 h-4" />
                            <span className="text-sm font-bold">45m active</span>
                        </div>
                    ) : (
                        <div className="h-5"></div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", config.indicator)} />
                            <span className="text-xs font-semibold">{config.label}</span>
                        </div>
                        {table.status === 'occupied' && (
                            <Receipt className="w-4 h-4 opacity-40" />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
