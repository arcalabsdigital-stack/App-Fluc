-- Migration: Fix QA issues
-- Item 1: Rewrite check_budget_on_transaction to join categories and filter on natureza_contabil = 'Despesa'
-- Item 2: Set search_path TO 'public' on check_budget_on_transaction
-- Item 3: Replace global unique constraints/indexes on categories with scoped per-organization unique indexes

-- ============================================================================
-- ITEM 1 & ITEM 2: Update check_budget_on_transaction()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_budget_on_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    v_budget RECORD;
    v_spent NUMERIC;
    v_month TEXT;
    v_natureza TEXT;
BEGIN
    -- Obter a natureza contábil da categoria da nova/atualizada transação
    SELECT c.natureza_contabil INTO v_natureza
    FROM public.categories c
    WHERE (
        (NEW.category ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND c.id = NEW.category::uuid)
        OR c.nome = NEW.category
    )
    AND (c.organization_id = NEW.organization_id OR c.organization_id IS NULL)
    ORDER BY c.organization_id NULLS LAST
    LIMIT 1;

    -- Apenas categorias com natureza contábil 'Despesa' contam no orçamento
    IF v_natureza = 'Despesa' THEN
        v_month := to_char(NEW.date, 'YYYY-MM');
        
        SELECT * INTO v_budget FROM public.budgets 
        WHERE category = NEW.category 
        AND month = v_month 
        AND organization_id = NEW.organization_id;
        
        IF FOUND THEN
            -- Soma dos gastos da categoria no mês apenas para transações cuja categoria tenha natureza_contabil = 'Despesa'
            SELECT COALESCE(SUM(t.amount), 0) + NEW.amount INTO v_spent
            FROM public.transactions t
            JOIN public.categories c ON (
                (t.category ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND c.id = t.category::uuid)
                OR c.nome = t.category
            )
            AND (c.organization_id = t.organization_id OR c.organization_id IS NULL)
            WHERE t.category = NEW.category 
            AND c.natureza_contabil = 'Despesa'
            AND to_char(t.date, 'YYYY-MM') = v_month
            AND t.organization_id = NEW.organization_id
            AND t.id != NEW.id;
            
            -- Disparar notificação quando a transação atual faz o acumulado atingir ou ultrapassar o orçamento
            IF v_spent >= v_budget.amount AND (v_spent - NEW.amount) < v_budget.amount THEN
                INSERT INTO public.notifications (organization_id, user_id, title, message)
                VALUES (
                    NEW.organization_id, NEW.user_id, 
                    'Alerta de Orçamento', 
                    'Atenção! Você atingiu ou ultrapassou o limite definido para esta categoria.'
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- ITEM 3: Categories uniqueness per organization
-- ============================================================================
-- Remover constraint global UNIQUE (nome, tipo)
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_nome_tipo_unique;
DROP INDEX IF EXISTS public.categories_nome_tipo_unique;

-- Remover índice antigo global categories_nome_unico se existir
DROP INDEX IF EXISTS public.categories_nome_unico;

-- Criar índice único parcial para categorias globais (onde organization_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS categories_global_nome_tipo_unique
    ON public.categories (lower(trim(nome)), tipo)
    WHERE organization_id IS NULL;

-- Criar índice único para categorias customizadas da organização
CREATE UNIQUE INDEX IF NOT EXISTS categories_org_nome_tipo_unique
    ON public.categories (organization_id, lower(trim(nome)), tipo)
    WHERE organization_id IS NOT NULL;
