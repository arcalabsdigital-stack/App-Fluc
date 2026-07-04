-- Fix: The migration 20260703034350_simplify_plans_and_extend_trial.sql failed
-- because handle_new_user() was missing LANGUAGE plpgsql. This new migration
-- re-applies all changes from that failed migration with the fix.

-- 1. Remove legacy plans
DELETE FROM public.plans WHERE name IN ('Fluxo', 'Lucro', 'Patrimônio');

-- 2. Insert/update new simplified plans
INSERT INTO public.plans (name, price, price_mensal, price_anual, billing_period, desconto_anual_percentual, features) VALUES
  ('Mensal', 49.90, 49.90, 0, 'mensal', 0, '["Acesso completo ao Fluc", "Dashboard financeiro", "Transações ilimitadas", "Conciliação bancária", "DRE e Valuation", "Suporte por e-mail"]'::jsonb),
  ('Anual', 29.90, 29.90, 358.80, 'anual', 40.02, '["Acesso completo ao Fluc", "Dashboard financeiro", "Transações ilimitadas", "Conciliação bancária", "DRE e Valuation", "Suporte por e-mail", "Suporte prioritário", "2 meses grátis"]'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  price_mensal = EXCLUDED.price_mensal,
  price_anual = EXCLUDED.price_anual,
  billing_period = EXCLUDED.billing_period,
  desconto_anual_percentual = EXCLUDED.desconto_anual_percentual,
  features = EXCLUDED.features;

-- 3. Migrate legacy subscriptions to Mensal
UPDATE public.subscriptions SET plan = 'Mensal' WHERE plan IN ('Fluxo', 'Lucro', 'Patrimônio');

-- 4. Migrate legacy profiles to Mensal
UPDATE public.profiles SET plan = 'Mensal' WHERE plan IN ('Fluxo', 'Lucro', 'Patrimônio');

-- 5. Update create_new_workspace to use 14-day trial and default plan 'Mensal'
CREATE OR REPLACE FUNCTION public.create_new_workspace(
  p_name TEXT,
  p_cnpj TEXT,
  p_corporate_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_org_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.organizations (name, cnpj, corporate_name)
  VALUES (p_name, p_cnpj, p_corporate_name)
  RETURNING id INTO v_org_id;

  INSERT INTO public.user_workspaces (user_id, organization_id, role, is_active)
  VALUES (auth.uid(), v_org_id, 'admin', true);

  INSERT INTO public.subscriptions (organization_id, plan, status, trial_start, trial_end)
  VALUES (v_org_id, 'Mensal', 'trial', now(), now() + interval '14 days');

  UPDATE public.profiles
  SET organization_id = v_org_id
  WHERE id = auth.uid();

  RETURN v_org_id;
END;
$function$;

-- 6. Update handle_new_user to use 14-day trial and default plan 'Mensal'
--    FIX: Added LANGUAGE plpgsql and SECURITY DEFINER (were missing in the
--    failed migration, causing ERROR 42P13: no language specified)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  org_id UUID;
  new_role TEXT;
  v_must_change_password BOOLEAN;
  v_org_name TEXT;
  v_plan TEXT;
BEGIN
  v_must_change_password := COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false);

  BEGIN
    org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    org_id := NULL;
  END;

  new_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  v_plan := NEW.raw_user_meta_data->>'plan';

  IF org_id IS NULL THEN
     v_org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', NEW.raw_user_meta_data->>'full_name' || ' - Organização', 'Minha Organização');
     INSERT INTO public.organizations (name) VALUES (v_org_name) RETURNING id INTO org_id;
     new_role := 'admin';

     INSERT INTO public.subscriptions (organization_id, plan, status, trial_start, trial_end)
     VALUES (org_id, COALESCE(v_plan, 'Mensal'), 'trial', now(), now() + interval '14 days');
  END IF;

  BEGIN
    IF org_id IS NOT NULL THEN
      INSERT INTO public.profiles (id, full_name, role, organization_id, is_active, must_change_password, plan)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', new_role, org_id, true, v_must_change_password, COALESCE(v_plan, 'Mensal'))
      ON CONFLICT (id) DO UPDATE SET plan = EXCLUDED.plan WHERE profiles.plan IS NULL;

      INSERT INTO public.user_workspaces (user_id, organization_id, role, is_active)
      VALUES (NEW.id, org_id, new_role, true)
      ON CONFLICT (user_id, organization_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user profile insert failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;
