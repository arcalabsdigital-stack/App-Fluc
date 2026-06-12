import { useState, useEffect, useMemo } from 'react'
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dashboardService } from '@/services/dashboardService'
import {
  projectionsService,
  MonthlyProjection,
} from '@/services/projectionsService'
import { planningService, PlanningSummary } from '@/services/planningService'
import { cn } from '@/lib/utils'
import { Transacao } from '@/lib/types'
import { Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface SimulacaoModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
}

export function SimulacaoModal({
  isOpen,
  onOpenChange,
  selectedDate,
}: SimulacaoModalProps) {
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [projections, setProjections] = useState<MonthlyProjection[]>([])
  const [summaries, setSummaries] = useState<PlanningSummary[]>([])

  const [type, setType] = useState<'Receita' | 'Despesa'>('Despesa')
  const [value, setValue] = useState<string>('')
  const [frequency, setFrequency] = useState<'Unico' | 'Recorrente'>('Unico')
  const [startMonthOffset, setStartMonthOffset] = useState<string>('0')

  const { currentWorkspace, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!isOpen || authLoading || !currentWorkspace) return

    let isMounted = true
    const loadData = async () => {
      setLoading(true)
      try {
        const start = startOfMonth(selectedDate)
        const end = endOfMonth(addMonths(selectedDate, 2))

        const txs = await dashboardService.getTransactionsForPeriod(start, end)

        const projPromises = [0, 1, 2].map((offset) => {
          const d = addMonths(selectedDate, offset)
          return projectionsService.getProjections(
            d.getMonth() + 1,
            d.getFullYear(),
          )
        })

        const sumPromises = [0, 1, 2].map((offset) => {
          const d = addMonths(selectedDate, offset)
          return planningService.getPlanning(d.getMonth() + 1, d.getFullYear())
        })

        const projs = (await Promise.all(projPromises)).flat()
        const sums = (await Promise.all(sumPromises)).filter(
          Boolean,
        ) as PlanningSummary[]

        if (isMounted) {
          setTransactions(txs)
          setProjections(projs)
          setSummaries(sums)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [isOpen, selectedDate, currentWorkspace, authLoading])

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val) {
      val = (parseInt(val, 10) / 100).toFixed(2).replace('.', ',')
      val = val.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }
    setValue(val)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const monthsData = useMemo(() => {
    return [0, 1, 2].map((offset) => {
      const currentMonthDate = addMonths(selectedDate, offset)

      const monthTxs = transactions.filter((t) => {
        const dateStr = t.date || (t as any).data
        if (!dateStr) return false
        const d = new Date(dateStr + 'T00:00:00')
        return (
          d.getMonth() === currentMonthDate.getMonth() &&
          d.getFullYear() === currentMonthDate.getFullYear()
        )
      })

      const monthNum = currentMonthDate.getMonth() + 1
      const yearNum = currentMonthDate.getFullYear()

      const monthProjs = projections.filter(
        (p) => p.month === monthNum && p.year === yearNum,
      )

      const monthSummary = summaries.find(
        (s) => s.month === monthNum && s.year === yearNum,
      )

      const numericValue =
        parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
      let impact = 0
      const startOffset = parseInt(startMonthOffset, 10)

      if (offset >= startOffset) {
        if (frequency === 'Recorrente' || offset === startOffset) {
          impact = type === 'Receita' ? numericValue : -numericValue
        }
      }

      const realizedReceitas = monthTxs
        .filter(
          (t) =>
            (t.type === 'Receita' || (t as any).tipo_id === 'Receita') &&
            (t.status === 'pago' || t.status === 'parcial'),
        )
        .reduce((acc, t) => acc + (t.amount_paid || 0), 0)
      const realizedDespesas = monthTxs
        .filter(
          (t) =>
            (t.type === 'Despesa' || (t as any).tipo_id === 'Despesa') &&
            (t.status === 'pago' || t.status === 'parcial'),
        )
        .reduce((acc, t) => acc + (t.amount_paid || 0), 0)

      const planejadoReceitas =
        monthProjs.length > 0
          ? monthProjs
              .filter((p) => p.type === 'Receita')
              .reduce((acc, p) => acc + p.planned_amount, 0)
          : monthSummary
            ? monthSummary.total_revenue
            : 0

      const planejadoDespesas =
        monthProjs.length > 0
          ? monthProjs
              .filter((p) => p.type === 'Despesa')
              .reduce((acc, p) => acc + p.planned_amount, 0)
          : monthSummary
            ? monthSummary.total_expenses
            : 0

      const hasRealizedTxs = monthTxs.some(
        (t) => t.status === 'pago' || t.status === 'parcial',
      )

      let baseRealizedReceitas = realizedReceitas
      let baseRealizedDespesas = realizedDespesas

      // Fallback para o plano em meses futuros sem transações realizadas
      if (!hasRealizedTxs && offset > 0) {
        baseRealizedReceitas = planejadoReceitas
        baseRealizedDespesas = planejadoDespesas
      }

      let simPlanejadoReceitas = planejadoReceitas
      let simPlanejadoDespesas = planejadoDespesas

      if (impact > 0) {
        simPlanejadoReceitas += impact
      } else if (impact < 0) {
        simPlanejadoDespesas += Math.abs(impact)
      }

      let simRealizedReceitas = baseRealizedReceitas
      let simRealizedDespesas = baseRealizedDespesas

      if (!hasRealizedTxs && offset > 0) {
        simRealizedReceitas = simPlanejadoReceitas
        simRealizedDespesas = simPlanejadoDespesas
      } else {
        if (impact > 0) {
          simRealizedReceitas += impact
        } else if (impact < 0) {
          simRealizedDespesas += Math.abs(impact)
        }
      }

      const calcScore = (
        realRev: number,
        realDesp: number,
        planRev: number,
        planDesp: number,
      ) => {
        const realNet = realRev - realDesp
        const planNet = planRev - planDesp
        const gap = realNet - planNet

        let revScore = 0
        if (planRev > 0) {
          const revRatio = realRev / planRev
          revScore = Math.min(revRatio * 40, 40)
        } else if (realRev > 0) {
          revScore = 40
        }

        let marginScore = 0
        const margin = realRev > 0 ? realNet / realRev : 0
        if (margin >= 0.2) marginScore = 35
        else if (margin > 0) marginScore = (margin / 0.2) * 35

        let cashScore = 0
        if (realNet > 0) cashScore = 25
        else if (realNet === 0 && realRev > 0) cashScore = 10

        const score = Math.round(revScore + marginScore + cashScore)

        return { score, gap, realRev, realDesp, realNet, planNet }
      }

      const current = calcScore(
        baseRealizedReceitas,
        baseRealizedDespesas,
        planejadoReceitas,
        planejadoDespesas,
      )
      const simulated = calcScore(
        simRealizedReceitas,
        simRealizedDespesas,
        simPlanejadoReceitas,
        simPlanejadoDespesas,
      )

      return {
        date: currentMonthDate,
        current,
        simulated,
        impact,
      }
    })
  }, [
    transactions,
    projections,
    summaries,
    selectedDate,
    type,
    value,
    frequency,
    startMonthOffset,
  ])

  const averageSimulatedScore = useMemo(() => {
    if (monthsData.length === 0) return 0
    const total = monthsData.reduce((acc, m) => acc + m.simulated.score, 0)
    return Math.round(total / monthsData.length)
  }, [monthsData])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Simulador de Decisões</DialogTitle>
          <DialogDescription>
            Simule o impacto de uma nova receita ou despesa na sua saúde
            financeira nos próximos 3 meses.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
            <div className="lg:col-span-4 space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Impacto</Label>
                <Select
                  value={type}
                  onValueChange={(v: 'Receita' | 'Despesa') => setType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receita">
                      Nova Receita / Economia (+)
                    </SelectItem>
                    <SelectItem value="Despesa">
                      Nova Despesa / Gasto (-)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={value}
                  onChange={handleValueChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select
                  value={frequency}
                  onValueChange={(v: 'Unico' | 'Recorrente') => setFrequency(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unico">Impacto Único</SelectItem>
                    <SelectItem value="Recorrente">
                      Impacto Recorrente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mês de Início</Label>
                <Select
                  value={startMonthOffset}
                  onValueChange={setStartMonthOffset}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2].map((offset) => {
                      const d = addMonths(selectedDate, offset)
                      return (
                        <SelectItem
                          key={offset}
                          value={offset.toString()}
                          className="capitalize"
                        >
                          {format(d, 'MMMM yyyy', { locale: ptBR })}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={cn(
                  'p-4 rounded-lg mt-6 text-sm font-medium',
                  averageSimulatedScore >= 70
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : averageSimulatedScore >= 40
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                )}
              >
                {averageSimulatedScore >= 70 &&
                  'Essa decisão fortalece sua saúde financeira. Pode seguir.'}
                {averageSimulatedScore >= 40 &&
                  averageSimulatedScore < 70 &&
                  'Atenção: essa decisão pressiona seu fluxo. Considere adiar ou compensar.'}
                {averageSimulatedScore < 40 &&
                  'Risco: essa decisão compromete sua saúde financeira. Recomendação: adie.'}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              {monthsData.map((data, i) => (
                <div key={i} className="border rounded-xl p-4 bg-muted/30">
                  <h3 className="font-semibold text-base mb-4 capitalize flex items-center gap-2">
                    {format(data.date, 'MMMM yyyy', { locale: ptBR })}
                    {data.impact !== 0 && (
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-bold ml-2',
                          data.impact > 0
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
                        )}
                      >
                        {data.impact > 0 ? '+' : '-'}{' '}
                        {formatCurrency(Math.abs(data.impact))}
                      </span>
                    )}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground border-b pb-1 mb-2">
                        Cenário Atual
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Score</span>
                        <span
                          className={cn(
                            'font-bold',
                            data.current.score >= 80
                              ? 'text-green-500'
                              : data.current.score >= 50
                                ? 'text-yellow-500'
                                : 'text-red-500',
                          )}
                        >
                          {data.current.score}/100
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">GAP</span>
                        <span
                          className={cn(
                            'font-bold',
                            data.current.gap >= 0
                              ? 'text-green-500'
                              : 'text-red-500',
                          )}
                        >
                          {formatCurrency(data.current.gap)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Receitas</span>
                        <span
                          className="font-medium text-green-600 truncate"
                          title={formatCurrency(data.current.realRev)}
                        >
                          {formatCurrency(data.current.realRev)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Despesas</span>
                        <span
                          className="font-medium text-red-600 truncate"
                          title={formatCurrency(data.current.realDesp)}
                        >
                          {formatCurrency(data.current.realDesp)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 relative">
                      <div className="absolute -left-2 sm:-left-3 top-0 bottom-0 w-px bg-border"></div>
                      <div className="text-sm font-medium text-primary border-b pb-1 mb-2 flex items-center gap-1">
                        Com Decisão <ArrowRight className="w-3 h-3" />
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Score</span>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span
                            className={cn(
                              'font-bold',
                              data.simulated.score >= 80
                                ? 'text-green-500'
                                : data.simulated.score >= 50
                                  ? 'text-yellow-500'
                                  : 'text-red-500',
                            )}
                          >
                            {data.simulated.score}/100
                          </span>
                          {data.simulated.score !== data.current.score && (
                            <span
                              className={cn(
                                'text-[10px] sm:text-xs',
                                data.simulated.score > data.current.score
                                  ? 'text-green-500'
                                  : 'text-red-500',
                              )}
                            >
                              (
                              {data.simulated.score > data.current.score
                                ? '+'
                                : ''}
                              {data.simulated.score - data.current.score})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">GAP</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-bold',
                              data.simulated.gap >= 0
                                ? 'text-green-500'
                                : 'text-red-500',
                            )}
                          >
                            {formatCurrency(data.simulated.gap)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Receitas</span>
                        <span
                          className="font-medium text-green-600 truncate"
                          title={formatCurrency(data.simulated.realRev)}
                        >
                          {formatCurrency(data.simulated.realRev)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Despesas</span>
                        <span
                          className="font-medium text-red-600 truncate"
                          title={formatCurrency(data.simulated.realDesp)}
                        >
                          {formatCurrency(data.simulated.realDesp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
