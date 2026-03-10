-- Dummy Data for RestaurantOS
-- UUIDs use valid hex digits only (0-9, a-f)

-- 1. Insert Tables (if not exist)
INSERT INTO tables (number, capacity, status)
VALUES 
    ('T1', 2, 'available'),
    ('T2', 2, 'available'),
    ('T3', 4, 'available'),
    ('T4', 4, 'available'),
    ('T5', 6, 'available'),
    ('T6', 6, 'available'),
    ('V1', 8, 'available'),
    ('V2', 8, 'available')
ON CONFLICT (number) DO NOTHING;

-- 2. Insert Categories
-- Category UUIDs: prefix 'aa00...'
INSERT INTO categories (id, name, description)
VALUES 
    ('aa000000-0000-0000-0000-000000000001', 'Starters', 'Appetizers and quick bites'),
    ('aa000000-0000-0000-0000-000000000002', 'Main Course', 'Hearty main dishes'),
    ('aa000000-0000-0000-0000-000000000003', 'Desserts', 'Sweet treats and bakery items'),
    ('aa000000-0000-0000-0000-000000000004', 'Beverages', 'Hot and cold drinks')
ON CONFLICT (name) DO NOTHING;

-- 3. Insert Menu Items
-- Menu Item UUIDs: prefix 'bb00...'
INSERT INTO menu_items (id, category_id, name, description, price, is_available, is_vegetarian, is_spicy)
VALUES
    -- Starters
    ('bb000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'Paneer Tikka', 'Spiced cottage cheese grilled in tandoor', 25000, true, true, true),
    ('bb000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000001', 'Chicken 65', 'Spicy, deep-fried chicken bites', 32000, true, false, true),
    
    -- Main Course
    ('bb000000-0000-0000-0000-000000000003', 'aa000000-0000-0000-0000-000000000002', 'Butter Chicken', 'Tender chicken in a rich tomato gravy', 45000, true, false, false),
    ('bb000000-0000-0000-0000-000000000004', 'aa000000-0000-0000-0000-000000000002', 'Dal Makhani', 'Slow-cooked black lentils with cream', 28000, true, true, false),
    ('bb000000-0000-0000-0000-000000000005', 'aa000000-0000-0000-0000-000000000002', 'Garlic Naan', 'Indian flatbread topped with garlic and butter', 8000, true, true, false),
    ('bb000000-0000-0000-0000-000000000006', 'aa000000-0000-0000-0000-000000000002', 'Fried Rice', 'Wok-tossed rice with vegetables and sauces', 18000, true, true, false),
    ('bb000000-0000-0000-0000-000000000007', 'aa000000-0000-0000-0000-000000000002', 'Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 55000, true, false, true),
    
    -- Desserts
    ('bb000000-0000-0000-0000-000000000008', 'aa000000-0000-0000-0000-000000000003', 'Gulab Jamun', 'Deep-fried milk dumplings in sugar syrup', 12000, true, true, false),
    ('bb000000-0000-0000-0000-000000000009', 'aa000000-0000-0000-0000-000000000003', 'Rasmalai', 'Soft cottage cheese dumplings in sweet cream', 15000, true, true, false),
    
    -- Beverages
    ('bb000000-0000-0000-0000-000000000010', 'aa000000-0000-0000-0000-000000000004', 'Mango Lassi', 'Sweet yogurt drink blended with mango', 15000, true, true, false),
    ('bb000000-0000-0000-0000-000000000011', 'aa000000-0000-0000-0000-000000000004', 'Masala Chai', 'Spiced Indian tea with milk', 5000, true, true, false),
    ('bb000000-0000-0000-0000-000000000012', 'aa000000-0000-0000-0000-000000000004', 'Fresh Lime Soda', 'Refreshing lime soda, sweet or salted', 8000, true, true, false)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Suppliers
-- Supplier UUIDs: prefix 'cc00...'
INSERT INTO suppliers (id, name, contact_person, email, phone, address)
VALUES
    ('cc000000-0000-0000-0000-000000000001', 'Fresh Farm Dairy', 'Raj Kumar', 'raj@freshfarm.com', '+919876543210', 'Plot 12, Dairy Park, City'),
    ('cc000000-0000-0000-0000-000000000002', 'Spice Route Imports', 'Priya Singh', 'priya@spiceroute.com', '+919876543211', 'Spice Market, Old City'),
    ('cc000000-0000-0000-0000-000000000003', 'Valley Meat Co.', 'John Doe', 'john@valleymeat.com', '+919876543212', 'Industrial Area, Outskirts')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Ingredients
-- Ingredient UUIDs: prefix 'dd00...'
INSERT INTO ingredients (id, name, unit, current_stock, min_stock_level, cost_per_unit, supplier_id)
VALUES
    ('dd000000-0000-0000-0000-000000000001', 'Paneer (Cottage Cheese)', 'kg', 10.5, 5, 35000, 'cc000000-0000-0000-0000-000000000001'),
    ('dd000000-0000-0000-0000-000000000002', 'Whole Chicken', 'kg', 25.0, 10, 22000, 'cc000000-0000-0000-0000-000000000003'),
    ('dd000000-0000-0000-0000-000000000003', 'Black Lentils (Urad)', 'kg', 30.0, 15, 12000, 'cc000000-0000-0000-0000-000000000002'),
    ('dd000000-0000-0000-0000-000000000004', 'Butter', 'kg', 8.0, 3, 55000, 'cc000000-0000-0000-0000-000000000001'),
    ('dd000000-0000-0000-0000-000000000005', 'Fresh Cream', 'ltr', 12.0, 4, 28000, 'cc000000-0000-0000-0000-000000000001'),
    ('dd000000-0000-0000-0000-000000000006', 'Refined Flour (Maida)', 'kg', 50.0, 20, 4500, 'cc000000-0000-0000-0000-000000000002'),
    ('dd000000-0000-0000-0000-000000000007', 'Mango Pulp', 'ltr', 15.0, 5, 18000, 'cc000000-0000-0000-0000-000000000002'),
    ('dd000000-0000-0000-0000-000000000008', 'Yogurt (Curd)', 'kg', 20.0, 8, 8000, 'cc000000-0000-0000-0000-000000000001'),
    ('dd000000-0000-0000-0000-000000000009', 'Basmati Rice', 'kg', 40.0, 15, 9000, 'cc000000-0000-0000-0000-000000000002'),
    ('dd000000-0000-0000-0000-000000000010', 'Garlic', 'kg', 5.0, 2, 12000, 'cc000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Recipe Items (Connecting Menu Items to Ingredients)
INSERT INTO recipe_items (menu_item_id, ingredient_id, quantity)
VALUES
    -- Paneer Tikka: 0.2kg Paneer
    ('bb000000-0000-0000-0000-000000000001', 'dd000000-0000-0000-0000-000000000001', 0.2),
    
    -- Butter Chicken: 0.3kg Chicken, 0.05kg Butter, 0.05L Cream
    ('bb000000-0000-0000-0000-000000000003', 'dd000000-0000-0000-0000-000000000002', 0.3),
    ('bb000000-0000-0000-0000-000000000003', 'dd000000-0000-0000-0000-000000000004', 0.05),
    ('bb000000-0000-0000-0000-000000000003', 'dd000000-0000-0000-0000-000000000005', 0.05),
    
    -- Dal Makhani: 0.1kg Dal, 0.03kg Butter, 0.03L Cream
    ('bb000000-0000-0000-0000-000000000004', 'dd000000-0000-0000-0000-000000000003', 0.1),
    ('bb000000-0000-0000-0000-000000000004', 'dd000000-0000-0000-0000-000000000004', 0.03),
    ('bb000000-0000-0000-0000-000000000004', 'dd000000-0000-0000-0000-000000000005', 0.03),
    
    -- Garlic Naan: 0.1kg Flour, 0.01kg Butter, 0.01kg Garlic
    ('bb000000-0000-0000-0000-000000000005', 'dd000000-0000-0000-0000-000000000006', 0.1),
    ('bb000000-0000-0000-0000-000000000005', 'dd000000-0000-0000-0000-000000000004', 0.01),
    ('bb000000-0000-0000-0000-000000000005', 'dd000000-0000-0000-0000-000000000010', 0.01),
    
    -- Chicken Biryani: 0.35kg Chicken, 0.2kg Basmati Rice
    ('bb000000-0000-0000-0000-000000000007', 'dd000000-0000-0000-0000-000000000002', 0.35),
    ('bb000000-0000-0000-0000-000000000007', 'dd000000-0000-0000-0000-000000000009', 0.2),
    
    -- Mango Lassi: 0.1L Mango Pulp, 0.15kg Yogurt
    ('bb000000-0000-0000-0000-000000000010', 'dd000000-0000-0000-0000-000000000007', 0.1),
    ('bb000000-0000-0000-0000-000000000010', 'dd000000-0000-0000-0000-000000000008', 0.15)
ON CONFLICT (menu_item_id, ingredient_id) DO NOTHING;
