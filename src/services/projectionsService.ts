import { supabase } from '@/lib/supabase/client'

export interface MonthlyProjection {
  id?: string
  organization_id?: string
  user_id?: string
  month: number
  year: number
  category_name: string
  planned_amount: number
  type: 'Receita' | 'Despesa'
}

export const projectionsService = {
  async getProjections(month: number, year: number) {
    const { data, error } = await supabase
      .from('monthly_projections' as any)
      .select('*')
      .eq('month', month)
      .eq('year', year)

    if (error) throw error
    return data as MonthlyProjection[]
  },

  async saveProjections(
    month: number,
    year: number,
    projections: MonthlyProjection[],
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not found')

    const { error: deleteError } = await supabase
      .from('monthly_projections' as any)
      .delete()
      .eq('month', month)
      .eq('year', year)

    if (deleteError) throw deleteError

    if (projections.length === 0) return

    const toInsert = projections.map((p) => ({
      ...p,
      user_id: user.id,
    }))

    const { error: insertError } = await supabase
      .from('monthly_projections' as any)
      .insert(toInsert)

    if (insertError) throw insertError
  },
}
