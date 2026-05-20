-- 1. Create the security definer function for super admin check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN (auth.jwt() ->> 'email')::text IN ('marciomorais2722@gmail.com', 'arcalabs.digital@gmail.com');
END;
$function$;

-- 2. Update get_all_users_for_admin to use the new function
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(id uuid, email text, full_name text, role text, is_active boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    u.email::TEXT,
    p.full_name,
    p.role,
    p.is_active,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id;
END;
$function$;

-- 3. Drop existing recursive policies on profiles
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "SuperAdmin can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- 4. Create new profiles policies
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view profiles in their organization" ON public.profiles
  FOR SELECT TO authenticated USING (
    id = auth.uid() 
    OR organization_id IN (SELECT public.get_auth_user_workspaces())
    OR public.is_super_admin()
  );

CREATE POLICY "Admins can update profiles in their organization" ON public.profiles
  FOR UPDATE TO authenticated USING (
    organization_id IN (SELECT public.get_auth_admin_workspaces())
  );

CREATE POLICY "SuperAdmin manage profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_super_admin());

-- 5. Drop and recreate policies for coupons
DROP POLICY IF EXISTS "SuperAdmin manage coupons" ON public.coupons;

CREATE POLICY "SuperAdmin manage coupons" ON public.coupons
  FOR ALL TO authenticated USING (public.is_super_admin());

-- 6. Drop and recreate policies for pending_rewards
DROP POLICY IF EXISTS "SuperAdmin manage pending rewards" ON public.pending_rewards;

CREATE POLICY "SuperAdmin manage pending rewards" ON public.pending_rewards
  FOR ALL TO authenticated USING (public.is_super_admin());

-- 7. Drop and recreate policies for user_workspaces
DROP POLICY IF EXISTS "SuperAdmin can manage user_workspaces" ON public.user_workspaces;

CREATE POLICY "SuperAdmin can manage user_workspaces" ON public.user_workspaces
  FOR ALL TO authenticated USING (public.is_super_admin());

-- 8. Drop and recreate policies for coupon_redemptions
DROP POLICY IF EXISTS "SuperAdmin manage redemptions" ON public.coupon_redemptions;

CREATE POLICY "SuperAdmin manage redemptions" ON public.coupon_redemptions
  FOR ALL TO authenticated USING (public.is_super_admin());

-- 9. Update audit_logs
DROP POLICY IF EXISTS "SuperAdmin view audit logs" ON public.audit_logs;

CREATE POLICY "SuperAdmin view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_super_admin());


-- 10. Seed Super Admin users
DO $seed$
DECLARE
  v_user1_id uuid;
  v_user2_id uuid;
  v_org_id uuid;
BEGIN
  -- Create a default organization for the super admins if they don't have one
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE name = 'Fluc Admin') THEN
    INSERT INTO public.organizations (name) VALUES ('Fluc Admin') RETURNING id INTO v_org_id;
    
    INSERT INTO public.subscriptions (organization_id, plan, status, trial_start, trial_end)
    VALUES (v_org_id, 'Fluxo', 'active', now(), now() + interval '3650 days')
    ON CONFLICT (organization_id) DO NOTHING;
  ELSE
    SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Fluc Admin' LIMIT 1;
  END IF;

  -- User 1: marciomorais2722@gmail.com
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marciomorais2722@gmail.com') THEN
    v_user1_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user1_id,
      '00000000-0000-0000-0000-000000000000',
      'marciomorais2722@gmail.com',
      crypt('Skip@Pass123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marcio Morais", "role": "super_admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, full_name, role, organization_id, is_active)
    VALUES (v_user1_id, 'Marcio Morais', 'super_admin', v_org_id, true)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
    
    INSERT INTO public.user_workspaces (user_id, organization_id, role, is_active)
    VALUES (v_user1_id, v_org_id, 'super_admin', true)
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = EXCLUDED.role;
  ELSE
    SELECT id INTO v_user1_id FROM auth.users WHERE email = 'marciomorais2722@gmail.com';
    UPDATE public.profiles SET role = 'super_admin' WHERE id = v_user1_id;
  END IF;

  -- User 2: arcalabs.digital@gmail.com
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'arcalabs.digital@gmail.com') THEN
    v_user2_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user2_id,
      '00000000-0000-0000-0000-000000000000',
      'arcalabs.digital@gmail.com',
      crypt('Skip@Pass123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Arca Labs", "role": "super_admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, full_name, role, organization_id, is_active)
    VALUES (v_user2_id, 'Arca Labs', 'super_admin', v_org_id, true)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
    
    INSERT INTO public.user_workspaces (user_id, organization_id, role, is_active)
    VALUES (v_user2_id, v_org_id, 'super_admin', true)
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = EXCLUDED.role;
  ELSE
    SELECT id INTO v_user2_id FROM auth.users WHERE email = 'arcalabs.digital@gmail.com';
    UPDATE public.profiles SET role = 'super_admin' WHERE id = v_user2_id;
  END IF;

END $seed$;
