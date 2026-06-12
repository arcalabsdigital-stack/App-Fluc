import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export default function Diagnostico() {
  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [transactions, setTransactions] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const startOfMonth = new Date(selectedYear, selectedMonth, 1)
        const endOfMonth = new Date(
          selectedYear,
          selectedMonth + 1,
          0,
          23,
          59,
          59,
        )

        const [txRes, catRes] = await Promise.all([
          supabase
            .from('transactions')
            .select('*')
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0]),
          supabase.from('categoria_simplificada').select('*'),
        ])

        if (txRes.data) setTransactions(txRes.data)
        if (catRes.data) setCategorias(catRes.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedMonth, selectedYear])

  const { planejado, realizado, gapAbs, gapPct, totalScore, actionMsg } =
    useMemo(() => {
      const isRevenue = (t: any) => {
        const cat = categorias.find((c) => c.nome_simplificado === t.category)
        if (cat) return cat.tipo_grupo === 'RECEITAS'
        return t.type === 'Receita'
      }

      const isExpense = (t: any) => {
        const cat = categorias.find((c) => c.nome_simplificado === t.category)
        if (cat) {
          return [
            'CUSTOS DIRETOS',
            'CUSTOS FIXOS',
            'DESPESAS OPERACIONAIS',
            'DESPESAS PESSOAIS',
            'INVESTIMENTOS',
            'DÍVIDAS',
            'BENS E DIREITOS',
          ].includes(cat.tipo_grupo)
        }
        return t.type === 'Despesa'
      }

      const openTx = transactions.filter((t) => t.status !== 'pago')
      const paidTx = transactions.filter((t) => t.status === 'pago')

      const openRev = openTx
        .filter(isRevenue)
        .reduce((acc, t) => acc + Number(t.amount), 0)
      const openExp = openTx
        .filter(isExpense)
        .reduce((acc, t) => acc + Number(t.amount), 0)

      const paidRev = paidTx
        .filter(isRevenue)
        .reduce((acc, t) => acc + Number(t.amount_paid || t.amount), 0)
      const paidExp = paidTx
        .filter(isExpense)
        .reduce((acc, t) => acc + Number(t.amount_paid || t.amount), 0)

      const _planejado = openRev - openExp
      const _realizado = paidRev - paidExp

      const _gapAbs = _realizado - _planejado
      const _gapPct =
        _planejado !== 0 ? (_gapAbs / Math.abs(_planejado)) * 100 : 0

      // PAC Score
      // 1. Revenue vs. Projection (40%)
      const totalPlannedRev = paidRev + openRev
      const revRatio =
        totalPlannedRev > 0 ? paidRev / totalPlannedRev : paidRev > 0 ? 1 : 0
      const _revScore = Math.min(revRatio, 1) * 40

      // 2. Profit Margin (35%)
      const marginRatio = paidExp > 0 ? paidRev / paidExp : paidRev > 0 ? 1 : 0
      const _marginScore = Math.min(marginRatio, 1) * 35

      // 3. Cash Capacity (25%)
      const netCash = paidRev - paidExp
      const cashRatio = openExp > 0 ? (netCash > 0 ? netCash / openExp : 0) : 1
      const _cashScore = Math.min(cashRatio, 1) * 25

      const _totalScore = Math.round(_revScore + _marginScore + _cashScore)

      // Contextual action
      let _actionMsg = null
      if (_totalScore < 70) {
        const perfs = [
          { type: 'rev', perf: _revScore / 40 },
          { type: 'margin', perf: _marginScore / 35 },
          { type: 'cash', perf: _cashScore / 25 },
        ]
        perfs.sort((a, b) => a.perf - b.perf)
        const worst = perfs[0].type

        if (worst === 'rev') {
          const missingPct = Math.round((1 - revRatio) * 100)
          _actionMsg = `Sua receita real está ${missingPct}% abaixo do projetado. Considere acelerar cobranças ou revisar sua projeção de vendas.`
        } else if (worst === 'margin') {
          _actionMsg =
            'Sua margem de lucro está abaixo do ideal. Avalie seus custos diretos ou precificação.'
        } else {
          _actionMsg =
            'Seu caixa não cobre as despesas pendentes. Negocie prazos ou priorize pagamentos.'
        }
      }

      return {
        planejado: _planejado,
        realizado: _realizado,
        gapAbs: _gapAbs,
        gapPct: _gapPct,
        totalScore: _totalScore,
        actionMsg: _actionMsg,
      }
    }, [transactions, categorias])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Meu Diagnóstico
          </h2>
          <p className="text-muted-foreground">
            Inteligência Financeira Baseada no Método PAC
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-white shadow-sm border-gray-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Planejado (Aberto)
                </CardTitle>
                <Activity className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(planejado)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-gray-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Realizado (Pago)
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(realizado)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-gray-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Controle (GAP)
                </CardTitle>
                {realizado < planejado ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    realizado < planejado ? 'text-red-600' : 'text-emerald-600',
                  )}
                >
                  {formatCurrency(gapAbs)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {gapPct > 0 ? '+' : ''}
                  {gapPct.toFixed(1)}% em relação ao planejado
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="flex flex-col items-center justify-center p-10 text-center bg-white border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50 z-0" />
            <div className="z-10 relative">
              <h3 className="text-xl font-semibold mb-2 text-gray-700">
                Score de Saúde Financeira
              </h3>
              <div
                className={cn(
                  'text-7xl font-black mb-4 tracking-tighter',
                  totalScore >= 70
                    ? 'text-emerald-500'
                    : totalScore >= 40
                      ? 'text-yellow-500'
                      : 'text-red-500',
                )}
              >
                {totalScore}
              </div>
              <p
                className={cn(
                  'text-lg font-medium px-4 py-1 rounded-full',
                  totalScore >= 70
                    ? 'bg-emerald-50 text-emerald-700'
                    : totalScore >= 40
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700',
                )}
              >
                {totalScore >= 70
                  ? 'Saúde financeira estável'
                  : totalScore >= 40
                    ? 'Atenção necessária'
                    : 'Risco identificado'}
              </p>
            </div>
          </Card>

          {actionMsg && (
            <Card className="bg-orange-50 border-orange-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardContent className="flex items-start p-5 space-x-4">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-orange-900 text-lg">
                    Sugestão de Ação
                  </h4>
                  <p className="text-orange-800 mt-1 leading-relaxed">
                    {actionMsg}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
