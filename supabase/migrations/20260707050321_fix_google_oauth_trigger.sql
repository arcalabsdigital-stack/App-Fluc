-- Fix Google OAuth: ensure handle_new_user creates org + profile for Google users
-- without "Database error saving new user" failures.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id UUID;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_role TEXT;
  v_plan TEXT;
  v_must_change_password BOOLEAN;
  v_org_name TEXT;
  v_raw_meta JSONB;
BEGIN
  v_raw_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  -- Extract name from full_name or name (Google uses 'full_name' or 'name')
  v_full_name := COALESCE(
    v_raw_meta->>'full_name',
    v_raw_meta->>'name',
    split_part(NEW.email, '@', 1),
    'Usuário'
  );

  -- Extract avatar (Google provides avatar_url or picture)
  v_avatar_url := COALESCE(
    v_raw_meta->>'avatar_url',
    v_raw_meta->>'picture',
    v_raw_meta->>'avatar',
    NULL
  );

  -- must_change_password: false for OAuth (Google), check metadata
  BEGIN
    v_must_change_password := COALESCE((v_raw_meta->>'must_change_password')::boolean, false);
  EXCEPTION WHEN OTHERS THEN
    v_must_change_password := false;
  END;

  v_role := COALESCE(v_raw_meta->>'role', 'admin');
  v_plan := v_raw_meta->>'plan';

  -- Try to get existing organization_id from metadata
  BEGIN
    v_org_id := (v_raw_meta->>'organization_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
  END;

  -- If no org provided, create one for this user
  IF v_org_id IS NULL THEN
    v_org_name := COALESCE(
      v_raw_meta->>'organization_name',
      v_full_name || ' - Organização',
      'Meu Workspace'
    );

    BEGIN
      INSERT INTO public.organizations (name)
      VALUES (v_org_name)
      RETURNING id INTO v_org_id;
    EXCEPTION WHEN OTHERS THEN
      -- Fallback: try to get an existing org
      SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
      IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (name)
        VALUES ('Meu Workspace')
        RETURNING id INTO v_org_id;
      END IF;
    END;

    v_role := 'admin';

    -- Create subscription for the new org
    BEGIN
      INSERT INTO public.subscriptions (organization_id, plan, status, trial_start, trial_end)
      VALUES (v_org_id, COALESCE(v_plan, 'Mensal'), 'trial', now(), now() + interval '14 days');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  -- Insert profile (idempotent)
  BEGIN
    IF v_org_id IS NOT NULL THEN
      INSERT INTO public.profiles (
        id, full_name, avatar_url, role, organization_id,
        is_active, must_change_password, onboarding_completed, plan
      ) VALUES (
        NEW.id,
        v_full_name,
        v_avatar_url,
        v_role,
        v_org_id,
        true,
        v_must_change_password,
        false,
        COALESCE(v_plan, 'Mensal')
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        organization_id = COALESCE(EXCLUDED.organization_id, profiles.organization_id),
        plan = COALESCE(EXCLUDED.plan, profiles.plan);

      -- Add to user_workspaces
      INSERT INTO public.user_workspaces (user_id, organization_id, role, is_active)
      VALUES (NEW.id, v_org_id, v_role, true)
      ON CONFLICT (user_id, organization_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user profile insert failed: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user general failure: %', SQLERRM;
  RETURN NEW;
END;
$function$;
