DO $$
BEGIN
  -- Empty DO block just to follow structure, we'll use CREATE IF NOT EXISTS below
END $$;

CREATE TABLE IF NOT EXISTS public.monthly_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  category_name TEXT NOT NULL,
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('Receita', 'Despesa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_projections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_projections_select" ON public.monthly_projections;
CREATE POLICY "monthly_projections_select" ON public.monthly_projections
  FOR SELECT TO authenticated USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "monthly_projections_insert" ON public.monthly_projections;
CREATE POLICY "monthly_projections_insert" ON public.monthly_projections
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "monthly_projections_update" ON public.monthly_projections;
CREATE POLICY "monthly_projections_update" ON public.monthly_projections
  FOR UPDATE TO authenticated USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "monthly_projections_delete" ON public.monthly_projections;
CREATE POLICY "monthly_projections_delete" ON public.monthly_projections
  FOR DELETE TO authenticated USING (organization_id = public.get_current_user_org_id());

DROP TRIGGER IF EXISTS set_monthly_projections_org_id_trigger ON public.monthly_projections;
CREATE TRIGGER set_monthly_projections_org_id_trigger BEFORE INSERT ON public.monthly_projections FOR EACH ROW EXECUTE FUNCTION public.set_org_id_on_insert();
