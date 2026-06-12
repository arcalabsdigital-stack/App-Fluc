import { supabase } from '@/lib/supabase/client'

export interface PlanningSummary {
  id?: string
  organization_id?: string
  user_id?: string
  month: number
  year: number
  total_revenue: number
  revenue_source?: string
  total_expenses: number
  expenses_breakdown?: Record<string, { enabled: boolean; value: number }>
}

export const planningService = {
  async getPlanning(month: number, year: number) {
    const { data, error } = await supabase
      .from('planning_summaries' as any)
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (error) throw error
    return data as PlanningSummary | null
  },

  async getAllPlannings() {
    const { data, error } = await supabase
      .from('planning_summaries' as any)
      .select('month, year')
      .order('year', { ascending: true })
      .order('month', { ascending: true })

    if (error) throw error
    return data as { month: number; year: number }[]
  },

  async savePlanning(planning: PlanningSummary) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not found')

    const existing = await this.getPlanning(planning.month, planning.year)

    if (existing?.id) {
      const { error } = await supabase
        .from('planning_summaries' as any)
        .update({
          total_revenue: planning.total_revenue,
          revenue_source: planning.revenue_source,
          total_expenses: planning.total_expenses,
          expenses_breakdown: planning.expenses_breakdown,
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('planning_summaries' as any)
        .insert({
          ...planning,
          user_id: user.id,
        })

      if (error) throw error
    }
  },
}
