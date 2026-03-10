import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────── Types ────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'card' | 'upi';

export interface RestaurantSettings {
    // Restaurant Info
    restaurantName: string;
    address: string;
    phone: string;
    gstin: string;
    taxRate: number;       // percentage, e.g. 5
    receiptFooter: string;

    // Payment Methods
    paymentMethods: {
        cash: boolean;
        card: boolean;
        upi: boolean;
    };
    defaultPayment: PaymentMethod;

    // Role Permissions
    permissions: Record<string, Record<string, boolean>>;
}

interface SettingsState extends RestaurantSettings {
    update: (patch: Partial<RestaurantSettings>) => void;
    updatePaymentMethod: (method: PaymentMethod, enabled: boolean) => void;
    updatePermission: (role: string, permission: string, value: boolean) => void;
    enabledPaymentMethods: () => PaymentMethod[];
}

// ─────────────────────── Default Permissions ──────────────────────────────────
const defaultPermissions: Record<string, Record<string, boolean>> = {
    owner: { canViewOrders: true, canManageMenu: true, canManageInventory: true, canManageStaff: true, canAccessKOT: true },
    manager: { canViewOrders: true, canManageMenu: true, canManageInventory: true, canManageStaff: true, canAccessKOT: true },
    cashier: { canViewOrders: true, canManageMenu: false, canManageInventory: false, canManageStaff: false, canAccessKOT: false },
    waiter: { canViewOrders: false, canManageMenu: false, canManageInventory: false, canManageStaff: false, canAccessKOT: false },
    kitchen: { canViewOrders: false, canManageMenu: false, canManageInventory: false, canManageStaff: false, canAccessKOT: true },
};

// ─────────────────────── Store ─────────────────────────────────────────────────
export const useSettings = create<SettingsState>()(
    persist(
        (set, get) => ({
            // Defaults
            restaurantName: 'RestaurantOS',
            address: '',
            phone: '',
            gstin: '',
            taxRate: 5,
            receiptFooter: 'Thank you for dining with us! Visit again.',
            paymentMethods: { cash: true, card: true, upi: true },
            defaultPayment: 'cash',
            permissions: defaultPermissions,

            update: (patch) => set((state) => ({ ...state, ...patch })),

            updatePaymentMethod: (method, enabled) =>
                set((state) => ({
                    paymentMethods: { ...state.paymentMethods, [method]: enabled },
                    // If we're disabling the default, reset default
                    defaultPayment:
                        !enabled && state.defaultPayment === method
                            ? (['cash', 'card', 'upi'] as PaymentMethod[]).find(
                                (m) => m !== method && state.paymentMethods[m]
                            ) ?? 'cash'
                            : state.defaultPayment,
                })),

            updatePermission: (role, permission, value) =>
                set((state) => ({
                    permissions: {
                        ...state.permissions,
                        [role]: { ...state.permissions[role], [permission]: value },
                    },
                })),

            enabledPaymentMethods: () => {
                const { paymentMethods } = get();
                return (['cash', 'card', 'upi'] as PaymentMethod[]).filter(
                    (m) => paymentMethods[m]
                );
            },
        }),
        { name: 'restaurant-settings' }
    )
);
