DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.categoria_simplificada (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
      nome_simplificado VARCHAR NOT NULL,
      tipo_grupo VARCHAR NOT NULL,
      natureza_contabil VARCHAR NOT NULL,
      efeito_caixa VARCHAR NOT NULL,
      accounting_group VARCHAR NOT NULL,
      permite_customizacao BOOLEAN DEFAULT false,
      criada_por_usuario BOOLEAN DEFAULT false
  );

  CREATE TABLE IF NOT EXISTS public.dicas_contextuais (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      categoria_simplificada_id UUID REFERENCES public.categoria_simplificada(id) ON DELETE CASCADE,
      titulo VARCHAR NOT NULL,
      descricao TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.dicas_lidas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
      dica_id UUID REFERENCES public.dicas_contextuais(id) ON DELETE CASCADE,
      UNIQUE(organization_id, dica_id)
  );
END $$;

ALTER TABLE public.categoria_simplificada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dicas_contextuais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dicas_lidas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read global categorias_simplificada" ON public.categoria_simplificada;
  CREATE POLICY "Public read global categorias_simplificada" ON public.categoria_simplificada FOR SELECT USING (organization_id IS NULL OR organization_id = public.get_current_user_org_id());

  DROP POLICY IF EXISTS "Users can insert categorias_simplificada" ON public.categoria_simplificada;
  CREATE POLICY "Users can insert categorias_simplificada" ON public.categoria_simplificada FOR INSERT WITH CHECK (organization_id = public.get_current_user_org_id());

  DROP POLICY IF EXISTS "Public read dicas_contextuais" ON public.dicas_contextuais;
  CREATE POLICY "Public read dicas_contextuais" ON public.dicas_contextuais FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Users can read dicas_lidas" ON public.dicas_lidas;
  CREATE POLICY "Users can read dicas_lidas" ON public.dicas_lidas FOR SELECT USING (organization_id = public.get_current_user_org_id());

  DROP POLICY IF EXISTS "Users can insert dicas_lidas" ON public.dicas_lidas;
  CREATE POLICY "Users can insert dicas_lidas" ON public.dicas_lidas FOR INSERT WITH CHECK (organization_id = public.get_current_user_org_id());
END $$;

DO $$
DECLARE
  cat_reunioes UUID := gen_random_uuid();
  cat_maquinas UUID := gen_random_uuid();
  cat_emprestimos UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.categoria_simplificada WHERE nome_simplificado = 'Reuniões com Clientes') THEN
    INSERT INTO public.categoria_simplificada (id, nome_simplificado, tipo_grupo, natureza_contabil, efeito_caixa, accounting_group) VALUES
    (cat_reunioes, 'Reuniões com Clientes', 'DESPESAS OPERACIONAIS', 'Despesa', 'Caixa_Negativo', 'Resultado'),
    (cat_maquinas, 'Máquinas e Equipamentos', 'BENS E DIREITOS', 'Ativo', 'Caixa_Negativo', 'Ativo Não-Circulante'),
    (cat_emprestimos, 'Empréstimos Bancários', 'DÍVIDAS', 'Passivo', 'Caixa_Positivo', 'Passivo Não-Circulante'),
    (gen_random_uuid(), 'Vendas de Produtos', 'RECEITAS', 'Receita', 'Caixa_Positivo', 'Resultado'),
    (gen_random_uuid(), 'Prestação de Serviços', 'RECEITAS', 'Receita', 'Caixa_Positivo', 'Resultado'),
    (gen_random_uuid(), 'Matéria-prima', 'CUSTOS DIRETOS', 'Despesa', 'Caixa_Negativo', 'Resultado'),
    (gen_random_uuid(), 'Impostos sobre Vendas', 'CUSTOS DIRETOS', 'Despesa', 'Caixa_Negativo', 'Resultado'),
    (gen_random_uuid(), 'Aluguel e Condomínio', 'DESPESAS OPERACIONAIS', 'Despesa', 'Caixa_Negativo', 'Resultado'),
    (gen_random_uuid(), 'Salários e Encargos', 'DESPESAS OPERACIONAIS', 'Despesa', 'Caixa_Negativo', 'Resultado'),
    (gen_random_uuid(), 'Reformas e Instalações', 'BENS E DIREITOS', 'Ativo', 'Caixa_Negativo', 'Ativo Não-Circulante'),
    (gen_random_uuid(), 'Estoque de Produtos', 'BENS E DIREITOS', 'Ativo', 'Caixa_Negativo', 'Ativo Circulante'),
    (gen_random_uuid(), 'Financiamentos', 'DÍVIDAS', 'Passivo', 'Caixa_Positivo', 'Passivo Não-Circulante')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.dicas_contextuais (categoria_simplificada_id, titulo, descricao) VALUES
    (cat_reunioes, 'Por que separar Reuniões?', 'Separar gastos com reuniões ajuda a entender o custo de aquisição e retenção de clientes.'),
    (cat_maquinas, 'Máquinas são Ativos', 'Quando você compra uma máquina, o dinheiro sai do caixa, mas a máquina fica na empresa como um Bem (Ativo). Ela sofre depreciação ao longo do tempo.'),
    (cat_emprestimos, 'Empréstimos', 'O dinheiro do empréstimo entra no seu caixa (positivo), mas cria uma obrigação (Passivo) que deverá ser paga parceladamente.')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
