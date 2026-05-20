DO $$
BEGIN
  -- Update profiles role check constraint safely
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['admin'::text, 'colaborador'::text, 'visitante'::text, 'super_admin'::text]));
END $$;

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
  discount_value NUMERIC NOT NULL,
  valid_until TIMESTAMPTZ,
  usage_limit INT,
  times_used INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payment_id TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pending_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
  discount_value NUMERIC NOT NULL,
  is_applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "SuperAdmin manage coupons" ON public.coupons;
CREATE POLICY "SuperAdmin manage coupons" ON public.coupons FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users can read own redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (
  organization_id IN (SELECT get_auth_user_workspaces())
);
DROP POLICY IF EXISTS "SuperAdmin manage redemptions" ON public.coupon_redemptions;
CREATE POLICY "SuperAdmin manage redemptions" ON public.coupon_redemptions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

ALTER TABLE public.pending_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SuperAdmin manage pending rewards" ON public.pending_rewards;
CREATE POLICY "SuperAdmin manage pending rewards" ON public.pending_rewards FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Profiles & workspaces bypass for super_admin
DROP POLICY IF EXISTS "SuperAdmin can manage profiles" ON public.profiles;
CREATE POLICY "SuperAdmin can manage profiles" ON public.profiles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "SuperAdmin can manage user_workspaces" ON public.user_workspaces;
CREATE POLICY "SuperAdmin can manage user_workspaces" ON public.user_workspaces FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- Admin staff RPC
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin') THEN
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

-- Seed user
DO $$
DECLARE
  new_user_id uuid;
  org_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marciomorais2722@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'marciomorais2722@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin Fluc"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    
    INSERT INTO public.organizations (name, slug) VALUES ('Fluc Management', 'fluc-management') RETURNING id INTO org_id;

    INSERT INTO public.profiles (id, full_name, role, organization_id, is_active, onboarding_completed)
    VALUES (new_user_id, 'Admin Fluc', 'super_admin', org_id, true, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_workspaces (user_id, organization_id, role, is_active)
    VALUES (new_user_id, org_id, 'super_admin', true)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  ELSE
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'marciomorais2722@gmail.com';
    UPDATE public.profiles SET role = 'super_admin' WHERE id = new_user_id;
  END IF;
END $$;
