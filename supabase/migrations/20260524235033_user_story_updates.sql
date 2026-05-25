-- Admin Seed
DO $$
DECLARE
  new_user_id uuid;
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
      '{"name": "Admin", "role": "admin"}',
      true, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (new_user_id, 'Márcio Morais', 'admin', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Categories Expansion
INSERT INTO public.categories (nome, tipo, grupo, accounting_group) VALUES
  ('Reuniões e Representação', 'Despesa', 'Comercial', 'Despesa Operacional'),
  ('Assistência Médica', 'Despesa', 'Pessoal', 'Despesa Operacional'),
  ('Cesta Básica', 'Despesa', 'Pessoal', 'Despesa Operacional'),
  ('Impostos e Deduções', 'Despesa', 'Operacional/Contábil', 'Dedução'),
  ('CMV/CPV', 'Despesa', 'Operacional/Contábil', 'Custo Direto'),
  ('Depreciação e Amortização', 'Despesa', 'Operacional/Contábil', 'Não Desembolsável'),
  ('Ativos Imobilizados', 'Despesa', 'Patrimonial', 'Ativo'),
  ('Investimentos', 'Despesa', 'Patrimonial', 'Ativo'),
  ('Empréstimos/Financiamentos', 'Despesa', 'Patrimonial', 'Passivo'),
  ('Obras e Reformas', 'Despesa', 'Infraestrutura', 'Ativo')
ON CONFLICT (nome, tipo) DO NOTHING;

-- Equity Management Module
CREATE TABLE IF NOT EXISTS public.equity_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  percentage NUMERIC NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS equity_shares
ALTER TABLE public.equity_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view equity in their org" ON public.equity_shares;
CREATE POLICY "Users can view equity in their org" ON public.equity_shares
  FOR SELECT TO authenticated USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can insert equity in their org" ON public.equity_shares;
CREATE POLICY "Users can insert equity in their org" ON public.equity_shares
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update equity in their org" ON public.equity_shares;
CREATE POLICY "Users can update equity in their org" ON public.equity_shares
  FOR UPDATE TO authenticated USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can delete equity in their org" ON public.equity_shares;
CREATE POLICY "Users can delete equity in their org" ON public.equity_shares
  FOR DELETE TO authenticated USING (organization_id = public.get_current_user_org_id());

-- Notifications RLS
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR organization_id = public.get_current_user_org_id());
