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

    if (data) {
      return data as PlanningSummary
    }

    // Fallback to monthly_projections
    const { data: projData, error: projError } = await supabase
      .from('monthly_projections' as any)
      .select('planned_amount, type')
      .eq('month', month)
      .eq('year', year)

    if (projError) throw projError

    if (projData && projData.length > 0) {
      const total_revenue = projData
        .filter((p: any) => p.type === 'Receita')
        .reduce((sum: number, p: any) => sum + Number(p.planned_amount), 0)
      const total_expenses = projData
        .filter((p: any) => p.type === 'Despesa')
        .reduce((sum: number, p: any) => sum + Number(p.planned_amount), 0)

      return {
        month,
        year,
        total_revenue,
        total_expenses,
        expenses_breakdown: {},
      } as PlanningSummary
    }

    return null
  },

  async getAllPlannings() {
    const { data: summariesData, error: sumError } = await supabase
      .from('planning_summaries' as any)
      .select('month, year')

    if (sumError) throw sumError

    const { data: projectionsData, error: projError } = await supabase
      .from('monthly_projections' as any)
      .select('month, year')

    if (projError) throw projError

    const uniqueSet = new Set<string>()
    const result: { month: number; year: number }[] = []

    const add = (m: number, y: number) => {
      const key = `${m}-${y}`
      if (!uniqueSet.has(key)) {
        uniqueSet.add(key)
        result.push({ month: m, year: y })
      }
    }

    if (summariesData) {
      summariesData.forEach((d) => add(d.month, d.year))
    }

    if (projectionsData) {
      projectionsData.forEach((d) => add(d.month, d.year))
    }

    result.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })

    return result
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
