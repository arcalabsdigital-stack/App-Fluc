import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { dashboardService } from '@/services/dashboardService'
import { projectionsService } from '@/services/projectionsService'
import { addMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, CheckCircle, Loader2, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIPOS_DECISAO = [
  'Contratar funcionário',
  'Demitir funcionário',
  'Comprar equipamento',
  'Atrasar pagamento de fornecedor',
  'Antecipar recebimento de cliente',
  'Aumentar preço dos produtos',
  'Reduzir custo operacional',
  'Outro',
]

function calculateScore(totalRec: number, net: number, planRec: number) {
  let revScore = 0
  if (planRec > 0) {
    const revRatio = totalRec / planRec
    revScore = Math.min(revRatio * 40, 40)
  } else if (totalRec > 0) {
    revScore = 40
  }

  let marginScore = 0
  const margin = totalRec > 0 ? net / totalRec : 0
  if (margin >= 0.2) marginScore = 35
  else if (margin > 0) marginScore = (margin / 0.2) * 35

  let cashScore = 0
  if (net > 0) cashScore = 25
  else if (net === 0 && totalRec > 0) cashScore = 10

  return Math.round(revScore + marginScore + cashScore)
}

export function SimulacaoModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [step, setStep] = useState<'form' | 'loading' | 'results'>('form')

  const next12Months = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const d = addMonths(new Date(), i)
      return {
        value: `${d.getFullYear()}-${d.getMonth()}`,
        label: format(d, 'MMMM/yyyy', { locale: ptBR }),
        date: d,
      }
    })
  }, [])

  const [tipo, setTipo] = useState(TIPOS_DECISAO[0])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [mesInicio, setMesInicio] = useState(next12Months[0].value)
  const [duracao, setDuracao] = useState('Único (só um mês)')
  const [results, setResults] = useState<any[]>([])

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setTimeout(() => {
        setStep('form')
        setValor('')
        setDescricao('')
        setResults([])
      }, 300)
    }
    onOpenChange(o)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const handleSimular = async () => {
    const impactValue = parseFloat(valor)
    if (isNaN(impactValue)) return

    setStep('loading')
    try {
      const [yearStr, monthStr] = mesInicio.split('-')
      const startDate = new Date(parseInt(yearStr), parseInt(monthStr), 1)

      const monthsData = []

      for (let i = 0; i < 3; i++) {
        const monthDate = addMonths(startDate, i)
        const m = monthDate.getMonth() + 1
        const y = monthDate.getFullYear()

        const [transactions, projections] = await Promise.all([
          dashboardService.getTransactionsForPeriod(
            startOfMonth(monthDate),
            endOfMonth(monthDate),
          ),
          projectionsService.getProjections(m, y),
        ])

        monthsData.push({ monthDate, transactions, projections })
      }

      const computedResults = monthsData.map((mData, i) => {
        const isImpactApplied = duracao === 'Recorrente' || i === 0
        const currentImpact = isImpactApplied ? impactValue : 0

        const realizedReceitas = mData.transactions
          .filter(
            (t: any) =>
              t.tipo_id === 'Receita' &&
              (t.status === 'pago' || t.status === 'parcial'),
          )
          .reduce((acc: number, t: any) => acc + (t.amount_paid || 0), 0)

        const realizedDespesas = mData.transactions
          .filter(
            (t: any) =>
              t.tipo_id === 'Despesa' &&
              (t.status === 'pago' || t.status === 'parcial'),
          )
          .reduce((acc: number, t: any) => acc + (t.amount_paid || 0), 0)

        const pendingReceitas = mData.transactions
          .filter((t: any) => t.tipo_id === 'Receita' && t.status !== 'pago')
          .reduce(
            (acc: number, t: any) =>
              acc + ((t.amount || 0) - (t.amount_paid || 0)),
            0,
          )

        const pendingDespesas = mData.transactions
          .filter((t: any) => t.tipo_id === 'Despesa' && t.status !== 'pago')
          .reduce(
            (acc: number, t: any) =>
              acc + ((t.amount || 0) - (t.amount_paid || 0)),
            0,
          )

        const planejadoReceitas = mData.projections
          .filter((p: any) => p.type === 'Receita')
          .reduce((acc: number, p: any) => acc + (p.planned_amount || 0), 0)

        const planejadoDespesas = mData.projections
          .filter((p: any) => p.type === 'Despesa')
          .reduce((acc: number, p: any) => acc + (p.planned_amount || 0), 0)

        const totalProjetadoReceitas = Math.max(
          realizedReceitas + pendingReceitas,
          planejadoReceitas,
        )
        const totalProjetadoDespesas = Math.max(
          realizedDespesas + pendingDespesas,
          planejadoDespesas,
        )

        const projetadoNet = totalProjetadoReceitas - totalProjetadoDespesas
        const planejadoNet = planejadoReceitas - planejadoDespesas
        const baseGap = projetadoNet - planejadoNet

        const baseScore = calculateScore(
          totalProjetadoReceitas,
          projetadoNet,
          planejadoReceitas,
        )

        const simProjetadoReceitas =
          totalProjetadoReceitas + (currentImpact > 0 ? currentImpact : 0)
        const simProjetadoDespesas =
          totalProjetadoDespesas +
          (currentImpact < 0 ? Math.abs(currentImpact) : 0)
        const simProjetadoNet = simProjetadoReceitas - simProjetadoDespesas
        const simGap = simProjetadoNet - planejadoNet

        const simScore = calculateScore(
          simProjetadoReceitas,
          simProjetadoNet,
          planejadoReceitas,
        )

        return {
          monthLabel: format(mData.monthDate, 'MMM/yyyy', { locale: ptBR }),
          baseScore,
          baseGap,
          simScore,
          simGap,
          impactApplied: isImpactApplied,
        }
      })

      setResults(computedResults)
      setStep('results')
    } catch (error) {
      console.error(error)
      setStep('form')
    }
  }

  const avgSimScore =
    results.length > 0
      ? results.reduce((acc, r) => acc + r.simScore, 0) / results.length
      : 0

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Simular Decisão Financeira</DialogTitle>
          <DialogDescription>
            Visualize o impacto de uma decisão no seu Score de Saúde Financeira
            e Fluxo de Caixa (GAP).
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de decisão</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DECISAO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição livre</Label>
                <Input
                  placeholder="Ex: contratar assistente administrativo"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor do impacto (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: -1500 (despesa) ou 2000 (receita)"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Valores positivos p/ receitas/economia, negativos p/ despesas
                  extras.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mês de início do impacto</Label>
                <Select value={mesInicio} onValueChange={setMesInicio}>
                  <SelectTrigger className="capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {next12Months.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="capitalize"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Duração</Label>
                <Select value={duracao} onValueChange={setDuracao}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Único (só um mês)">
                      Único (só um mês)
                    </SelectItem>
                    <SelectItem value="Recorrente (todos os meses seguintes)">
                      Recorrente (todos os meses seguintes)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Calculando projeções e simulando cenários...
            </p>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-6 py-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.map((res, idx) => (
                <div
                  key={idx}
                  className="border rounded-xl p-4 space-y-4 bg-muted/20"
                >
                  <h4 className="font-semibold text-center capitalize border-b pb-2 text-sm">
                    {res.monthLabel}
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase text-center">
                        Cenário Atual
                      </p>
                      <div className="bg-background p-2 rounded-lg border text-center space-y-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            Score
                          </p>
                          <p
                            className={cn(
                              'font-bold text-sm',
                              res.baseScore >= 70
                                ? 'text-green-600'
                                : res.baseScore >= 40
                                  ? 'text-yellow-600'
                                  : 'text-red-600',
                            )}
                          >
                            {res.baseScore}/100
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            GAP
                          </p>
                          <p
                            className={cn(
                              'font-bold text-xs',
                              res.baseGap >= 0
                                ? 'text-green-600'
                                : 'text-red-600',
                            )}
                            title={formatCurrency(res.baseGap)}
                          >
                            {formatCurrency(res.baseGap)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'space-y-1',
                        !res.impactApplied && 'opacity-60',
                      )}
                    >
                      <p className="text-[10px] font-medium text-primary uppercase text-center">
                        Com Decisão
                      </p>
                      <div
                        className={cn(
                          'p-2 rounded-lg border text-center space-y-2',
                          res.impactApplied
                            ? 'bg-primary/5 border-primary/20 shadow-sm'
                            : 'bg-background',
                        )}
                      >
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            Score
                          </p>
                          <p
                            className={cn(
                              'font-bold text-sm',
                              res.simScore >= 70
                                ? 'text-green-600'
                                : res.simScore >= 40
                                  ? 'text-yellow-600'
                                  : 'text-red-600',
                            )}
                          >
                            {res.simScore}/100
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            GAP
                          </p>
                          <p
                            className={cn(
                              'font-bold text-xs',
                              res.simGap >= 0
                                ? 'text-green-600'
                                : 'text-red-600',
                            )}
                            title={formatCurrency(res.simGap)}
                          >
                            {formatCurrency(res.simGap)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={cn(
                'p-4 rounded-xl border flex items-start gap-3',
                avgSimScore >= 70
                  ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-200'
                  : avgSimScore >= 40
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950/20 dark:border-yellow-900/50 dark:text-yellow-200'
                    : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-200',
              )}
            >
              {avgSimScore >= 70 ? (
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              )}

              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Recomendação Automatizada
                </h4>
                <p className="text-sm">
                  {avgSimScore >= 70
                    ? 'Essa decisão fortalece sua saúde financeira. Pode seguir.'
                    : avgSimScore >= 40
                      ? 'Atenção: essa decisão pressiona seu fluxo. Considere adiar ou compensar com aumento de receita.'
                      : 'Risco: essa decisão compromete sua saúde financeira. Recomendação: adie até melhorar receitas ou reduzir despesas.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          {step === 'results' ? (
            <>
              <Button variant="outline" onClick={() => setStep('form')}>
                Nova Simulação
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Concluir</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={step === 'loading'}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSimular}
                disabled={!valor || step === 'loading'}
                className="gap-2"
              >
                <PlayCircle className="h-4 w-4" /> Simular Decisão
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
