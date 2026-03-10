import { useEffect } from 'react';
import { useInventory } from '@/store/useInventory';
import IngredientList from '@/components/inventory/IngredientList';
import SupplierList from '@/components/inventory/SupplierList';
import StockMovementLog from '@/components/inventory/StockMovementLog';
import RecipeManagement from '@/components/inventory/RecipeManagement';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, Package, Users, History, Utensils } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InventoryPage() {
    const { fetchIngredients, fetchSuppliers, loading, ingredients, suppliers } = useInventory();

    useEffect(() => {
        fetchIngredients();
        fetchSuppliers();
    }, [fetchIngredients, fetchSuppliers]);

    const lowStockItems = ingredients.filter(item => item.current_stock <= item.min_stock_level);

    if (loading && ingredients.length === 0) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
                    <p className="text-slate-500">Track stock levels, suppliers, and movements.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Ingredients</CardTitle>
                        <Package className="w-4 h-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ingredients.length}</div>
                    </CardContent>
                </Card>
                <Card className={lowStockItems.length > 0 ? "border-amber-200 bg-amber-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                        <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? "text-amber-500" : "text-slate-500"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${lowStockItems.length > 0 ? "text-amber-600" : ""}`}>
                            {lowStockItems.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                        <Users className="w-4 h-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{suppliers.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="ingredients" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="ingredients" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Ingredients
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Suppliers
                    </TabsTrigger>
                    <TabsTrigger value="movements" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Movements
                    </TabsTrigger>
                    <TabsTrigger value="recipes" className="flex items-center gap-2">
                        <Utensils className="w-4 h-4" />
                        Recipes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ingredients" className="space-y-4">
                    <IngredientList />
                </TabsContent>

                <TabsContent value="suppliers">
                    <SupplierList />
                </TabsContent>

                <TabsContent value="movements">
                    <StockMovementLog />
                </TabsContent>

                <TabsContent value="recipes">
                    <RecipeManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}
