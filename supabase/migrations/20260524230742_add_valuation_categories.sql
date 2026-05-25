DO $$
BEGIN
  INSERT INTO public.categories (nome, tipo, grupo, accounting_group) VALUES
    ('Reuniões e Representação', 'Despesa', 'Marketing e Vendas', 'Operacional'),
    ('Assistência Médica', 'Despesa', 'Pessoal e Benefícios', 'Operacional'),
    ('Cesta Básica', 'Despesa', 'Pessoal e Benefícios', 'Operacional'),
    ('Impostos e Deduções', 'Despesa', 'Custos e Impostos', 'Dedução'),
    ('CMV/CPV', 'Despesa', 'Custos e Impostos', 'Custo Direto'),
    ('Depreciação e Amortização', 'Despesa', 'Gestão Administrativa', 'Não Desembolsável'),
    ('Ativos Imobilizados', 'Receita', 'Estrutura Patrimonial', 'Ativo'),
    ('Investimentos', 'Receita', 'Estrutura Patrimonial', 'Ativo'),
    ('Empréstimos/Financiamentos', 'Despesa', 'Estrutura Patrimonial', 'Passivo'),
    ('Obras e Reformas', 'Despesa', 'Infraestrutura', 'Investimento/Gasto')
  ON CONFLICT (nome, tipo) DO UPDATE SET 
    grupo = EXCLUDED.grupo,
    accounting_group = EXCLUDED.accounting_group;
END $$;
