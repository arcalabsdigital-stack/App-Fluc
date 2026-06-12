import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { planningService } from '@/services/planningService'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Copy,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

const DEFAULT_EXPENSES = [
  { name: 'Aluguel', enabled: false, value: 0 },
  { name: 'Salários', enabled: false, value: 0 },
  { name: 'Impostos', enabled: false, value: 0 },
  { name: 'Internet/Telefone', enabled: false, value: 0 },
  { name: 'Outros', enabled: false, value: 0 },
]

export default function Planejamento() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [step, setStep] = useState(1)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const [revenue, setRevenue] = useState<number>(0)
  const [revenueSource, setRevenueSource] = useState('')

  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [history, setHistory] = useState<{ month: number; year: number }[]>([])

  useEffect(() => {
    async function init() {
      try {
        const all = await planningService.getAllPlannings()
        const sortedHistory = [...all].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year
          return b.month - a.month
        })
        setHistory(sortedHistory)

        const queryMonth = searchParams.get('month')
        const queryYear = searchParams.get('year')

        if (queryMonth && queryYear) {
          setMonth(parseInt(queryMonth))
          setYear(parseInt(queryYear))
        } else {
          const currentM = new Date().getMonth() + 1
          const currentY = new Date().getFullYear()

          let targetM = currentM
          let targetY = currentY

          while (all.some((p) => p.month === targetM && p.year === targetY)) {
            targetM++
            if (targetM > 12) {
              targetM = 1
              targetY++
            }
            if (targetY > currentY + 5) break
          }

          setMonth(targetM)
          setYear(targetY)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [searchParams])

  useEffect(() => {
    async function loadData() {
      if (loading) return

      try {
        const data = await planningService.getPlanning(month, year)
        if (data) {
          setRevenue(data.total_revenue)
          setRevenueSource(data.revenue_source || '')

          if (data.expenses_breakdown) {
            const mapped = DEFAULT_EXPENSES.map((def) => {
              const saved = data.expenses_breakdown![def.name]
              if (saved)
                return {
                  name: def.name,
                  enabled: saved.enabled,
                  value: saved.value,
                }
              return def
            })
            setExpenses(mapped)
          } else {
            setExpenses(DEFAULT_EXPENSES)
          }
        } else {
          setRevenue(0)
          setRevenueSource('')
          setExpenses(DEFAULT_EXPENSES)
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadData()
  }, [month, year, loading])

  const replicateStep1 = async () => {
    let prevM = month - 1
    let prevY = year
    if (prevM === 0) {
      prevM = 12
      prevY--
    }

    try {
      const prev = await planningService.getPlanning(prevM, prevY)
      if (prev) {
        setRevenue(prev.total_revenue)
        if (prev.revenue_source) setRevenueSource(prev.revenue_source)
        toast.success('Receita replicada com sucesso!')
      } else {
        toast.error('Nenhum planejamento encontrado no mês anterior.')
      }
    } catch (err) {
      toast.error('Erro ao buscar dados do mês anterior.')
    }
  }

  const replicateStep2 = async () => {
    let prevM = month - 1
    let prevY = year
    if (prevM === 0) {
      prevM = 12
      prevY--
    }

    try {
      const prev = await planningService.getPlanning(prevM, prevY)
      if (prev && prev.expenses_breakdown) {
        const mapped = DEFAULT_EXPENSES.map((def) => {
          const saved = prev.expenses_breakdown![def.name]
          if (saved)
            return {
              name: def.name,
              enabled: saved.enabled,
              value: saved.value,
            }
          return def
        })
        setExpenses(mapped)
        toast.success('Custos replicados com sucesso!')
      } else {
        toast.error('Nenhum planejamento encontrado no mês anterior.')
      }
    } catch (err) {
      toast.error('Erro ao buscar dados do mês anterior.')
    }
  }

  const handleNext = () => setStep((s) => Math.min(3, s + 1))
  const handleBack = () => setStep((s) => Math.max(1, s - 1))

  const totalExpenses = expenses
    .filter((e) => e.enabled)
    .reduce((acc, curr) => acc + curr.value, 0)
  const result = revenue - totalExpenses

  const handleSave = async () => {
    setSaving(true)
    try {
      const expensesBreakdown = expenses.reduce(
        (acc, curr) => {
          acc[curr.name] = { enabled: curr.enabled, value: curr.value }
          return acc
        },
        {} as Record<string, { enabled: boolean; value: number }>,
      )

      await planningService.savePlanning({
        month,
        year,
        total_revenue: revenue,
        revenue_source: revenueSource,
        total_expenses: totalExpenses,
        expenses_breakdown: expensesBreakdown,
      })

      const all = await planningService.getAllPlannings()
      const sortedHistory = [...all].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
      setHistory(sortedHistory)

      setShowSuccessModal(true)
    } catch (err) {
      toast.error('Erro ao salvar planejamento.')
    } finally {
      setSaving(false)
    }
  }

  const handleReplicateNextMonth = async () => {
    setSaving(true)
    try {
      let nextM = month + 1
      let nextY = year
      if (nextM > 12) {
        nextM = 1
        nextY++
      }

      const expensesBreakdown = expenses.reduce(
        (acc, curr) => {
          acc[curr.name] = { enabled: curr.enabled, value: curr.value }
          return acc
        },
        {} as Record<string, { enabled: boolean; value: number }>,
      )

      await planningService.savePlanning({
        month: nextM,
        year: nextY,
        total_revenue: revenue,
        revenue_source: revenueSource,
        total_expenses: totalExpenses,
        expenses_breakdown: expensesBreakdown,
      })

      const all = await planningService.getAllPlannings()
      const sortedHistory = [...all].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
      setHistory(sortedHistory)

      toast.success('Planejamento replicado para o próximo mês!')
    } catch (err) {
      toast.error('Erro ao replicar planejamento.')
    } finally {
      setSaving(false)
    }
  }

  const handlePlanNextMonth = () => {
    setShowSuccessModal(false)
    setStep(1)
    let nextM = month + 1
    let nextY = year
    if (nextM > 12) {
      nextM = 1
      nextY++
    }
    setMonth(nextM)
    setYear(nextY)
    setSearchParams({ month: nextM.toString(), year: nextY.toString() })
  }

  if (loading) return null

  const monthName = format(new Date(year, month - 1, 1), 'MMMM', {
    locale: ptBR,
  })
  const nextMonthName = format(new Date(year, month, 1), 'MMMM', {
    locale: ptBR,
  })

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto pb-20 animate-fade-in px-2 sm:px-0">
      <div className="w-full lg:w-64 shrink-0 space-y-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[150px] lg:h-[calc(100vh-250px)]">
              <div className="flex flex-col p-2 gap-1">
                <Button
                  variant="ghost"
                  className="justify-start w-full"
                  onClick={() => {
                    const curr = new Date()
                    let m = curr.getMonth() + 1
                    let y = curr.getFullYear()
                    while (history.some((h) => h.month === m && h.year === y)) {
                      m++
                      if (m > 12) {
                        m = 1
                        y++
                      }
                      if (y > curr.getFullYear() + 5) break
                    }
                    setMonth(m)
                    setYear(y)
                    setSearchParams({ month: m.toString(), year: y.toString() })
                    setStep(1)
                  }}
                >
                  + Novo Planejamento
                </Button>
                <div className="h-px bg-border my-2 mx-2" />
                {history.map((item) => {
                  const isActive = item.month === month && item.year === year
                  return (
                    <Button
                      key={`${item.month}-${item.year}`}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'justify-start w-full capitalize',
                        isActive && 'font-semibold',
                      )}
                      onClick={() => {
                        setMonth(item.month)
                        setYear(item.year)
                        setSearchParams({
                          month: item.month.toString(),
                          year: item.year.toString(),
                        })
                        setStep(1)
                      }}
                    >
                      {format(
                        new Date(item.year, item.month - 1, 1),
                        'MMMM yyyy',
                        { locale: ptBR },
                      )}
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            Planejamento de {monthName} {year}
          </h1>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center gap-2 text-sm font-medium">
          <div
            className={cn(
              'flex items-center gap-2',
              step >= 1 ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs text-white',
                step >= 1 ? 'bg-primary' : 'bg-muted',
              )}
            >
              1
            </div>
            <span>Receitas</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <div
            className={cn(
              'flex items-center gap-2',
              step >= 2 ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs text-white',
                step >= 2 ? 'bg-primary' : 'bg-muted',
              )}
            >
              2
            </div>
            <span>Custos</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <div
            className={cn(
              'flex items-center gap-2',
              step >= 3 ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs text-white',
                step >= 3 ? 'bg-primary' : 'bg-muted',
              )}
            >
              3
            </div>
            <span>Resumo</span>
          </div>
        </div>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Projeção de Receitas'}
              {step === 2 && 'Custos e Despesas Fixas'}
              {step === 3 && 'Resumo do Planejamento'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Defina sua meta de faturamento para o mês.'}
              {step === 2 && 'Mapeie os custos que manterão sua operação.'}
              {step === 3 && 'Confira os resultados esperados para este mês.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={replicateStep1}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" /> Replicar do mês anterior
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quanto você espera faturar este mês?</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        type="number"
                        className="pl-9 text-lg"
                        value={revenue || ''}
                        onChange={(e) =>
                          setRevenue(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>De onde vem essa receita?</Label>
                    <Textarea
                      placeholder="Ex: Contratos recorrentes, novos projetos..."
                      value={revenueSource}
                      onChange={(e) => setRevenueSource(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={replicateStep2}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" /> Replicar do mês anterior
                  </Button>
                </div>

                <div className="space-y-4">
                  {expenses.map((expense, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-colors',
                        expense.enabled
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-card',
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={expense.enabled}
                          onCheckedChange={(checked) => {
                            const newExp = [...expenses]
                            newExp[idx].enabled = !!checked
                            setExpenses(newExp)
                          }}
                        />
                        <Label className="text-base cursor-pointer font-medium">
                          {expense.name}
                        </Label>
                      </div>
                      {expense.enabled && (
                        <div className="relative w-full sm:w-48 animate-fade-in">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            R$
                          </span>
                          <Input
                            type="number"
                            className="pl-9 bg-background"
                            value={expense.value || ''}
                            onChange={(e) => {
                              const newExp = [...expenses]
                              newExp[idx].value =
                                parseFloat(e.target.value) || 0
                              setExpenses(newExp)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900/30">
                    <CardContent className="p-4 flex flex-col gap-1">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Total de Receitas
                      </span>
                      <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(revenue)}
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
                    <CardContent className="p-4 flex flex-col gap-1">
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">
                        Total de Custos
                      </span>
                      <span className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(totalExpenses)}
                      </span>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      'border-none shadow-sm',
                      result >= 0 ? 'bg-primary/10' : 'bg-destructive/10',
                    )}
                  >
                    <CardContent className="p-4 flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        Resultado Esperado
                      </span>
                      <span
                        className={cn(
                          'text-2xl font-bold',
                          result >= 0 ? 'text-primary' : 'text-destructive',
                        )}
                      >
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(result)}
                      </span>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={handleReplicateNextMonth}
                    className="gap-2"
                    disabled={saving}
                  >
                    <Copy className="w-4 h-4" /> Replicar para o próximo mês
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1 || saving}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>

              {step < 3 ? (
                <Button onClick={handleNext} className="gap-2 bg-primary">
                  Próximo <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-primary"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirmar Planejamento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showSuccessModal}
        onOpenChange={(open) => !open && navigate('/')}
      >
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl capitalize text-center">
              Planejamento de {monthName} salvo!
            </DialogTitle>
            <DialogDescription className="text-base pt-2 text-center">
              Quer planejar{' '}
              <span className="font-semibold text-foreground capitalize">
                {nextMonthName}
              </span>{' '}
              agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 mt-4 sm:space-x-0">
            <Button className="w-full" onClick={handlePlanNextMonth}>
              Sim, planejar {nextMonthName}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Agora não, depois eu volto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
