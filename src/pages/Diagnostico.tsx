import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
} from 'lucide-react'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useDiagnostico } from '@/hooks/use-diagnostico'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Diagnostico() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { loading, metrics } = useDiagnostico(selectedDate)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !metrics.hasProjetado) {
      const isCurrentMonth =
        selectedDate.getMonth() === new Date().getMonth() &&
        selectedDate.getFullYear() === new Date().getFullYear()
      const sessionKey = `hasSeenPlanejamentoPrompt_${selectedDate.getMonth()}_${selectedDate.getFullYear()}`
      if (isCurrentMonth && !sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true')
        navigate(
          `/planejamento?month=${selectedDate.getMonth() + 1}&year=${selectedDate.getFullYear()}`,
        )
      }
    }
  }, [loading, metrics.hasProjetado, selectedDate, navigate])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const isGapNegative = metrics.realizadoNet < metrics.planejadoNet

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in pb-10">
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-2 border-b border-border/50 gap-4">
        <h2 className="text-xl font-semibold hidden sm:block">
          Meu Diagnóstico
        </h2>

        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Select
              value={selectedDate.getMonth().toString()}
              onValueChange={(val) => {
                const newDate = new Date(selectedDate)
                newDate.setMonth(parseInt(val))
                setSelectedDate(newDate)
              }}
            >
              <SelectTrigger className="w-[120px] font-medium capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem
                    key={i}
                    value={i.toString()}
                    className="capitalize"
                  >
                    {format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedDate.getFullYear().toString()}
              onValueChange={(val) => {
                const newDate = new Date(selectedDate)
                newDate.setFullYear(parseInt(val))
                setSelectedDate(newDate)
              }}
            >
              <SelectTrigger className="w-[90px] font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }).map((_, i) => {
                  const year = new Date().getFullYear() - 5 + i
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[100px] w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[140px] rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card
            className={cn(
              'border',
              !metrics.hasProjetado
                ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'
                : 'border-primary/20 bg-primary/5',
            )}
          >
            <CardContent className="p-4 sm:p-6 flex items-start gap-4">
              {!metrics.hasProjetado ? (
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              )}
              <div>
                <h3
                  className={cn(
                    'font-semibold mb-1',
                    !metrics.hasProjetado
                      ? 'text-red-900 dark:text-red-200'
                      : 'text-foreground',
                  )}
                >
                  {!metrics.hasProjetado
                    ? 'Atenção necessária'
                    : 'Diagnóstico Atual'}
                </h3>
                <p
                  className={cn(
                    'text-sm',
                    !metrics.hasProjetado
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-muted-foreground',
                  )}
                >
                  {!metrics.hasProjetado
                    ? 'Você não tem projeções para este período. Realize o Planejamento.'
                    : metrics.score >= 80
                      ? 'Sua saúde financeira está excelente! Você tem um bom controle de suas projeções e realizações.'
                      : metrics.score >= 50
                        ? 'Sua saúde financeira está razoável, mas há espaço para melhorias entre o que foi planejado e realizado.'
                        : 'Sua saúde financeira precisa de atenção. Revise suas projeções e tente alinhar seus gastos com o planejado.'}
                </p>
                {!metrics.hasProjetado && (
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/planejamento?month=${selectedDate.getMonth() + 1}&year=${selectedDate.getFullYear()}`,
                      )
                    }
                  >
                    Iniciar Planejamento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4" /> Score de Saúde Financeira
                </h3>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-4xl font-bold mb-1',
                      !metrics.hasProjetado
                        ? 'text-red-500'
                        : metrics.score >= 80
                          ? 'text-green-500'
                          : metrics.score >= 50
                            ? 'text-yellow-500'
                            : 'text-red-500',
                    )}
                  >
                    {metrics.score}{' '}
                    <span className="text-xl text-muted-foreground font-normal">
                      /100
                    </span>
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {!metrics.hasProjetado
                      ? 'Sem projeção'
                      : metrics.score >= 80
                        ? 'Excelente'
                        : metrics.score >= 50
                          ? 'Atenção'
                          : 'Crítico'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4" /> Controle (GAP)
                </h3>
                <div className="flex flex-col">
                  {!metrics.hasProjetado ? (
                    <>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight">
                        Sem projeção para este período
                      </span>
                      <span className="text-xs font-medium text-muted-foreground leading-tight mt-1">
                        Cadastre contas a pagar/receber para comparar
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={cn(
                          'text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2',
                          isGapNegative ? 'text-red-500' : 'text-green-500',
                        )}
                      >
                        {isGapNegative && (
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                        )}
                        {!isGapNegative && (
                          <CheckCircle className="w-5 h-5 shrink-0" />
                        )}
                        <span
                          className="truncate"
                          title={formatCurrency(metrics.gap)}
                        >
                          {formatCurrency(metrics.gap)}
                        </span>
                      </span>
                      <span className="text-sm font-medium text-muted-foreground mt-1">
                        Realizado vs Planejado
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-green-500" /> Receitas
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs text-muted-foreground">Realizado</p>
                      <p
                        className="text-base font-bold text-green-600 truncate"
                        title={formatCurrency(metrics.realizadoReceitas)}
                      >
                        {formatCurrency(metrics.realizadoReceitas)}
                      </p>
                    </div>
                    <div className="text-right min-w-0 flex-1 pl-2">
                      <p className="text-xs text-muted-foreground">Planejado</p>
                      <p
                        className="text-base font-bold truncate"
                        title={formatCurrency(metrics.totalPlanejadoReceitas)}
                      >
                        {formatCurrency(metrics.totalPlanejadoReceitas)}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={
                      metrics.totalPlanejadoReceitas > 0
                        ? (metrics.realizadoReceitas /
                            metrics.totalPlanejadoReceitas) *
                          100
                        : 0
                    }
                    className="h-2 bg-secondary [&>div]:bg-green-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4 text-red-500" /> Despesas
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs text-muted-foreground">Realizado</p>
                      <p
                        className="text-base font-bold text-red-600 truncate"
                        title={formatCurrency(metrics.realizadoDespesas)}
                      >
                        {formatCurrency(metrics.realizadoDespesas)}
                      </p>
                    </div>
                    <div className="text-right min-w-0 flex-1 pl-2">
                      <p className="text-xs text-muted-foreground">Planejado</p>
                      <p
                        className="text-base font-bold truncate"
                        title={formatCurrency(metrics.totalPlanejadoDespesas)}
                      >
                        {formatCurrency(metrics.totalPlanejadoDespesas)}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={
                      metrics.totalPlanejadoDespesas > 0
                        ? (metrics.realizadoDespesas /
                            metrics.totalPlanejadoDespesas) *
                          100
                        : 0
                    }
                    className="h-2 bg-secondary [&>div]:bg-red-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {metrics.hasProjetado && (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Composição do Score</CardTitle>
                <CardDescription>
                  Entenda como seu score de {metrics.score} foi calculado com
                  base em 3 pilares fundamentais.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      Receita vs Projeção
                    </span>
                    <span className="text-sm font-bold">
                      {Math.round(metrics.revScore)} / 40
                    </span>
                  </div>
                  <Progress
                    value={(metrics.revScore / 40) * 100}
                    className="h-2 [&>div]:bg-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sua capacidade de atingir as receitas planejadas para o
                    período.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Margem de Lucro</span>
                    <span className="text-sm font-bold">
                      {Math.round(metrics.marginScore)} / 35
                    </span>
                  </div>
                  <Progress
                    value={(metrics.marginScore / 35) * 100}
                    className="h-2 [&>div]:bg-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Avalia se o seu resultado líquido representa uma margem
                    saudável ({'>'}20%).
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      Capacidade de Caixa
                    </span>
                    <span className="text-sm font-bold">
                      {Math.round(metrics.cashScore)} / 25
                    </span>
                  </div>
                  <Progress
                    value={(metrics.cashScore / 25) * 100}
                    className="h-2 [&>div]:bg-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Verifica se a operação gerou caixa positivo no período
                    selecionado.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
