import { supabase } from '@/lib/supabase/client'

export interface CategoriaSimplificada {
  id: string
  organization_id: string | null
  nome_simplificado: string
  tipo_grupo: string
  natureza_contabil: string
  efeito_caixa: string
  accounting_group: string
  permite_customizacao: boolean
  criada_por_usuario: boolean
  icon: string | null
  color: string | null
}

export const categoryService = {
  async fetchCategories() {
    const { data, error } = await supabase
      .from('categoria_simplificada')
      .select('*')
      .order('nome_simplificado')

    if (error) throw error
    return data as CategoriaSimplificada[]
  },

  async createCategory(category: Partial<CategoriaSimplificada>) {
    const org_id = (await supabase.rpc('get_current_user_org_id')).data
    const { data, error } = await supabase
      .from('categoria_simplificada')
      .insert({
        ...category,
        organization_id: org_id,
        criada_por_usuario: true,
        natureza_contabil: category.natureza_contabil || 'Despesa',
        efeito_caixa: category.efeito_caixa || 'Com Efeito',
        accounting_group:
          category.accounting_group || category.tipo_grupo || 'Outros',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateCategory(id: string, updates: Partial<CategoriaSimplificada>) {
    const { data, error } = await supabase
      .from('categoria_simplificada')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
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

    const { error } = await supabase
      .from('categoria_simplificada')
      .delete()
      .eq('id', id)

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
