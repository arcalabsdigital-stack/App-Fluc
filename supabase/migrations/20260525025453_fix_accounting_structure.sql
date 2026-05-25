-- 1. Add new columns to categories
DO $$
BEGIN
  ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS natureza_contabil VARCHAR(50) NOT NULL DEFAULT 'Despesa';
  ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS efeito_caixa VARCHAR(50) NOT NULL DEFAULT 'Sem_efeito';
END $$;

-- 2. Insert specific categories safely
DO $$
BEGIN
  INSERT INTO public.categories (nome, tipo, grupo, natureza_contabil, efeito_caixa, accounting_group) VALUES
    ('Vendas de Produtos', 'Receita', 'Receita Operacional', 'Receita', 'Entrada', 'Receita Operacional'),
    ('Vendas de Serviços', 'Receita', 'Receita Operacional', 'Receita', 'Entrada', 'Receita Operacional'),
    ('Receita Financeira', 'Receita', 'Receita Financeira', 'Receita', 'Entrada', 'Receita Financeira'),
    ('CMV/CPV', 'Despesa', 'Custos e Impostos', 'Despesa', 'Saida', 'Custo Direto'),
    ('Matéria-Prima', 'Despesa', 'Custos e Impostos', 'Despesa', 'Saida', 'Custo Direto'),
    ('Impostos sobre Vendas', 'Despesa', 'Custos e Impostos', 'Despesa', 'Saida', 'Dedução'),
    ('Devoluções e Abatimentos', 'Despesa', 'Custos e Impostos', 'Despesa', 'Saida', 'Dedução'),
    ('Reuniões e Representação', 'Despesa', 'Marketing e Vendas', 'Despesa', 'Saida', 'Operacional'),
    ('Publicidade Digital', 'Despesa', 'Marketing e Vendas', 'Despesa', 'Saida', 'Operacional'),
    ('Comissões de Vendas', 'Despesa', 'Marketing e Vendas', 'Despesa', 'Saida', 'Operacional'),
    ('Salários e Encargos', 'Despesa', 'Pessoal e Benefícios', 'Despesa', 'Saida', 'Operacional'),
    ('Assistência Médica', 'Despesa', 'Pessoal e Benefícios', 'Despesa', 'Saida', 'Operacional'),
    ('Cesta Básica', 'Despesa', 'Pessoal e Benefícios', 'Despesa', 'Saida', 'Operacional'),
    ('Aluguel', 'Despesa', 'Gestão Administrativa', 'Despesa', 'Saida', 'Operacional'),
    ('Software e Ferramentas', 'Despesa', 'Gestão Administrativa', 'Despesa', 'Saida', 'Operacional'),
    ('Combustível', 'Despesa', 'Gestão Administrativa', 'Despesa', 'Saida', 'Operacional'),
    ('Depreciação e Amortização', 'Despesa', 'Gestão Administrativa', 'Despesa', 'Sem_efeito', 'Não Desembolsável'),
    ('Juros Pagos', 'Despesa', 'Resultado Financeiro', 'Despesa', 'Saida', 'Financeira'),
    ('Taxas Bancárias', 'Despesa', 'Resultado Financeiro', 'Despesa', 'Saida', 'Financeira'),
    ('Caixa e Equivalentes', 'Receita', 'Ativo Circulante', 'Ativo', 'Sem_efeito', 'Ativo Circulante'),
    ('Contas a Receber', 'Receita', 'Ativo Circulante', 'Ativo', 'Sem_efeito', 'Ativo Circulante'),
    ('Estoques', 'Receita', 'Ativo Circulante', 'Ativo', 'Sem_efeito', 'Ativo Circulante'),
    ('Ativos Imobilizados', 'Receita', 'Ativo Não-Circulante', 'Ativo', 'Saida', 'Ativo Não-Circulante'),
    ('Investimentos', 'Receita', 'Ativo Não-Circulante', 'Ativo', 'Saida', 'Ativo Não-Circulante'),
    ('Obras e Reformas', 'Receita', 'Ativo Não-Circulante', 'Ativo', 'Saida', 'Ativo Não-Circulante'),
    ('Fornecedores', 'Despesa', 'Passivo Circulante', 'Passivo', 'Saida', 'Passivo Circulante'),
    ('Empréstimos Curto Prazo', 'Despesa', 'Passivo Circulante', 'Passivo', 'Entrada', 'Passivo Circulante'),
    ('Obrigações Trabalhistas', 'Despesa', 'Passivo Circulante', 'Passivo', 'Saida', 'Passivo Circulante'),
    ('Obrigações Fiscais', 'Despesa', 'Passivo Circulante', 'Passivo', 'Saida', 'Passivo Circulante'),
    ('Empréstimos Longo Prazo', 'Despesa', 'Passivo Não-Circulante', 'Passivo', 'Entrada', 'Passivo Não-Circulante'),
    ('Capital Social', 'Receita', 'Patrimônio Líquido', 'PL', 'Entrada', 'Patrimônio Líquido'),
    ('Lucros/Prejuízos Acumulados', 'Receita', 'Patrimônio Líquido', 'PL', 'Sem_efeito', 'Patrimônio Líquido')
  ON CONFLICT (nome, tipo) DO UPDATE SET 
    natureza_contabil = EXCLUDED.natureza_contabil,
    efeito_caixa = EXCLUDED.efeito_caixa,
    accounting_group = EXCLUDED.accounting_group;
END $$;

-- 3. Seed user marciomorais2722@gmail.com
DO $$
DECLARE
  new_user_id uuid;
  new_org_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marciomorais2722@gmail.com') THEN
    new_user_id := gen_random_uuid();
    new_org_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'marciomorais2722@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marcio Morais"}',
      true, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.organizations (id, name) VALUES (new_org_id, 'Marcio Morais Org');

    INSERT INTO public.profiles (id, full_name, role, is_active, must_change_password, organization_id)
    VALUES (new_user_id, 'Marcio Morais', 'super_admin', true, false, new_org_id)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_workspaces (user_id, organization_id, role, is_active)
    VALUES (new_user_id, new_org_id, 'admin', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
