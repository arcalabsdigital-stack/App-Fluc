import { useState, useEffect, useMemo } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { dashboardService } from '@/services/dashboardService'
import { Transacao, TipoTransacao } from '@/lib/types'

export function useDiagnostico(selectedDate: Date) {
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const start = startOfMonth(selectedDate)
        const end = endOfMonth(selectedDate)
        const [txs, cats] = await Promise.all([
          dashboardService.getTransactionsForPeriod(start, end),
          dashboardService.getCategories(),
        ])
        setTransactions(txs)
        setCategories(cats)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedDate])

  const catMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.grupo || ''))
    return map
  }, [categories])

  const metrics = useMemo(() => {
    let planejadoReceitas = 0
    let planejadoDespesas = 0
    let realizadoReceitas = 0
    let realizadoDespesas = 0
    let pendenteTotal = 0

    transactions.forEach((t) => {
      const grupo = catMap.get(t.categoria_id) || ''
      const upperGrupo = grupo.toUpperCase()
      const isReceita =
        upperGrupo === 'RECEITAS' || t.tipo_id === TipoTransacao.Receita
      const isDespesa =
        [
          'CUSTOS DIRETOS',
          'CUSTOS FIXOS',
          'DESPESAS OPERACIONAIS',
          'DESPESAS PESSOAIS',
          'INVESTIMENTOS',
          'DÍVIDAS',
          'BENS E DIREITOS',
        ].includes(upperGrupo) || t.tipo_id === TipoTransacao.Despesa

      const valor = t.valor || 0
      const pago = t.amount_paid || 0

      if (t.status === 'aberto') {
        pendenteTotal += valor
        if (isReceita) planejadoReceitas += valor
        if (isDespesa) planejadoDespesas += valor
      } else if (t.status === 'pago') {
        if (isReceita) realizadoReceitas += pago
        if (isDespesa) realizadoDespesas += pago
      } else if (t.status === 'parcial') {
        if (isReceita) {
          realizadoReceitas += pago
          planejadoReceitas += Math.max(0, valor - pago)
        }
        if (isDespesa) {
          realizadoDespesas += pago
          planejadoDespesas += Math.max(0, valor - pago)
        }
        pendenteTotal += Math.max(0, valor - pago)
      }
    })

    const hasProjetado = pendenteTotal > 0
    const totalPlanejadoReceitas = planejadoReceitas + realizadoReceitas
    const totalPlanejadoDespesas = planejadoDespesas + realizadoDespesas

    const planejadoNet = totalPlanejadoReceitas - totalPlanejadoDespesas
    const realizadoNet = realizadoReceitas - realizadoDespesas
    const gap = realizadoNet - planejadoNet

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
  }, [transactions, catMap])

  return { loading, metrics }
}
