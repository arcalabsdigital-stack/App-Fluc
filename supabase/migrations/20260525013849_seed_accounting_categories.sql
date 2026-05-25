DO $$
BEGIN
  INSERT INTO public.categories (nome, tipo, grupo, accounting_group) VALUES
    ('Impostos e Devoluções', 'Despesa', 'Operacional', 'Deduções da Receita'),
    ('CPV / CMV', 'Despesa', 'Operacional', 'Custos de Vendas'),
    ('Depreciação e Amortização', 'Despesa', 'Operacional', 'Depreciação e Amortização'),
    ('Compra de Imobilizado', 'Despesa', 'Investimento', 'Ativos Imobilizados'),
    ('Venda de Imobilizado', 'Receita', 'Investimento', 'Ativos Imobilizados'),
    ('Aportes em Investimentos', 'Despesa', 'Investimento', 'Investimentos'),
    ('Resgate de Investimentos', 'Receita', 'Investimento', 'Investimentos'),
    ('Empréstimos Adquiridos (Dívida)', 'Receita', 'Financiamento', 'Dívidas (Principal)'),
    ('Amortização de Empréstimos', 'Despesa', 'Financiamento', 'Dívidas (Principal)'),
    ('Adiantamentos de Clientes', 'Receita', 'Operacional', 'Adiantamentos'),
    ('Baixa de Adiantamentos', 'Despesa', 'Operacional', 'Adiantamentos')
  ON CONFLICT (nome, tipo) DO UPDATE SET accounting_group = EXCLUDED.accounting_group;
END $$;
