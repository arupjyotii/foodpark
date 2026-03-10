import React, { useState } from 'react';
import { useInventory } from '@/store/useInventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, AlertTriangle, MoreVertical, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function IngredientList() {
    const { ingredients, suppliers, addIngredient, loading } = useInventory();
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        current_stock: 0,
        min_stock_level: 0,
        cost_per_unit: 0,
        supplier_id: ''
    });

    const filteredIngredients = ingredients.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addIngredient({
            ...formData,
            current_stock: Number(formData.current_stock),
            min_stock_level: Number(formData.min_stock_level),
            cost_per_unit: Number(formData.cost_per_unit) * 100, // convert to paise
            supplier_id: formData.supplier_id || undefined
        });
        setIsAddOpen(false);
        setFormData({ name: '', unit: '', current_stock: 0, min_stock_level: 0, cost_per_unit: 0, supplier_id: '' });
    };

    return (
        <Card className="border-slate-200">
            <CardContent className="p-0">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search ingredients..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full md:w-auto">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Ingredient
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Ingredient</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Name</label>
                                        <Input
                                            placeholder="e.g., Basmati Rice"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Unit</label>
                                        <Input
                                            placeholder="e.g., kg, Ltr, Pkt"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cost/Unit</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.cost_per_unit}
                                            onChange={(e) => setFormData({ ...formData, cost_per_unit: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Initial Stock</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.current_stock}
                                            onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Min Stock Level</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.min_stock_level}
                                            onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Supplier</label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={formData.supplier_id}
                                            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                        >
                                            <option value="">Select a supplier (optional)</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Adding...' : 'Save Ingredient'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Ingredient</th>
                                <th className="px-6 py-4 font-medium">Current Stock</th>
                                <th className="px-6 py-4 font-medium">Unit</th>
                                <th className="px-6 py-4 font-medium">Supplier</th>
                                <th className="px-6 py-4 font-medium">Cost/Unit</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredIngredients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No ingredients found.
                                    </td>
                                </tr>
                            ) : (
                                filteredIngredients.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{item.name}</span>
                                                {item.current_stock <= item.min_stock_level && (
                                                    <Badge variant="outline" className="mt-1 w-fit border-amber-200 bg-amber-50 text-amber-700 font-medium">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Low Stock
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${item.current_stock <= item.min_stock_level ? "text-amber-600" : "text-slate-600"}`}>
                                                {item.current_stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{item.unit}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {suppliers.find(s => s.id === item.supplier_id)?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {formatCurrency(item.cost_per_unit || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => { }}>
                                                        <Edit2 className="w-4 h-4 mr-2" />
                                                        Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-primary">
                                                        Log Adjustment
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card >
    );
}
