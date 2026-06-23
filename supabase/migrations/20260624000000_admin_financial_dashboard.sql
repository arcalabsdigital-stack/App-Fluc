CREATE OR REPLACE FUNCTION get_admin_financial_customers()
RETURNS TABLE (
  profile_id UUID,
  organization_id UUID,
  full_name TEXT,
  email TEXT,
  telefone TEXT,
  cnpj_ou_cpf TEXT,
  created_at TIMESTAMPTZ,
  plan TEXT,
  plan_status TEXT,
  metodo_pagamento TEXT,
  current_period_end TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
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
    p.id AS profile_id,
    p.organization_id,
    p.full_name,
    u.email::TEXT,
    p.telefone,
    COALESCE(p.cnpj_ou_cpf, o.cnpj) AS cnpj_ou_cpf,
    p.created_at,
    s.plan,
    s.status AS plan_status,
    (SELECT bh.metodo_pagamento FROM billing_history bh WHERE bh.subscription_id = s.id ORDER BY bh.created_at DESC LIMIT 1) AS metodo_pagamento,
    s.current_period_end,
    u.last_sign_in_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN organizations o ON o.id = p.organization_id
  LEFT JOIN subscriptions s ON s.organization_id = p.organization_id
  ORDER BY p.created_at DESC;
END;
$function$;
