import { useState, useEffect, useMemo } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { dashboardService } from '@/services/dashboardService'
import { Transacao } from '@/lib/types'

export function useDiagnostico(selectedDate: Date) {
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [projections, setProjections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const start = startOfMonth(selectedDate)
        const end = endOfMonth(selectedDate)
        const month = selectedDate.getMonth() + 1
        const year = selectedDate.getFullYear()

        const [txs, projs] = await Promise.all([
          dashboardService.getTransactionsForPeriod(start, end),
          dashboardService.getProjections(month, year),
        ])
        setTransactions(txs)
        setProjections(projs)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedDate])

  const metrics = useMemo(() => {
    let planejadoReceitas = 0
    let planejadoDespesas = 0
    let realizadoReceitas = 0
    let realizadoDespesas = 0

    projections.forEach((p) => {
      if (p.type === 'Receita')
        planejadoReceitas += Number(p.planned_amount) || 0
      if (p.type === 'Despesa')
        planejadoDespesas += Number(p.planned_amount) || 0
    })

    transactions.forEach((t) => {
      const isReceita = t.tipo_id === 'Receita'
      const isDespesa = t.tipo_id === 'Despesa'
      const pago = t.amount_paid || 0

      if (t.status === 'pago' || t.status === 'parcial') {
        if (isReceita) realizadoReceitas += pago
        if (isDespesa) realizadoDespesas += pago
      }
    })

    const hasProjetado = projections.length > 0
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
  }, [transactions, projections])

  return { loading, metrics }
}
