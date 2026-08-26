import { supabase } from '@/lib/supabase/client'

export type NaturezaContabil =
  | 'Receita'
  | 'Despesa'
  | 'Ativo'
  | 'Passivo'
  | 'PL'
export type EfeitoCaixa = 'Entrada' | 'Saida' | 'Sem_efeito'

export interface Category {
  id: string
  nome: string
  tipo: 'Receita' | 'Despesa'
  grupo: string
  created_at?: string
  accounting_group?: string | null
  natureza_contabil: NaturezaContabil
  efeito_caixa: EfeitoCaixa
  organization_id: string | null
}

const VALID_NATUREZAS: NaturezaContabil[] = [
  'Receita',
  'Despesa',
  'Ativo',
  'Passivo',
  'PL',
]

const VALID_EFEITOS: EfeitoCaixa[] = ['Entrada', 'Saida', 'Sem_efeito']

export const categoryService = {
  async fetchCategories() {
    const org_id = (await supabase.rpc('get_current_user_org_id')).data

    let query = supabase.from('categories').select('*').order('nome')

    if (org_id) {
      query = query.or(`organization_id.is.null,organization_id.eq.${org_id}`)
    } else {
      query = query.is('organization_id', null)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Category[]
  },

  async createCategory(category: {
    nome: string
    grupo: string
    natureza_contabil: NaturezaContabil
    efeito_caixa: EfeitoCaixa
    tipo?: 'Receita' | 'Despesa'
    accounting_group?: string | null
  }) {
    if (
      !category.natureza_contabil ||
      !VALID_NATUREZAS.includes(category.natureza_contabil)
    ) {
      throw new Error(
        `Natureza contábil inválida: ${category.natureza_contabil}`,
      )
    }

    if (
      !category.efeito_caixa ||
      !VALID_EFEITOS.includes(category.efeito_caixa)
    ) {
      throw new Error(`Efeito caixa inválido: ${category.efeito_caixa}`)
    }

    const org_id = (await supabase.rpc('get_current_user_org_id')).data
    const tipo =
      category.tipo ||
      (category.natureza_contabil === 'Receita' ? 'Receita' : 'Despesa')

    const { data, error } = await supabase
      .from('categories')
      .insert({
        nome: category.nome,
        grupo: category.grupo,
        tipo,
        natureza_contabil: category.natureza_contabil,
        efeito_caixa: category.efeito_caixa,
        accounting_group: category.accounting_group || null,
        organization_id: org_id,
      })
      .select()
      .single()

    if (error) throw error
    return data as Category
  },

  async updateCategory(
    id: string,
    updates: Partial<{
      nome: string
      grupo: string
      tipo: 'Receita' | 'Despesa'
      natureza_contabil: NaturezaContabil
      efeito_caixa: EfeitoCaixa
      accounting_group: string | null
    }>,
  ) {
    if (
      updates.natureza_contabil &&
      !VALID_NATUREZAS.includes(updates.natureza_contabil)
    ) {
      throw new Error(
        `Natureza contábil inválida: ${updates.natureza_contabil}`,
      )
    }

    if (updates.efeito_caixa && !VALID_EFEITOS.includes(updates.efeito_caixa)) {
      throw new Error(`Efeito caixa inválido: ${updates.efeito_caixa}`)
    }

    const payload: Record<string, any> = { ...updates }
    if (updates.natureza_contabil && !updates.tipo) {
      payload.tipo =
        updates.natureza_contabil === 'Receita' ? 'Receita' : 'Despesa'
    }

    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Category
  },

  async deleteCategory(id: string, fallbackCategoryId?: string) {
    if (fallbackCategoryId) {
      await supabase
        .from('transactions')
        .update({ category: fallbackCategoryId })
        .eq('category', id)
      await supabase
        .from('recurring_transactions')
        .update({ category: fallbackCategoryId })
        .eq('category', id)
      await supabase
        .from('budgets')
        .update({ category: fallbackCategoryId })
        .eq('category', id)
      await supabase
        .from('parcelated_transactions')
        .update({ category_id: fallbackCategoryId })
        .eq('category_id', id)
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) throw error
  },

  async checkLinkedRecords(id: string) {
    const [tx, rec, bud, parc] = await Promise.all([
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category', id),
      supabase
        .from('recurring_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category', id),
      supabase
        .from('budgets')
        .select('id', { count: 'exact', head: true })
        .eq('category', id),
      supabase
        .from('parcelated_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id),
    ])

    return (
      (tx.count || 0) + (rec.count || 0) + (bud.count || 0) + (parc.count || 0)
    )
  },
}
