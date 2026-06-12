DO $$
DECLARE
  rec RECORD;
  tx_count INT;
  rec_count INT;
  bud_count INT;
  parc_count INT;
  total_links INT;
BEGIN
  FOR rec IN 
    SELECT * FROM public.categoria_simplificada 
    WHERE COALESCE(criada_por_usuario, false) = false
      AND (
        (nome_simplificado = lower(nome_simplificado) AND nome_simplificado ~ '[a-z]') OR 
        (accounting_group = lower(accounting_group) AND accounting_group ~ '[a-z]') OR
        (tipo_grupo = lower(tipo_grupo) AND tipo_grupo ~ '[a-z]')
      )
  LOOP
    -- Check references in transactions
    SELECT COUNT(*) INTO tx_count FROM public.transactions WHERE category = rec.nome_simplificado OR category = rec.id::text;
    SELECT COUNT(*) INTO rec_count FROM public.recurring_transactions WHERE category = rec.nome_simplificado OR category = rec.id::text;
    SELECT COUNT(*) INTO bud_count FROM public.budgets WHERE category = rec.nome_simplificado OR category = rec.id::text;
    SELECT COUNT(*) INTO parc_count FROM public.parcelated_transactions WHERE category_id = rec.id;
    
    total_links := tx_count + rec_count + bud_count + parc_count;

    IF total_links = 0 THEN
      IF rec.organization_id IS NULL THEN
        -- Standard preservation
        -- Delete only if its tipo_grupo is a lowercase version of the standard groups
        IF upper(rec.tipo_grupo) IN ('RECEITAS', 'CUSTOS DIRETOS', 'CUSTOS FIXOS', 'DESPESAS OPERACIONAIS', 'INVESTIMENTOS', 'DESPESAS PESSOAIS', 'BENS E DIREITOS', 'DÍVIDAS') THEN
          DELETE FROM public.categoria_simplificada WHERE id = rec.id;
        END IF;
      ELSE
        DELETE FROM public.categoria_simplificada WHERE id = rec.id;
      END IF;
    END IF;
  END LOOP;
END $$;
