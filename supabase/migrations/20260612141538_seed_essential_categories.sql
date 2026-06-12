DO $$
BEGIN
  INSERT INTO public.categoria_simplificada (
    nome_simplificado, 
    tipo_grupo, 
    natureza_contabil, 
    efeito_caixa, 
    accounting_group, 
    permite_customizacao, 
    criada_por_usuario, 
    icon, 
    color
  )
  SELECT * FROM (VALUES
    ('Aplicações Financeiras', 'INVESTIMENTOS', 'Despesa', 'Saída', 'INVESTIMENTOS', false, false, 'TrendingUp', 'bg-blue-500'),
    ('Resgate de Investimentos', 'INVESTIMENTOS', 'Receita', 'Entrada', 'INVESTIMENTOS', false, false, 'TrendingDown', 'bg-green-500'),
    ('Assinaturas e Softwares (SaaS)', 'CUSTOS FIXOS', 'Despesa', 'Saída', 'CUSTOS FIXOS', false, false, 'Monitor', 'bg-purple-500'),
    ('Serviços de Terceiros', 'CUSTOS FIXOS', 'Despesa', 'Saída', 'CUSTOS FIXOS', false, false, 'Briefcase', 'bg-yellow-500'),
    ('Pró-labore / Retirada', 'DESPESAS PESSOAIS', 'Despesa', 'Saída', 'DESPESAS PESSOAIS', false, false, 'User', 'bg-pink-500'),
    ('Reembolsos Pessoais', 'DESPESAS PESSOAIS', 'Despesa', 'Saída', 'DESPESAS PESSOAIS', false, false, 'Receipt', 'bg-orange-500')
  ) AS v(nome_simplificado, tipo_grupo, natureza_contabil, efeito_caixa, accounting_group, permite_customizacao, criada_por_usuario, icon, color)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categoria_simplificada 
    WHERE nome_simplificado = v.nome_simplificado 
      AND tipo_grupo = v.tipo_grupo 
      AND organization_id IS NULL
  );
END $$;
