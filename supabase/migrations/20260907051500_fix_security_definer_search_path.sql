-- Migration: Fix search_path on 14 SECURITY DEFINER functions
-- Adds SET search_path TO 'public' to prevent search_path hijacking vulnerabilities

ALTER FUNCTION public.apply_coupon_to_organization(uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.check_user_email_exists(text) SET search_path TO 'public';
ALTER FUNCTION public.create_new_workspace(text, text, text) SET search_path TO 'public';
ALTER FUNCTION public.get_admin_customers() SET search_path TO 'public';
ALTER FUNCTION public.get_admin_dashboard_stats() SET search_path TO 'public';
ALTER FUNCTION public.get_admin_financial_customers() SET search_path TO 'public';
ALTER FUNCTION public.get_all_users_for_admin() SET search_path TO 'public';
ALTER FUNCTION public.is_super_admin() SET search_path TO 'public';
ALTER FUNCTION public.log_profile_audit() SET search_path TO 'public';
ALTER FUNCTION public.log_transaction_audit() SET search_path TO 'public';
ALTER FUNCTION public.process_recurring_transactions() SET search_path TO 'public';
ALTER FUNCTION public.set_org_id_on_insert() SET search_path TO 'public';
ALTER FUNCTION public.set_transaction_org_id() SET search_path TO 'public';
ALTER FUNCTION public.toggle_organization_status(uuid, boolean) SET search_path TO 'public';
