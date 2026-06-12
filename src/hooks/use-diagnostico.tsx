import { useState, useEffect } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { dashboardService } from '@/services/dashboardService'
import { projectionsService } from '@/services/projectionsService'
import { useAuth } from './use-auth'

export const useDiagnostico = (selectedDate: Date) => {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    realizadoNet: 0,
    planejadoNet: 0,
    hasProjetado: false,
    score: 0,
    gap: 0,
    realizadoReceitas: 0,
    totalPlanejadoReceitas: 0,
    realizadoDespesas: 0,
    totalPlanejadoDespesas: 0,
    revScore: 0,
    marginScore: 0,
    cashScore: 0,
  })

  const { role, currentWorkspace, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!role || role === 'visitante' || !currentWorkspace) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const month = selectedDate.getMonth() + 1
        const year = selectedDate.getFullYear()

        const [transactions, projections] = await Promise.all([
          dashboardService.getTransactionsForPeriod(
            startOfMonth(selectedDate),
            endOfMonth(selectedDate),
          ),
          projectionsService.getProjections(month, year),
        ])

        const realizedReceitas = transactions
          .filter(
            (t) =>
              t.tipo_id === 'Receita' &&
              (t.status === 'pago' || t.status === 'parcial'),
          )
          .reduce((acc, t) => acc + (t.amount_paid || 0), 0)

        const realizedDespesas = transactions
          .filter(
            (t) =>
              t.tipo_id === 'Despesa' &&
              (t.status === 'pago' || t.status === 'parcial'),
          )
          .reduce((acc, t) => acc + (t.amount_paid || 0), 0)

        const planejadoReceitas = projections
          .filter((p) => p.type === 'Receita')
          .reduce((acc, p) => acc + p.planned_amount, 0)

        const planejadoDespesas = projections
          .filter((p) => p.type === 'Despesa')
          .reduce((acc, p) => acc + p.planned_amount, 0)

        const hasProjetado = projections.length > 0

        const realizadoNet = realizedReceitas - realizedDespesas
        const planejadoNet = planejadoReceitas - planejadoDespesas
        const gap = realizadoNet - planejadoNet

        let revScore = 0
        if (planejadoReceitas > 0) {
          const revRatio = realizedReceitas / planejadoReceitas
          revScore = Math.min(revRatio * 40, 40)
        } else if (realizedReceitas > 0) {
          revScore = 40
        }

        let marginScore = 0
        const margin =
          realizedReceitas > 0 ? realizadoNet / realizedReceitas : 0
        if (margin >= 0.2) marginScore = 35
        else if (margin > 0) marginScore = (margin / 0.2) * 35

        let cashScore = 0
        if (realizadoNet > 0) cashScore = 25
        else if (realizadoNet === 0 && realizedReceitas > 0) cashScore = 10

        const score = Math.round(revScore + marginScore + cashScore)

        setMetrics({
          realizadoNet,
          planejadoNet,
          hasProjetado,
          score,
          gap,
          realizadoReceitas,
          totalPlanejadoReceitas: planejadoReceitas,
          realizadoDespesas: realizedDespesas,
          totalPlanejadoDespesas: planejadoDespesas,
          revScore,
          marginScore,
          cashScore,
        })
      } catch (error) {
        console.error('Failed to fetch diagnostico', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedDate, role, currentWorkspace, authLoading])

  return { loading, metrics }
}
