-- =============================================================================
-- Dummy Role Accounts for RestaurantOS
-- =============================================================================
-- STEP 1 (Dashboard): Create the following users via
--   Supabase Dashboard → Authentication → Users → Add user → Create new user
--   Tick "Auto Confirm User" for each.
--
--   owner@restaurant.com    / Test@1234
--   manager@restaurant.com  / Test@1234
--   cashier@restaurant.com  / Test@1234
--   waiter@restaurant.com   / Test@1234
--   kitchen@restaurant.com  / Test@1234
--
-- STEP 2 (SQL Editor): After creating all 5 users above, run THIS file in
--   Supabase Dashboard → SQL Editor to assign the correct roles.
-- =============================================================================

UPDATE public.profiles SET role = 'owner',   full_name = 'Rahul Sharma' WHERE email = 'owner@restaurant.com';
UPDATE public.profiles SET role = 'manager', full_name = 'Priya Mehta'  WHERE email = 'manager@restaurant.com';
UPDATE public.profiles SET role = 'cashier', full_name = 'Ankit Gupta'  WHERE email = 'cashier@restaurant.com';
UPDATE public.profiles SET role = 'waiter',  full_name = 'Suman Das'    WHERE email = 'waiter@restaurant.com';
UPDATE public.profiles SET role = 'kitchen', full_name = 'Chef Ramesh'  WHERE email = 'kitchen@restaurant.com';

-- Verify: should show 5 rows with correct roles
SELECT full_name, email, role, is_active
FROM public.profiles
WHERE email LIKE '%@restaurant.com'
ORDER BY CASE role
  WHEN 'owner'   THEN 1
  WHEN 'manager' THEN 2
  WHEN 'cashier' THEN 3
  WHEN 'waiter'  THEN 4
  WHEN 'kitchen' THEN 5
END;
