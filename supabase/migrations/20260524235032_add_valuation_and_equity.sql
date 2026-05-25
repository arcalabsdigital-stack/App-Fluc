DO $$
DECLARE
  new_user_id uuid;
  v_org_id uuid;
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
      '{"name": "Márcio Morais"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.organizations (name)
    VALUES ('Minha Empresa')
    RETURNING id INTO v_org_id;

    INSERT INTO public.profiles (id, email, full_name, organization_id, role)
    VALUES (new_user_id, 'marciomorais2722@gmail.com', 'Márcio Morais', v_org_id, 'admin')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_workspaces (user_id, organization_id, role)
    VALUES (new_user_id, v_org_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

INSERT INTO public.categories (nome, tipo, grupo, accounting_group) VALUES
  ('Reuniões e Representação', 'Despesa', 'Comercial', 'Despesa Operacional'),
  ('Assistência Médica', 'Despesa', 'Pessoal', 'Despesa Operacional'),
  ('Cesta Básica', 'Despesa', 'Pessoal', 'Despesa Operacional'),
  ('Impostos e Deduções', 'Despesa', 'Operacional/Contábil', 'Dedução'),
  ('CMV/CPV', 'Despesa', 'Operacional/Contábil', 'Custo Direto'),
  ('Depreciação e Amortização', 'Despesa', 'Operacional/Contábil', 'Não Desembolsável'),
  ('Ativos Imobilizados', 'Despesa', 'Patrimonial', 'Ativo'),
  ('Investimentos', 'Despesa', 'Patrimonial', 'Ativo'),
  ('Empréstimos/Financiamentos', 'Receita', 'Patrimonial', 'Passivo'),
  ('Obras e Reformas', 'Despesa', 'Infraestrutura', 'Ativo')
ON CONFLICT (nome, tipo) DO UPDATE SET accounting_group = EXCLUDED.accounting_group;

CREATE TABLE IF NOT EXISTS public.equity_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_name text NOT NULL,
  percentage numeric NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equity_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view equity in their org" ON public.equity_shares;
CREATE POLICY "Users can view equity in their org" ON public.equity_shares
  FOR SELECT TO authenticated USING (organization_id = get_current_user_org_id());

DROP POLICY IF EXISTS "Users can insert equity in their org" ON public.equity_shares;
CREATE POLICY "Users can insert equity in their org" ON public.equity_shares
  FOR INSERT TO authenticated WITH CHECK (organization_id = get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update equity in their org" ON public.equity_shares;
CREATE POLICY "Users can update equity in their org" ON public.equity_shares
  FOR UPDATE TO authenticated USING (organization_id = get_current_user_org_id());

DROP POLICY IF EXISTS "Users can delete equity in their org" ON public.equity_shares;
CREATE POLICY "Users can delete equity in their org" ON public.equity_shares
  FOR DELETE TO authenticated USING (organization_id = get_current_user_org_id());

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
  CREATE POLICY "Users can insert notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (organization_id = get_current_user_org_id());

  DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
  CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE TO authenticated USING (organization_id = get_current_user_org_id() AND user_id = auth.uid());

  DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
  CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT TO authenticated USING (organization_id = get_current_user_org_id() AND user_id = auth.uid());
END $$;
