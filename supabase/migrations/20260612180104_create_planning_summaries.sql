CREATE TABLE IF NOT EXISTS public.planning_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  total_revenue numeric NOT NULL DEFAULT 0,
  revenue_source text,
  total_expenses numeric NOT NULL DEFAULT 0,
  expenses_breakdown jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, month, year)
);

ALTER TABLE public.planning_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view planning_summaries in their org" ON public.planning_summaries;
CREATE POLICY "Users can view planning_summaries in their org"
  ON public.planning_summaries FOR SELECT
  TO authenticated USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can insert planning_summaries in their org" ON public.planning_summaries;
CREATE POLICY "Users can insert planning_summaries in their org"
  ON public.planning_summaries FOR INSERT
  TO authenticated WITH CHECK (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can update planning_summaries in their org" ON public.planning_summaries;
CREATE POLICY "Users can update planning_summaries in their org"
  ON public.planning_summaries FOR UPDATE
  TO authenticated USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Users can delete planning_summaries in their org" ON public.planning_summaries;
CREATE POLICY "Users can delete planning_summaries in their org"
  ON public.planning_summaries FOR DELETE
  TO authenticated USING (organization_id = public.get_current_user_org_id());

DROP TRIGGER IF EXISTS set_planning_summaries_org_id_trigger ON public.planning_summaries;
CREATE TRIGGER set_planning_summaries_org_id_trigger
  BEFORE INSERT ON public.planning_summaries
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id_on_insert();
