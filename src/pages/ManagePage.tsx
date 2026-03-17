import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Settings, Users, LayoutDashboard, Loader2, RefreshCw,
    UserCheck, UserX, PlusCircle, Trash2, ChefHat, ShieldCheck,
    UtensilsCrossed, ClipboardList, AlertCircle, CheckCircle2,
    Pencil, X, ToggleLeft, ToggleRight, ImagePlus
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { Profile, Table } from '@/types';

// ─── Role badge ──────────────────────────────────────────────────────────────
const roleMeta: Record<string, { label: string; color: string; icon: typeof ChefHat }> = {
    owner: { label: 'Owner', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: ShieldCheck },
    manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: ClipboardList },
    cashier: { label: 'Cashier', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: ClipboardList },
    waiter: { label: 'Waiter', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: UtensilsCrossed },
    kitchen: { label: 'Kitchen', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ChefHat },
};

// ─── Staff Tab ────────────────────────────────────────────────────────────────
const ROLE_OPTIONS = ['owner', 'manager', 'cashier', 'waiter', 'kitchen'];

function StaffTab({ currentUserId }: { currentUserId: string }) {
    const [staff, setStaff] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    // Add staff form state
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<string>('waiter');
    const [newPassword, setNewPassword] = useState('');
    const [addError, setAddError] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('role')
            .order('full_name');
        setStaff((data as Profile[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const toggleActive = async (profile: Profile) => {
        if (profile.id === currentUserId) return;
        setToggling(profile.id);
        await supabase
            .from('profiles')
            .update({ is_active: !profile.is_active })
            .eq('id', profile.id);
        setStaff(prev => prev.map(p => p.id === profile.id ? { ...p, is_active: !p.is_active } : p));
        setToggling(null);
    };

    const handleAddStaff = async () => {
        setAddError('');
        if (!newName.trim()) { setAddError('Name is required'); return; }
        if (!newEmail.trim() || !newEmail.includes('@')) { setAddError('Valid email required'); return; }
        if (newPassword.length < 6) { setAddError('Password must be at least 6 characters'); return; }
        setAdding(true);
        try {
            // Create auth user — this triggers handle_new_user which creates the profile
            const { data, error: signUpErr } = await supabase.auth.signUp({
                email: newEmail.trim(),
                password: newPassword,
                options: { data: { full_name: newName.trim() } },
            });
            if (signUpErr) throw signUpErr;
            if (data.user) {
                // Update profile with correct role & name (trigger defaults to 'owner')
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email: newEmail.trim(),
                    full_name: newName.trim(),
                    role: newRole,
                    is_active: true,
                });
            }
            setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('waiter');
            setShowAdd(false);
            await fetchStaff();
        } catch (e: unknown) {
            setAddError(e instanceof Error ? e.message : 'Failed to create user');
        } finally {
            setAdding(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{staff.length} team member{staff.length !== 1 ? 's' : ''}</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchStaff} className="gap-2">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </Button>
                    <Button size="sm" onClick={() => { setShowAdd(v => !v); setAddError(''); }} className="gap-2">
                        <PlusCircle className="w-3.5 h-3.5" /> Add Staff
                    </Button>
                </div>
            </div>

            {/* Add Staff Form */}
            {showAdd && (
                <Card className="border-2 border-primary/30 bg-primary/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                            <PlusCircle className="w-4 h-4" /> New Staff Member
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name *</label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Ramesh Kumar" className="h-9" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Email *</label>
                                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="staff@restaurant.com" className="h-9" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Role *</label>
                                <select
                                    value={newRole}
                                    onChange={e => setNewRole(e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary capitalize"
                                >
                                    {ROLE_OPTIONS.map(r => (
                                        <option key={r} value={r} className="capitalize">{roleMeta[r]?.label ?? r}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Password * (min 6 chars)</label>
                                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="h-9" />
                            </div>
                        </div>
                        {addError && (
                            <p className="text-sm text-red-600 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />{addError}
                            </p>
                        )}
                        <div className="flex gap-2 pt-1">
                            <Button onClick={handleAddStaff} disabled={adding} className="gap-2 h-9">
                                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                                Create Account
                            </Button>
                            <Button variant="outline" onClick={() => setShowAdd(false)} className="h-9">Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {staff.map(member => {
                    const meta = roleMeta[member.role] ?? roleMeta.waiter;
                    const RoleIcon = meta.icon;
                    const isSelf = member.id === currentUserId;
                    return (
                        <Card key={member.id} className={cn(
                            'border transition-all',
                            !member.is_active && 'opacity-60 bg-slate-50'
                        )}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                            member.is_active ? 'bg-primary/10' : 'bg-slate-200'
                                        )}>
                                            <RoleIcon className={cn('w-5 h-5', member.is_active ? 'text-primary' : 'text-slate-400')} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">
                                                {member.full_name}
                                                {isSelf && <span className="ml-1.5 text-xs text-slate-400 font-normal">(you)</span>}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">{member.email}</p>
                                        </div>
                                    </div>
                                    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0', meta.color)}>
                                        {meta.label}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className={cn(
                                        'inline-flex items-center gap-1 text-xs font-medium',
                                        member.is_active ? 'text-emerald-600' : 'text-slate-400'
                                    )}>
                                        {member.is_active
                                            ? <><UserCheck className="w-3.5 h-3.5" /> Active</>
                                            : <><UserX className="w-3.5 h-3.5" /> Inactive</>
                                        }
                                    </span>
                                    {!isSelf && (
                                        <Button
                                            size="sm"
                                            variant={member.is_active ? 'outline' : 'default'}
                                            className="h-7 text-xs"
                                            disabled={toggling === member.id}
                                            onClick={() => toggleActive(member)}
                                        >
                                            {toggling === member.id
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : member.is_active ? 'Deactivate' : 'Activate'
                                            }
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Tables Tab ───────────────────────────────────────────────────────────────
const tableStatusColor: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    occupied: 'bg-red-100 text-red-700 border-red-200',
    reserved: 'bg-amber-100 text-amber-700 border-amber-200',
    cleaning: 'bg-blue-100 text-blue-700 border-blue-200',
};

function TablesTab() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [newNumber, setNewNumber] = useState('');
    const [newCapacity, setNewCapacity] = useState('4');
    const [error, setError] = useState('');

    const fetchTables = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('tables').select('*').order('number');
        setTables((data as Table[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchTables(); }, [fetchTables]);

    const addTable = async () => {
        setError('');
        if (!newNumber.trim()) { setError('Table number is required'); return; }
        const cap = parseInt(newCapacity);
        if (isNaN(cap) || cap < 1) { setError('Capacity must be at least 1'); return; }
        if (tables.some(t => t.number === newNumber.trim())) {
            setError('Table number already exists'); return;
        }
        setAdding(true);
        const { error: err } = await supabase.from('tables').insert({
            number: newNumber.trim(),
            capacity: cap,
            status: 'available',
        });
        if (err) { setError(err.message); } else {
            setNewNumber('');
            setNewCapacity('4');
            await fetchTables();
        }
        setAdding(false);
    };

    const deleteTable = async (table: Table) => {
        if (table.status === 'occupied') return;
        setDeleting(table.id);
        await supabase.from('tables').delete().eq('id', table.id);
        setTables(prev => prev.filter(t => t.id !== table.id));
        setDeleting(null);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Add table form */}
            <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                        <PlusCircle className="w-4 h-4" /> Add New Table
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[120px]">
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Table Number</label>
                            <Input
                                placeholder="e.g. 7 or A3"
                                value={newNumber}
                                onChange={e => setNewNumber(e.target.value)}
                                className="h-10"
                                onKeyDown={e => e.key === 'Enter' && addTable()}
                            />
                        </div>
                        <div className="w-28">
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Capacity</label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                value={newCapacity}
                                onChange={e => setNewCapacity(e.target.value)}
                                className="h-10"
                            />
                        </div>
                        <Button onClick={addTable} disabled={adding} className="h-10 gap-2">
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                            Add Table
                        </Button>
                    </div>
                    {error && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />{error}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Table list */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{tables.length} table{tables.length !== 1 ? 's' : ''} configured</p>
                <Button variant="outline" size="sm" onClick={fetchTables} className="gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tables.map(table => (
                    <Card key={table.id} className="border hover:shadow-md transition-all">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                    <p className="text-2xl font-black text-slate-900">T{table.number}</p>
                                    <p className="text-xs text-slate-400">{table.capacity} seats</p>
                                </div>
                                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border capitalize', tableStatusColor[table.status] ?? 'bg-slate-100 text-slate-600')}>
                                    {table.status}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-8 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 gap-1.5"
                                disabled={table.status === 'occupied' || deleting === table.id}
                                onClick={() => deleteTable(table)}
                            >
                                {deleting === table.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Trash2 className="w-3 h-3" />
                                }
                                {table.status === 'occupied' ? 'In use' : 'Remove'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {tables.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                        <LayoutDashboard className="w-12 h-12 mb-3 opacity-40" />
                        <p className="font-semibold">No tables yet</p>
                        <p className="text-sm">Add your first table above</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Menu Tab ────────────────────────────────────────────────────────────────
interface MenuItemRow {
    id: string; name: string; category_id: string; price: number;
    is_available: boolean; is_vegetarian: boolean; is_spicy: boolean;
    image_url?: string;
}

function MenuTab() {
    const [items, setItems] = useState<MenuItemRow[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState<string>('');
    const [editing, setEditing] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<Partial<MenuItemRow>>({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    // Add form
    const [showAdd, setShowAdd] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', category_id: '', price: '', is_vegetarian: false, is_spicy: false, image_url: '' });
    const [addErr, setAddErr] = useState('');
    const [adding, setAdding] = useState(false);
    const [importing, setImporting] = useState(false);
    const [uploadingImg, setUploadingImg] = useState<'add' | 'edit' | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [{ data: menuItems }, { data: cats }] = await Promise.all([
            supabase.from('menu_items').select('id,name,category_id,price,is_available,is_vegetarian,is_spicy,image_url').order('name'),
            supabase.from('categories').select('id,name').order('name'),
        ]);
        setItems((menuItems as MenuItemRow[]) || []);
        setCategories((cats as { id: string; name: string }[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const startEdit = (item: MenuItemRow) => { setEditing(item.id); setEditDraft({ ...item }); };
    const cancelEdit = () => { setEditing(null); setEditDraft({}); };

    const saveEdit = async () => {
        if (!editing) return;
        setSaving(true);
        await supabase.from('menu_items').update({
            name: editDraft.name,
            category_id: editDraft.category_id,
            price: editDraft.price,
            is_available: editDraft.is_available,
            is_vegetarian: editDraft.is_vegetarian,
            is_spicy: editDraft.is_spicy,
            image_url: editDraft.image_url || null,
        }).eq('id', editing);
        setItems(prev => prev.map(i => i.id === editing ? { ...i, ...editDraft } as MenuItemRow : i));
        cancelEdit();
        setSaving(false);
    };

    // Upload image to Supabase Storage → returns public URL
    const uploadImage = async (file: File, context: 'add' | 'edit') => {
        setUploadingImg(context);
        const ext = file.name.split('.').pop();
        const path = `dishes/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true });
        if (error) { alert('Upload failed: ' + error.message); setUploadingImg(null); return; }
        const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
        if (context === 'add') setNewItem(d => ({ ...d, image_url: data.publicUrl }));
        else setEditDraft(d => ({ ...d, image_url: data.publicUrl }));
        setUploadingImg(null);
    };

    const toggleAvail = async (item: MenuItemRow) => {
        await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    };

    const deleteItem = async (id: string) => {
        setDeleting(id);
        await supabase.from('menu_items').delete().eq('id', id);
        setItems(prev => prev.filter(i => i.id !== id));
        setDeleting(null);
    };

    const handleAdd = async () => {
        setAddErr('');
        if (!newItem.name.trim()) { setAddErr('Name is required'); return; }
        if (!newItem.category_id) { setAddErr('Select a category'); return; }
        const price = parseInt(newItem.price);
        if (isNaN(price) || price <= 0) { setAddErr('Enter a valid price in paise (e.g. 25000 = ₹250)'); return; }
        setAdding(true);
        const { error } = await supabase.from('menu_items').insert({
            name: newItem.name.trim(), category_id: newItem.category_id,
            price, is_available: true, is_vegetarian: newItem.is_vegetarian, is_spicy: newItem.is_spicy,
            image_url: newItem.image_url || null,
        });
        if (error) { setAddErr(error.message); } else {
            setNewItem({ name: '', category_id: '', price: '', is_vegetarian: false, is_spicy: false, image_url: '' });
            setShowAdd(false);
            await fetchData();
        }
        setAdding(false);
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows: any[] = XLSX.utils.sheet_to_json(sheet);
            
            if (rows.length === 0) {
                alert("The Excel file is empty.");
                return;
            }

            const { data: catData } = await supabase.from('categories').select('id,name');
            const dbCategories = (catData as { id: string; name: string }[]) || [];

            let addedCount = 0;

            for (const row of rows) {
                const rawCat = row['Category']?.toString().trim();
                const rawName = (row['Items'] || row['Item'] || row['Name'])?.toString().trim();
                const rawPrice = row['Price']?.toString().trim();

                if (!rawCat || !rawName || !rawPrice) continue;
                
                let catId = dbCategories.find(c => c.name.toLowerCase() === rawCat.toLowerCase())?.id;
                
                if (!catId) {
                    const { data: newCat, error } = await supabase
                        .from('categories')
                        .insert({ name: rawCat })
                        .select('id,name')
                        .single();
                    if (error) {
                        console.error("Error creating category:", error);
                        continue;
                    }
                    if (newCat) {
                        dbCategories.push(newCat);
                        catId = newCat.id;
                    }
                }

                if (catId) {
                    const priceInPaise = Math.round(parseFloat(rawPrice) * 100);
                    if (isNaN(priceInPaise) || priceInPaise <= 0) continue;

                    const { error } = await supabase.from('menu_items').insert({
                        name: rawName,
                        category_id: catId,
                        price: priceInPaise,
                        is_available: true,
                        is_vegetarian: false,
                        is_spicy: false
                    });
                    
                    if (!error) addedCount++;
                }
            }
            alert(`Successfully imported ${addedCount} items.`);
            await fetchData();
        } catch (error: any) {
            console.error("Import error:", error);
            alert("Error importing Excel file. Please ensure it has 'Category', 'Items', and 'Price' columns.");
        } finally {
            setImporting(false);
            if (e.target) e.target.value = '';
        }
    };

    const filtered = filterCat ? items.filter(i => i.category_id === filterCat) : items;
    const catName = (id: string) => categories.find(c => c.id === id)?.name ?? '—';

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-500">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
                    <select
                        value={filterCat}
                        onChange={e => setFilterCat(e.target.value)}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5"><RefreshCw className="w-3.5 h-3.5" />Refresh</Button>
                    <label className={cn('h-8 px-3 flex items-center gap-1.5 rounded-md border border-slate-200 bg-white text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors shrink-0', importing && 'opacity-50 pointer-events-none')}>
                        {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5 text-slate-500" />}
                        Import Excel
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={importing} />
                    </label>
                    <Button size="sm" onClick={() => { setShowAdd(v => !v); setAddErr(''); }} className="gap-1.5"><PlusCircle className="w-3.5 h-3.5" />Add Dish</Button>
                </div>
            </div>

            {/* Add Item Form */}
            {showAdd && (
                <Card className="border-2 border-primary/30 bg-primary/5">
                    <CardHeader className="pb-3"><CardTitle className="text-base font-bold flex items-center gap-2 text-primary"><PlusCircle className="w-4 h-4" />New Dish</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Name *</label>
                                <Input value={newItem.name} onChange={e => setNewItem(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Paneer Tikka" className="h-9" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Category *</label>
                                <select value={newItem.category_id} onChange={e => setNewItem(d => ({ ...d, category_id: e.target.value }))}
                                    className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="">Select…</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Price (paise) * e.g. 25000=₹250</label>
                                <Input type="number" value={newItem.price} onChange={e => setNewItem(d => ({ ...d, price: e.target.value }))} placeholder="25000" className="h-9" />
                            </div>
                            <div className="flex items-end gap-4 pb-1">
                                <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
                                    <input type="checkbox" checked={newItem.is_vegetarian} onChange={e => setNewItem(d => ({ ...d, is_vegetarian: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
                                    Veg
                                </label>
                                <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
                                    <input type="checkbox" checked={newItem.is_spicy} onChange={e => setNewItem(d => ({ ...d, is_spicy: e.target.checked }))} className="w-4 h-4 accent-rose-500" />
                                    Non Veg
                                </label>
                            </div>
                        </div>
                        {/* Image */}
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Image URL (paste link or upload)</label>
                                <Input value={newItem.image_url} onChange={e => setNewItem(d => ({ ...d, image_url: e.target.value }))} placeholder="https://..." className="h-9" />
                            </div>
                            <label className={cn('h-9 px-3 flex items-center gap-1.5 rounded-md border border-slate-200 bg-white text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors shrink-0', uploadingImg === 'add' && 'opacity-50 pointer-events-none')}>
                                {uploadingImg === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4 text-slate-500" />}
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'add')} />
                            </label>
                            {newItem.image_url && (
                                <img src={newItem.image_url} alt="preview" className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
                            )}
                        </div>
                        {addErr && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{addErr}</p>}
                        <div className="flex gap-2">
                            <Button onClick={handleAdd} disabled={adding} className="gap-2 h-9">
                                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}Add Dish
                            </Button>
                            <Button variant="outline" onClick={() => setShowAdd(false)} className="h-9">Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <Card className="border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-3 py-3 w-12">Img</th>
                                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Name</th>
                                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Category</th>
                                <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Price</th>
                                <th className="text-center font-semibold text-slate-500 text-xs uppercase tracking-wide px-3 py-3">Veg</th>
                                <th className="text-center font-semibold text-slate-500 text-xs uppercase tracking-wide px-3 py-3">Non Veg</th>
                                <th className="text-center font-semibold text-slate-500 text-xs uppercase tracking-wide px-3 py-3">Available</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(item => (
                                <tr key={item.id} className={cn('hover:bg-slate-50 transition-colors', !item.is_available && 'opacity-50')}>
                                    {editing === item.id ? (
                                        // Edit row
                                        <>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-col gap-1">
                                                    <label className={cn('flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white text-xs cursor-pointer hover:bg-slate-50', uploadingImg === 'edit' && 'opacity-50 pointer-events-none')}>
                                                        {uploadingImg === 'edit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                                                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'edit')} />
                                                        {editDraft.image_url ? 'Change' : 'Upload'}
                                                    </label>
                                                    {editDraft.image_url && <img src={editDraft.image_url} className="w-10 h-10 rounded object-cover border" onError={e => (e.currentTarget.style.display = 'none')} />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input value={editDraft.name ?? ''} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} className="h-8 text-sm" />
                                            </td>
                                            <td className="px-4 py-2">
                                                <select value={editDraft.category_id ?? ''} onChange={e => setEditDraft(d => ({ ...d, category_id: e.target.value }))}
                                                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input type="number" value={editDraft.price ?? 0} onChange={e => setEditDraft(d => ({ ...d, price: parseInt(e.target.value) || 0 }))} className="h-8 w-28 text-sm text-right" />
                                            </td>
                                            <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editDraft.is_vegetarian} onChange={e => setEditDraft(d => ({ ...d, is_vegetarian: e.target.checked }))} className="w-4 h-4 accent-emerald-500" /></td>
                                            <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editDraft.is_spicy} onChange={e => setEditDraft(d => ({ ...d, is_spicy: e.target.checked }))} className="w-4 h-4 accent-rose-500" /></td>
                                            <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editDraft.is_available} onChange={e => setEditDraft(d => ({ ...d, is_available: e.target.checked }))} className="w-4 h-4 accent-primary" /></td>
                                            <td className="px-4 py-2">
                                                <div className="flex gap-1.5">
                                                    <Button size="sm" className="h-7 text-xs gap-1" onClick={saveEdit} disabled={saving}>
                                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}Save
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        // Display row
                                        <>
                                            <td className="px-3 py-2">
                                                {item.image_url
                                                    ? <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100" onError={e => (e.currentTarget.style.display = 'none')} />
                                                    : <span className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 font-bold text-lg">{item.name[0]}</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">{catName(item.category_id)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(item.price)}</td>
                                            <td className="px-3 py-3 text-center">{item.is_vegetarian ? <span className="inline-flex w-4 h-4 rounded-full bg-emerald-500 items-center justify-center"><span className="w-2 h-2 rounded-full bg-white" /></span> : <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-200" />}</td>
                                            <td className="px-3 py-3 text-center">{item.is_spicy ? <span className="inline-flex w-4 h-4 rounded-full bg-rose-600 items-center justify-center"><span className="w-2 h-2 rounded-full bg-white" /></span> : <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-200" />}</td>
                                            <td className="px-3 py-3 text-center">
                                                <button onClick={() => toggleAvail(item)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                                    {item.is_available
                                                        ? <ToggleRight className="w-6 h-6 text-primary" />
                                                        : <ToggleLeft className="w-6 h-6 text-slate-300" />
                                                    }
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1.5">
                                                    <Button size="sm" variant="ghost" className="h-7 p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10" onClick={() => startEdit(item)}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => deleteItem(item.id)} disabled={deleting === item.id}>
                                                        {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <UtensilsCrossed className="w-10 h-10 mb-2 opacity-40" />
                            <p className="font-semibold">No dishes found</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
import { useSettings } from '@/store/useSettings';
import type { PaymentMethod } from '@/store/useSettings';

const PAYMENT_META: Record<PaymentMethod, { label: string; icon: typeof ChefHat; color: string }> = {
    cash: { label: 'Cash', icon: UtensilsCrossed, color: 'text-emerald-600' },
    card: { label: 'Card', icon: ClipboardList, color: 'text-blue-600' },
    upi: { label: 'UPI', icon: ShieldCheck, color: 'text-violet-600' },
};

const ALL_PERMISSIONS: { key: string; label: string }[] = [
    { key: 'canViewOrders', label: 'View Orders' },
    { key: 'canManageMenu', label: 'Manage Menu' },
    { key: 'canManageInventory', label: 'Manage Inventory' },
    { key: 'canManageStaff', label: 'Manage Staff' },
    { key: 'canAccessKOT', label: 'Access KOT' },
];

const ROLES = ['owner', 'manager', 'cashier', 'waiter', 'kitchen'];

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                checked ? 'bg-primary' : 'bg-slate-200',
                disabled && 'opacity-40 cursor-not-allowed'
            )}
        >
            <span className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                checked ? 'translate-x-6' : 'translate-x-1'
            )} />
        </button>
    );
}

// ─── Reports Tab (Owner only) ────────────────────────────────────────────────
function ReportsTab() {
    const [exporting, setExporting] = useState(false);
    const [summary, setSummary] = useState<{ total: number; paid: number; revenue: number } | null>(null);
    const [loaded, setLoaded] = useState(false);

    // Load summary on mount
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('orders')
                .select('id, status, total_amount');
            if (data) {
                const paid = data.filter(o => o.status === 'paid');
                setSummary({
                    total: data.length,
                    paid: paid.length,
                    revenue: paid.reduce((s, o) => s + o.total_amount, 0),
                });
            }
            setLoaded(true);
        };
        load();
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            // Fetch all orders with full detail
            const { data: orders } = await supabase
                .from('orders')
                .select(`
                    id, status, subtotal, tax_amount, total_amount, created_at,
                    table:tables(number),
                    waiter:profiles(full_name),
                    order_items(id, quantity, unit_price, total_price, menu_item:menu_items(name)),
                    transactions(payment_method, status, amount, created_at)
                `)
                .order('created_at', { ascending: false });

            if (!orders || orders.length === 0) {
                alert('No orders found to export.');
                return;
            }

            // Flatten: one row per order-item
            const rows: Record<string, string | number>[] = [];
            for (const order of orders as any[]) {
                const successTx = order.transactions?.find((t: any) => t.status === 'success');
                const payMethod = successTx?.payment_method?.toUpperCase() ?? '—';
                const date = new Date(order.created_at);
                const dateStr = date.toLocaleDateString('en-IN');
                const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                const items = order.order_items ?? [];
                if (items.length === 0) {
                    rows.push({
                        'Order ID': order.id.slice(0, 8).toUpperCase(),
                        'Date': dateStr,
                        'Time': timeStr,
                        'Table': order.table?.number ?? '—',
                        'Status': order.status,
                        'Waiter': order.waiter?.full_name ?? '—',
                        'Item': '(no items)',
                        'Qty': '',
                        'Unit Price (₹)': '',
                        'Item Total (₹)': '',
                        'Subtotal (₹)': (order.subtotal / 100).toFixed(2),
                        'Tax (₹)': (order.tax_amount / 100).toFixed(2),
                        'Order Total (₹)': (order.total_amount / 100).toFixed(2),
                        'Payment Method': payMethod,
                    });
                } else {
                    for (const item of items) {
                        rows.push({
                            'Order ID': order.id.slice(0, 8).toUpperCase(),
                            'Date': dateStr,
                            'Time': timeStr,
                            'Table': order.table?.number ?? '—',
                            'Status': order.status,
                            'Waiter': order.waiter?.full_name ?? '—',
                            'Item': item.menu_item?.name ?? '—',
                            'Qty': item.quantity,
                            'Unit Price (₹)': (item.unit_price / 100).toFixed(2),
                            'Item Total (₹)': (item.total_price / 100).toFixed(2),
                            'Subtotal (₹)': (order.subtotal / 100).toFixed(2),
                            'Tax (₹)': (order.tax_amount / 100).toFixed(2),
                            'Order Total (₹)': (order.total_amount / 100).toFixed(2),
                            'Payment Method': payMethod,
                        });
                    }
                }
            }

            // Build workbook
            const ws = XLSX.utils.json_to_sheet(rows);
            // Auto column widths
            const colWidths = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length, 14) }));
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Orders Report');

            const fileName = `SuSwadish_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <Card className="border">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" /> Orders Report Export
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Summary */}
                    {loaded && summary && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-slate-900">{summary.total}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">Total Orders</p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-emerald-700">{summary.paid}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">Paid Orders</p>
                            </div>
                            <div className="bg-primary/5 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-primary">
                                    ₹{(summary.revenue / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-1">Total Revenue</p>
                            </div>
                        </div>
                    )}

                    {/* What's included */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Report Includes</p>
                        {[
                            'Order ID, Date & Time',
                            'Table Name',
                            'Order Status',
                            'Waiter / Server Name',
                            'Each Item — Name, Qty, Unit Price, Total',
                            'Subtotal, Tax, Order Total',
                            'Payment Method (Cash / Card / UPI)',
                        ].map(item => (
                            <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full h-12 gap-2 font-bold text-base"
                    >
                        {exporting
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Excel...</>
                            : <><ClipboardList className="w-5 h-5" /> Export All Orders to Excel</>
                        }
                    </Button>

                    <p className="text-xs text-center text-slate-400">
                        Downloads a .xlsx file with all orders — one row per item ordered.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function SettingsTab() {
    const settings = useSettings();
    const [saved, setSaved] = useState(false);

    // Local draft for restaurant info (to support explicit "Save" action)
    const [draft, setDraft] = useState({
        restaurantName: settings.restaurantName,
        address: settings.address,
        phone: settings.phone,
        gstin: settings.gstin,
        taxRate: settings.taxRate,
        receiptFooter: settings.receiptFooter,
    });

    const handleSave = () => {
        settings.update(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6 max-w-5xl">

            {/* ── Restaurant Info + Live Preview ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* Form */}
                <div className="lg:col-span-3">
                    <Card className="border">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <UtensilsCrossed className="w-4 h-4 text-primary" /> Restaurant Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Restaurant Name *</label>
                                    <Input
                                        value={draft.restaurantName}
                                        onChange={e => setDraft(d => ({ ...d, restaurantName: e.target.value }))}
                                        className="h-10"
                                        placeholder="e.g. Spice Garden"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone</label>
                                    <Input
                                        value={draft.phone}
                                        onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))}
                                        className="h-10"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Address</label>
                                    <Input
                                        value={draft.address}
                                        onChange={e => setDraft(d => ({ ...d, address: e.target.value }))}
                                        className="h-10"
                                        placeholder="123 Main Street, City, State"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">GSTIN</label>
                                    <Input
                                        value={draft.gstin}
                                        onChange={e => setDraft(d => ({ ...d, gstin: e.target.value.toUpperCase() }))}
                                        className="h-10 font-mono"
                                        placeholder="27AAPFU0939F1ZV"
                                        maxLength={15}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tax Rate (%)</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={30}
                                        step={0.5}
                                        value={draft.taxRate}
                                        onChange={e => setDraft(d => ({ ...d, taxRate: parseFloat(e.target.value) || 0 }))}
                                        className="h-10 w-28"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Receipt Footer Message</label>
                                    <Input
                                        value={draft.receiptFooter}
                                        onChange={e => setDraft(d => ({ ...d, receiptFooter: e.target.value }))}
                                        className="h-10"
                                        placeholder="Thank you for dining with us!"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleSave} className="gap-2">
                                {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : 'Save Changes'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Receipt Preview */}
                <div className="lg:col-span-2">
                    <Card className="border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide">Live Receipt Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-800 min-h-64">
                                {/* Header */}
                                <div className="text-center border-b border-dashed border-slate-300 pb-2 mb-2">
                                    <div className="flex justify-center mb-2">
                                        <img src="/assets/logo.png" alt="Logo" className="h-8 object-contain" />
                                    </div>
                                    <p className="font-bold text-[13px]">{draft.restaurantName || 'Restaurant Name'}</p>
                                    {draft.address && <p className="text-[10px] text-slate-500">{draft.address}</p>}
                                    {draft.phone && <p className="text-[10px] text-slate-500">Tel: {draft.phone}</p>}
                                    {draft.gstin && <p className="text-[10px] text-slate-500">GSTIN: {draft.gstin}</p>}
                                </div>
                                {/* Meta */}
                                <div className="border-b border-dashed border-slate-300 pb-2 mb-2 text-[10px] text-slate-500">
                                    <div className="flex justify-between"><span>Table:</span><span>T5</span></div>
                                    <div className="flex justify-between"><span>Order #:</span><span>SAMPLE</span></div>
                                    <div className="flex justify-between"><span>Date:</span><span>{new Date().toLocaleDateString('en-IN')}</span></div>
                                </div>
                                {/* Items */}
                                <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
                                    <div className="flex justify-between"><span>Butter Chicken x2</span><span>₹900</span></div>
                                    <div className="flex justify-between"><span>Garlic Naan x3</span><span>₹240</span></div>
                                    <div className="flex justify-between"><span>Mango Lassi x1</span><span>₹150</span></div>
                                </div>
                                {/* Totals */}
                                <div className="border-b border-dashed border-slate-300 pb-2 mb-2 text-[10px]">
                                    <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹1290</span></div>
                                    <div className="flex justify-between text-slate-500"><span>Taxes & Charges ({draft.taxRate}%)</span><span>₹{Math.round(1290 * draft.taxRate / 100)}</span></div>
                                    <div className="flex justify-between font-bold text-[12px] mt-1"><span>TOTAL</span><span>₹{Math.round(1290 * (1 + draft.taxRate / 100))}</span></div>
                                </div>
                                {/* Footer */}
                                <p className="text-center text-[10px] text-slate-400 italic">{draft.receiptFooter || 'Thank you!'}</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 text-center">Preview updates as you type ✦</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Payment Methods ── */}
            <Card className="border">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" /> Payment Methods
                    </CardTitle>
                    <p className="text-xs text-slate-500">Enable the payment modes accepted at checkout</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(['cash', 'card', 'upi'] as PaymentMethod[]).map(method => {
                            const meta = PAYMENT_META[method];
                            const Icon = meta.icon;
                            const enabled = settings.paymentMethods[method];
                            const isDefault = settings.defaultPayment === method;
                            return (
                                <div key={method} className={cn(
                                    'rounded-xl border-2 p-4 transition-all',
                                    enabled ? 'border-primary/30 bg-primary/5' : 'border-slate-200 bg-slate-50 opacity-60'
                                )}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Icon className={cn('w-5 h-5', meta.color)} />
                                            <span className="font-bold text-slate-800">{meta.label}</span>
                                        </div>
                                        <ToggleSwitch
                                            checked={enabled}
                                            onChange={v => settings.updatePaymentMethod(method, v)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => enabled && settings.update({ defaultPayment: method })}
                                        disabled={!enabled}
                                        className={cn(
                                            'w-full text-xs font-bold py-1.5 rounded-lg transition-all border',
                                            isDefault
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary',
                                            !enabled && 'cursor-not-allowed'
                                        )}
                                    >
                                        {isDefault ? '✓ Default' : 'Set as Default'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ── Role Permissions ── */}
            <Card className="border">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" /> Role Permissions
                    </CardTitle>
                    <p className="text-xs text-slate-500">Configure what each role can do. Owner permissions are locked.</p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-sm min-w-[540px]">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide pb-3 pl-2 w-44">
                                        Permission
                                    </th>
                                    {ROLES.map(role => (
                                        <th key={role} className="text-center pb-3 px-2">
                                            <span className={cn(
                                                'inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize',
                                                roleMeta[role]?.color ?? 'bg-slate-100 text-slate-600 border-slate-200'
                                            )}>
                                                {roleMeta[role]?.label ?? role}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ALL_PERMISSIONS.map(perm => (
                                    <tr key={perm.key} className="hover:bg-slate-50">
                                        <td className="py-3 pl-2 font-medium text-slate-700">{perm.label}</td>
                                        {ROLES.map(role => {
                                            const isOwner = role === 'owner';
                                            const checked = settings.permissions[role]?.[perm.key] ?? false;
                                            return (
                                                <td key={role} className="py-3 px-2 text-center">
                                                    <div className="flex justify-center">
                                                        <ToggleSwitch
                                                            checked={checked}
                                                            onChange={v => settings.updatePermission(role, perm.key, v)}
                                                            disabled={isOwner}
                                                        />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManagePage() {
    const { user } = useAuth();

    if (!user || !['owner', 'manager'].includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-30" />
                <h3 className="font-bold text-xl">Access Restricted</h3>
                <p className="text-sm mt-1">Only owners and managers can access this section.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <div className="bg-primary text-white p-2 rounded-xl">
                        <Settings className="w-6 h-6" />
                    </div>
                    Manage
                </h1>
                <p className="text-slate-500 font-medium ml-11">Staff, tables, and restaurant settings</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="staff" className="space-y-6">
                <TabsList className="h-11">
                    <TabsTrigger value="staff" className="gap-2 px-5">
                        <Users className="w-4 h-4" /> Staff
                    </TabsTrigger>
                    <TabsTrigger value="tables" className="gap-2 px-5">
                        <LayoutDashboard className="w-4 h-4" /> Tables
                    </TabsTrigger>
                    <TabsTrigger value="menu" className="gap-2 px-5">
                        <UtensilsCrossed className="w-4 h-4" /> Menu
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2 px-5">
                        <Settings className="w-4 h-4" /> Settings
                    </TabsTrigger>
                    {user.role === 'owner' && (
                        <TabsTrigger value="reports" className="gap-2 px-5">
                            <ClipboardList className="w-4 h-4" /> Reports
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="staff">
                    <StaffTab currentUserId={user.id} />
                </TabsContent>

                <TabsContent value="tables">
                    <TablesTab />
                </TabsContent>

                <TabsContent value="menu">
                    <MenuTab />
                </TabsContent>

                <TabsContent value="settings">
                    <SettingsTab />
                </TabsContent>

                {user.role === 'owner' && (
                    <TabsContent value="reports">
                        <ReportsTab />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
