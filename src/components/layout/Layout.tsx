import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/useAuth';
import { useSettings } from '@/store/useSettings';
import { useInventory } from '@/store/useInventory';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Utensils, History, Settings, User, Package, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { user, signOut } = useAuth();
    const { ingredients, fetchIngredients } = useInventory();
    const settings = useSettings();
    const navigate = useNavigate();
    const location = useLocation();

    const role = user?.role ?? '';
    const rolePerms = settings.permissions?.[role];

    useEffect(() => {
        if (['owner', 'manager'].includes(user?.role || '')) {
            fetchIngredients();
        }
    }, [user?.role, fetchIngredients]);

    const lowStockCount = ingredients.filter(i => i.current_stock <= i.min_stock_level).length;

    const navItems: Array<{ icon: any; label: string; path: string; badge?: number }> = [
        { icon: LayoutDashboard, label: 'Tables', path: '/' },
        { icon: Utensils, label: 'Menu', path: '/menu' },
        { icon: History, label: 'Orders', path: '/orders' },
    ];

    if (rolePerms?.canAccessKOT) {
        navItems.push({ icon: ChefHat, label: 'KOT', path: '/kot' });
    }

    if (['owner', 'manager'].includes(user?.role || '')) {
        navItems.push({ icon: Package, label: 'Inventory', path: '/inventory', badge: lowStockCount > 0 ? lowStockCount : undefined });
        navItems.push({ icon: Settings, label: 'Manage', path: '/settings' });
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <img
                        src="/assets/logo.png"
                        alt="Su Swadish"
                        className="w-16 h-16 object-contain rounded-xl"
                        onError={(e) => {
                            // Fallback: hide broken img, show initials badge
                            e.currentTarget.style.display = 'none';
                            const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (next) next.style.display = 'flex';
                        }}
                    />
                    {/* Fallback initials badge (shown only if logo.png fails to load) */}
                    <div className="w-12 h-12 bg-primary rounded-xl items-center justify-center hidden shrink-0">
                        <span className="text-white font-black text-lg leading-none">SS</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Su Swadish Restaurant</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-sm font-semibold">{user?.full_name}</span>
                        <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-slate-500 hover:text-destructive">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Desktop */}
                <nav className="w-20 lg:w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                    <div className="p-4 flex-1 space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all relative",
                                    "hover:bg-slate-100 group",
                                    location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/')
                                        ? "bg-primary text-white hover:bg-primary/90"
                                        : "text-slate-600"
                                )}
                            >
                                <item.icon className={cn("w-6 h-6 shrink-0",
                                    (location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/'))
                                        ? "text-white"
                                        : "text-slate-500 group-hover:text-primary"
                                )} />
                                <span className="font-medium hidden lg:inline-block">{item.label}</span>
                                {(item as any).badge && (
                                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                        {(item as any).badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={() => navigate('/profile')}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                                "hover:bg-slate-100 group",
                                location.pathname === '/profile'
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : "text-slate-600"
                            )}
                        >
                            <User className={cn("w-6 h-6 shrink-0",
                                location.pathname === '/profile' ? "text-white" : "text-slate-500 group-hover:text-primary"
                            )} />
                            <span className="font-medium hidden lg:inline-block">Profile</span>
                        </button>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    {children}
                </main>
            </div>

            {/* Mobile Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-20 pb-safe">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[64px] relative",
                            (location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/'))
                                ? "text-primary bg-primary/5"
                                : "text-slate-500"
                        )}
                    >
                        <div className="relative">
                            <item.icon className="w-6 h-6" />
                            {(item as any).badge && (
                                <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                    {(item as any).badge}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
