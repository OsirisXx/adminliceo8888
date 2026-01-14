-- =====================================================
-- SUPER ADMIN ACCOUNT SETUP
-- Liceo de Cagayan University - Complaint System
-- =====================================================
-- 
-- STEP 1: Create user in Supabase Dashboard
-- -----------------------------------------
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to: Authentication > Users > Add User
-- 3. Enter:
--    - Email: superadmin@liceo.edu.ph
--    - Password: password
--    - Check "Auto Confirm User" to skip email verification
-- 4. Click "Create User"
--
-- STEP 2: Run this script in SQL Editor
-- --------------------------------------
-- After creating the user in the dashboard, run this SQL
-- to assign the super_admin role.
-- =====================================================

-- Assign super_admin role to the user
DO $$
DECLARE
  target_user_id UUID;
  target_email TEXT := 'superadmin@liceo.edu.ph';
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users. Please create the user in Supabase Dashboard first (Authentication > Users > Add User).', target_email;
  END IF;
  
  -- Insert or update the user in public.users table with super_admin role
  INSERT INTO public.users (id, email, role, full_name, department, created_at)
  VALUES (
    target_user_id, 
    target_email, 
    'super_admin', 
    'Super Administrator',
    NULL, 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = 'super_admin',
    full_name = 'Super Administrator',
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Super admin role assigned successfully!';
  RAISE NOTICE '   Email: %', target_email;
  RAISE NOTICE '   User ID: %', target_user_id;
  RAISE NOTICE '   You can now login at /super-admin';
END $$;

-- Verify the user was created
SELECT id, email, role, full_name, created_at 
FROM public.users 
WHERE email = 'superadmin@liceo.edu.ph';
