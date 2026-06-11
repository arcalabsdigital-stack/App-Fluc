ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_paid_check CHECK (amount_paid >= 0);

UPDATE public.transactions SET amount_paid = amount WHERE status = 'pago' AND amount_paid = 0;

CREATE OR REPLACE FUNCTION public.get_dashboard_kpi(p_date_now date)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_conciliated_balance NUMERIC := 0;
  v_realized_balance NUMERIC := 0;
  v_projected_balance NUMERIC := 0;
  
  v_available_balance NUMERIC := 0;
  v_invested_balance NUMERIC := 0;

  v_month_income_realized NUMERIC;
  v_month_income_projected NUMERIC;
  
  v_month_expense_realized NUMERIC;
  v_month_expense_projected NUMERIC;
  
  v_last_month_income NUMERIC;
  v_last_month_expense NUMERIC;
  
  v_start_month DATE;
  v_end_month DATE;
  v_start_last_month DATE;
  v_end_last_month DATE;
  v_org_id uuid;
  acc RECORD;
  
  acc_conc NUMERIC;
  acc_real NUMERIC;
  acc_proj NUMERIC;
  transfers_in NUMERIC;
  transfers_out NUMERIC;
BEGIN
  v_org_id := public.get_current_user_org_id();
  v_start_month := date_trunc('month', p_date_now);
  v_end_month := (date_trunc('month', p_date_now) + interval '1 month' - interval '1 day')::date;
  v_start_last_month := date_trunc('month', p_date_now - interval '1 month');
  v_end_last_month := (date_trunc('month', p_date_now) - interval '1 day')::date;

  FOR acc IN SELECT id, tipo, saldo_inicial, data_saldo_inicial FROM public.accounts WHERE organization_id = v_org_id AND is_active = true LOOP
    acc_conc := acc.saldo_inicial;
    acc_real := acc.saldo_inicial;
    acc_proj := acc.saldo_inicial;
    
    -- Conciliated (confirmed transactions)
    acc_conc := acc_conc + COALESCE((
      SELECT SUM(CASE WHEN type = 'Receita' THEN amount_paid ELSE -amount_paid END)
      FROM public.transactions
      WHERE account_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial AND is_conciliated = true
    ), 0);
    
    -- Realized (paid/received)
    acc_real := acc_real + COALESCE((
      SELECT SUM(CASE WHEN type = 'Receita' THEN amount_paid ELSE -amount_paid END)
      FROM public.transactions
      WHERE account_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial
    ), 0);

    -- Projected (realized + remaining pending)
    acc_proj := acc_real + COALESCE((
      SELECT SUM(CASE WHEN type = 'Receita' THEN (amount - amount_paid) ELSE -(amount - amount_paid) END)
      FROM public.transactions
      WHERE account_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial AND status != 'pago'
    ), 0);
    
    transfers_in := COALESCE((
      SELECT SUM(valor) FROM public.transfers WHERE conta_destino_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial
    ), 0);
    transfers_out := COALESCE((
      SELECT SUM(valor) FROM public.transfers WHERE conta_origem_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial
    ), 0);
    
    acc_conc := acc_conc + transfers_in - transfers_out;
    acc_real := acc_real + transfers_in - transfers_out;
    acc_proj := acc_proj + transfers_in - transfers_out;
    
    v_conciliated_balance := v_conciliated_balance + acc_conc;
    v_realized_balance := v_realized_balance + acc_real;
    v_projected_balance := v_projected_balance + acc_proj;
    
    IF acc.tipo IN ('corrente', 'poupanca', 'caixa') THEN
      v_available_balance := v_available_balance + acc_real;
    ELSIF acc.tipo = 'aplicacao' THEN
      v_invested_balance := v_invested_balance + acc_real;
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(amount_paid), 0) INTO v_month_income_realized
  FROM public.transactions
  WHERE type = 'Receita' AND date >= v_start_month AND date <= v_end_month AND organization_id = v_org_id;

  SELECT COALESCE(SUM(amount - amount_paid), 0) INTO v_month_income_projected
  FROM public.transactions
  WHERE type = 'Receita' AND status != 'pago' AND date >= v_start_month AND date <= v_end_month AND organization_id = v_org_id;

  SELECT COALESCE(SUM(amount_paid), 0) INTO v_month_expense_realized
  FROM public.transactions
  WHERE type = 'Despesa' AND date >= v_start_month AND date <= v_end_month AND organization_id = v_org_id;

  SELECT COALESCE(SUM(amount - amount_paid), 0) INTO v_month_expense_projected
  FROM public.transactions
  WHERE type = 'Despesa' AND status != 'pago' AND date >= v_start_month AND date <= v_end_month AND organization_id = v_org_id;

  SELECT COALESCE(SUM(amount_paid), 0) INTO v_last_month_income
  FROM public.transactions
  WHERE type = 'Receita' AND date >= v_start_last_month AND date <= v_end_last_month AND organization_id = v_org_id;

  SELECT COALESCE(SUM(amount_paid), 0) INTO v_last_month_expense
  FROM public.transactions
  WHERE type = 'Despesa' AND date >= v_start_last_month AND date <= v_end_last_month AND organization_id = v_org_id;

  RETURN json_build_object(
    'totalBalance', v_realized_balance, 
    'conciliatedBalance', v_conciliated_balance,
    'realizedBalance', v_realized_balance,
    'projectedBalance', v_projected_balance,
    'availableBalance', v_available_balance,
    'investedBalance', v_invested_balance,
    'monthIncome', v_month_income_realized, 
    'monthExpense', v_month_expense_realized, 
    'monthIncomeRealized', v_month_income_realized,
    'monthIncomeProjected', v_month_income_projected,
    'monthExpenseRealized', v_month_expense_realized,
    'monthExpenseProjected', v_month_expense_projected,
    'lastMonthIncome', v_last_month_income,
    'lastMonthExpense', v_last_month_expense
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_accounts_with_balances()
 RETURNS TABLE(id uuid, organization_id uuid, nome text, tipo text, saldo_inicial numeric, data_saldo_inicial date, is_active boolean, saldo_atual numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.organization_id,
    a.nome,
    a.tipo,
    a.saldo_inicial,
    a.data_saldo_inicial,
    a.is_active,
    a.saldo_inicial + 
    COALESCE((SELECT SUM(CASE WHEN t.type = 'Receita' THEN t.amount_paid ELSE -t.amount_paid END) FROM public.transactions t WHERE t.account_id = a.id AND t.date >= a.data_saldo_inicial), 0) +
    COALESCE((SELECT SUM(tr.valor) FROM public.transfers tr WHERE tr.conta_destino_id = a.id AND tr.date >= a.data_saldo_inicial), 0) -
    COALESCE((SELECT SUM(tr.valor) FROM public.transfers tr WHERE tr.conta_origem_id = a.id AND tr.date >= a.data_saldo_inicial), 0) AS saldo_atual
  FROM public.accounts a
  WHERE a.organization_id = public.get_current_user_org_id()
  ORDER BY a.created_at ASC;
END;
$function$;
