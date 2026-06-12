import { useState, useEffect, useMemo } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { dashboardService } from '@/services/dashboardService'
import { planningService, PlanningSummary } from '@/services/planningService'
import { Transacao } from '@/lib/types'

export function useDiagnostico(selectedDate: Date) {
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [planningSummary, setPlanningSummary] =
    useState<PlanningSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const start = startOfMonth(selectedDate)
        const end = endOfMonth(selectedDate)
        const month = selectedDate.getMonth() + 1
        const year = selectedDate.getFullYear()

        const [txs, summary] = await Promise.all([
          dashboardService.getTransactionsForPeriod(start, end),
          planningService.getPlanning(month, year),
        ])
        setTransactions(txs)
        setPlanningSummary(summary)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedDate])

  const metrics = useMemo(() => {
    let planejadoReceitas = planningSummary?.total_revenue || 0
    let planejadoDespesas = planningSummary?.total_expenses || 0
    let realizadoReceitas = 0
    let realizadoDespesas = 0

    transactions.forEach((t) => {
      // Cast to any to handle type safely without ts errors based on existing structure
      const isReceita = (t as any).tipo_id === 'Receita' || t.type === 'Receita'
      const isDespesa = (t as any).tipo_id === 'Despesa' || t.type === 'Despesa'
      const pago = t.amount_paid || 0

      if (t.status === 'pago' || t.status === 'parcial') {
        if (isReceita) realizadoReceitas += pago
        if (isDespesa) realizadoDespesas += pago
      }
    })

    const hasProjetado = !!planningSummary
    const totalPlanejadoReceitas = planejadoReceitas
    const totalPlanejadoDespesas = planejadoDespesas

    const planejadoNet = totalPlanejadoReceitas - totalPlanejadoDespesas
    const realizadoNet = realizadoReceitas - realizadoDespesas

    let gap = 0
    if (hasProjetado) {
      gap = realizadoNet - planejadoNet
      if (
        totalPlanejadoReceitas > 0 &&
        realizadoReceitas === 0 &&
        realizadoDespesas === 0
      ) {
        gap = -planejadoNet
      }
    }

    let score = 0
    let revScore = 0
    let marginScore = 0
    let cashScore = 0

    if (hasProjetado) {
      if (totalPlanejadoReceitas > 0) {
        revScore = Math.min(realizadoReceitas / totalPlanejadoReceitas, 1) * 40
      }
      if (realizadoReceitas > 0) {
        const margin = realizadoNet / realizadoReceitas
        if (margin >= 0.2) marginScore = 35
        else if (margin > 0) marginScore = (margin / 0.2) * 35
      }
      if (realizadoNet > 0) {
        cashScore = 25
      } else if (realizadoNet === 0 && realizadoReceitas > 0) {
        cashScore = 10
      }

      score = Math.round(revScore + marginScore + cashScore)

      if (score === 100) {
        if (
          realizadoReceitas + realizadoDespesas === 0 ||
          totalPlanejadoReceitas === 0 ||
          realizadoNet < planejadoNet
        ) {
          score = 99
        }
      }
    }

    return {
      hasProjetado,
      planejadoReceitas,
      planejadoDespesas,
      realizadoReceitas,
      realizadoDespesas,
      totalPlanejadoReceitas,
      totalPlanejadoDespesas,
      planejadoNet,
      realizadoNet,
      gap,
      score,
      revScore,
      marginScore,
      cashScore,
    }
  }, [transactions, planningSummary])

  return { loading, metrics }
}
