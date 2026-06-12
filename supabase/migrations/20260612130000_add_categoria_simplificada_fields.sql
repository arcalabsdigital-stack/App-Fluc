DO $$
BEGIN
  -- Add new columns for UI customization
  ALTER TABLE public.categoria_simplificada ADD COLUMN IF NOT EXISTS icon text;
  ALTER TABLE public.categoria_simplificada ADD COLUMN IF NOT EXISTS color text;

  -- Drop existing constraint to allow using categoria_simplificada IDs
  ALTER TABLE public.parcelated_transactions DROP CONSTRAINT IF EXISTS compras_parceladas_categoria_id_fkey;
END $$;

-- Make sure we have RLS policies for categoria_simplificada
DROP POLICY IF EXISTS "Users can read all categorias_simplificada" ON public.categoria_simplificada;
DROP POLICY IF EXISTS "Users can insert categorias_simplificada" ON public.categoria_simplificada;
DROP POLICY IF EXISTS "Users can update their own categorias_simplificada" ON public.categoria_simplificada;
DROP POLICY IF EXISTS "Users can delete their own categorias_simplificada" ON public.categoria_simplificada;

CREATE POLICY "Users can read all categorias_simplificada" ON public.categoria_simplificada
  FOR SELECT TO public
  USING (organization_id IS NULL OR organization_id = get_current_user_org_id());

CREATE POLICY "Users can insert categorias_simplificada" ON public.categoria_simplificada
  FOR INSERT TO public
  WITH CHECK (organization_id = get_current_user_org_id());

CREATE POLICY "Users can update their own categorias_simplificada" ON public.categoria_simplificada
  FOR UPDATE TO public
  USING (organization_id = get_current_user_org_id());

CREATE POLICY "Users can delete their own categorias_simplificada" ON public.categoria_simplificada
  FOR DELETE TO public
  USING (organization_id = get_current_user_org_id());
