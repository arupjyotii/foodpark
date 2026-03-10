export type UserRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
}

export interface Table {
    id: string;
    number: string;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning';
    current_order_id?: string;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    created_at: string;
}

export interface MenuItem {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    price: number; // in paise
    image_url?: string;
    is_available: boolean;
    is_vegetarian: boolean;
    is_spicy: boolean;
    created_at: string;
}

export interface Order {
    id: string;
    table_id: string;
    waiter_id: string;
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'paid';
    total_amount: number; // in paise
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number; // in paise
    total_price: number; // in paise
    notes?: string;
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
    created_at: string;
}

export interface Transaction {
    id: string;
    order_id: string;
    amount: number;
    payment_method: 'cash' | 'card' | 'upi';
    status: 'success' | 'failed' | 'refunded';
    created_at: string;
}

// Phase 2: Inventory Types
export interface Supplier {
    id: string;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    created_at: string;
}

export interface Ingredient {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    min_stock_level: number;
    cost_per_unit: number; // in paise
    supplier_id?: string;
    created_at: string;
}

export interface StockMovement {
    id: string;
    ingredient_id: string;
    quantity: number;
    type: 'in' | 'out' | 'adjustment' | 'waste';
    reference_id?: string;
    notes?: string;
    created_by: string;
    created_at: string;
}

export interface RecipeItem {
    id: string;
    menu_item_id: string;
    ingredient_id: string;
    quantity: number;
}
