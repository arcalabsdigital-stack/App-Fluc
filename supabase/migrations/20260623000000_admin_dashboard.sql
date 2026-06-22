CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_total_workspaces INT;
  v_new_workspaces INT;
  v_total_transactions INT;
  v_cold_clients INT;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO v_total_workspaces FROM organizations;
  
  SELECT COUNT(*) INTO v_new_workspaces FROM organizations 
  WHERE created_at >= NOW() - INTERVAL '30 days';
  
  SELECT COUNT(*) INTO v_total_transactions FROM transactions;
  
  SELECT COUNT(*) INTO v_cold_clients 
  FROM organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM transactions t WHERE t.organization_id = o.id AND t.created_at >= NOW() - INTERVAL '15 days'
  )
  AND o.updated_at < NOW() - INTERVAL '15 days';

  RETURN json_build_object(
    'total_workspaces', v_total_workspaces,
    'new_workspaces', v_new_workspaces,
    'total_transactions', v_total_transactions,
    'cold_clients', v_cold_clients
  );
END;
$function$;

CREATE OR REPLACE FUNCTION get_admin_customers()
RETURNS TABLE (
  organization_id UUID,
  workspace_name TEXT,
  owner_name TEXT,
  owner_email TEXT,
  coupon_code TEXT,
  transaction_volume INT,
  last_activity TIMESTAMPTZ,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    o.id AS organization_id,
    o.name AS workspace_name,
    (SELECT p.full_name FROM user_workspaces uw JOIN profiles p ON p.id = uw.user_id WHERE uw.organization_id = o.id AND uw.role = 'admin' LIMIT 1) AS owner_name,
    (SELECT u.email::TEXT FROM user_workspaces uw JOIN auth.users u ON u.id = uw.user_id WHERE uw.organization_id = o.id AND uw.role = 'admin' LIMIT 1) AS owner_email,
    (SELECT cp.code FROM coupon_redemptions cr JOIN coupons cp ON cp.id = cr.coupon_id WHERE cr.organization_id = o.id ORDER BY cr.applied_at DESC LIMIT 1) AS coupon_code,
    (SELECT COUNT(*)::INT FROM transactions t WHERE t.organization_id = o.id) AS transaction_volume,
    GREATEST(
      o.updated_at,
      (SELECT MAX(created_at) FROM transactions t WHERE t.organization_id = o.id)
    ) AS last_activity,
    COALESCE((SELECT bool_and(uw.is_active) FROM user_workspaces uw WHERE uw.organization_id = o.id), true) AS is_active
  FROM organizations o
  ORDER BY o.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION toggle_organization_status(p_org_id UUID, p_is_active BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE user_workspaces SET is_active = p_is_active WHERE organization_id = p_org_id;
  UPDATE profiles SET is_active = p_is_active WHERE organization_id = p_org_id;
END;
$function$;

CREATE OR REPLACE FUNCTION apply_coupon_to_organization(p_org_id UUID, p_coupon_code TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_coupon_id UUID;
  v_user_id UUID;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT id INTO v_coupon_id FROM coupons WHERE code = p_coupon_code AND is_active = true;
  IF v_coupon_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Cupom inválido ou inativo');
  END IF;
  
  SELECT user_id INTO v_user_id FROM user_workspaces WHERE organization_id = p_org_id AND role = 'admin' LIMIT 1;
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Nenhum admin encontrado na organização');
  END IF;

  INSERT INTO coupon_redemptions (coupon_id, organization_id, user_id)
  VALUES (v_coupon_id, p_org_id, v_user_id);
  
  RETURN json_build_object('success', true);
END;
$function$;
