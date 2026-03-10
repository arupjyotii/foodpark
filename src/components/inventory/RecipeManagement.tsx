import { useState, useEffect } from 'react';
import { useInventory } from '@/store/useInventory';
import { useMenu } from '@/store/useMenu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Utensils, AlertTriangle } from 'lucide-react';
import type { RecipeItem, Ingredient } from '@/types';

export default function RecipeManagement() {
    const { items: menuItems, fetchMenu } = useMenu();
    const { ingredients, getRecipe, addRecipeItem, removeRecipeItem } = useInventory();

    const [selectedMenuItem, setSelectedMenuItem] = useState<string>('');
    const [currentRecipe, setCurrentRecipe] = useState<(RecipeItem & { ingredient: Ingredient })[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state for adding an ingredient to the recipe
    const [selectedIngredient, setSelectedIngredient] = useState<string>('');
    const [quantityRequired, setQuantityRequired] = useState<string>('');

    useEffect(() => {
        if (menuItems.length === 0) {
            fetchMenu();
        }
    }, [menuItems.length, fetchMenu]);

    useEffect(() => {
        const loadRecipe = async () => {
            if (!selectedMenuItem) {
                setCurrentRecipe([]);
                return;
            }
            setLoading(true);
            const recipe = await getRecipe(selectedMenuItem);
            setCurrentRecipe(recipe);
            setLoading(false);
        };
        loadRecipe();
    }, [selectedMenuItem, getRecipe]);

    const handleAddIngredient = async () => {
        if (!selectedMenuItem || !selectedIngredient || !quantityRequired) return;

        setLoading(true);
        await addRecipeItem({
            menu_item_id: selectedMenuItem,
            ingredient_id: selectedIngredient,
            quantity: Number(quantityRequired)
        });

        // Refresh recipe
        const updatedRecipe = await getRecipe(selectedMenuItem);
        setCurrentRecipe(updatedRecipe);

        // Reset form
        setSelectedIngredient('');
        setQuantityRequired('');
        setLoading(false);
    };

    const handleRemoveIngredient = async (id: string) => {
        setLoading(true);
        await removeRecipeItem(id);
        const updatedRecipe = await getRecipe(selectedMenuItem);
        setCurrentRecipe(updatedRecipe);
        setLoading(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-slate-200 h-fit">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-primary" />
                        Select Menu Item
                    </CardTitle>
                    <CardDescription>
                        Choose a dish to manage its recipe and linked ingredients.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an item..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {menuItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg">Recipe Ingredients</CardTitle>
                    <CardDescription>
                        These ingredients will be automatically deducted from stock when this item is ordered.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!selectedMenuItem ? (
                        <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                            Please select a menu item first.
                        </div>
                    ) : (
                        <>
                            {/* Add Ingredient Form */}
                            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 items-end">
                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-xs font-medium text-slate-500">Ingredient</label>
                                    <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                                        <SelectTrigger className="bg-white w-full">
                                            <SelectValue placeholder="Select ingredient" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {ingredients.map((ing) => (
                                                <SelectItem
                                                    key={ing.id}
                                                    value={ing.id}
                                                    disabled={currentRecipe.some(r => r.ingredient_id === ing.id)}
                                                >
                                                    {ing.name} ({ing.unit})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-3 w-full sm:w-auto items-end">
                                    <div className="space-y-2 flex-1 sm:w-32">
                                        <label className="text-xs font-medium text-slate-500">Quantity Required</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 0.5"
                                            className="w-full bg-white"
                                            value={quantityRequired}
                                            onChange={(e) => setQuantityRequired(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddIngredient}
                                        disabled={loading || !selectedIngredient || !quantityRequired}
                                        className="shrink-0 h-10"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add
                                    </Button>
                                </div>
                            </div>

                            {/* Recipe List */}
                            <div className="overflow-hidden border border-slate-200 rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Ingredient</th>
                                            <th className="px-4 py-3 font-medium">Quantity Required</th>
                                            <th className="px-4 py-3 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading && currentRecipe.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">Loading recipe...</td>
                                            </tr>
                                        ) : currentRecipe.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-12 text-center">
                                                    <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2 opacity-50" />
                                                    <p className="text-slate-500">No ingredients linked yet.</p>
                                                    <p className="text-xs text-slate-400 mt-1">Orders for this item won't deduct any stock.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            currentRecipe.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                        {item.ingredient?.name || 'Unknown Ingredient'}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700">
                                                        {item.quantity} {item.ingredient?.unit}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveIngredient(item.id)}
                                                            disabled={loading}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
