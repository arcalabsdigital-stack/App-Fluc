DROP POLICY IF EXISTS "Users can delete their notifications" ON public.notifications;
CREATE POLICY "Users can delete their notifications" ON public.notifications
  FOR DELETE TO authenticated USING ((user_id = auth.uid()) OR (organization_id = get_current_user_org_id()));
