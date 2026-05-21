import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, TrendingUp, AlertTriangle } from 'lucide-react'
import { dashboardService } from '@/services/dashboardService'
import { Transacao } from '@/lib/types'

export function BreakevenCard() {
  const [data, setData] = useState({
    fixedCosts: 0,
    variableCosts: 0,
    revenue: 0,
    breakeven: 0,
  })

  useEffect(() => {
    const fetchBreakeven = async () => {
      try {
        const start = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        )
        const end = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0,
        )
        const txs = await dashboardService.getTransactionsForPeriod(start, end)
        const recurringTxs = await dashboardService.getRecurringTransactions()

        let fixedCosts = 0
        let variableCosts = 0
        let revenue = 0

        recurringTxs.forEach((rt) => {
          if (rt.type === 'Despesa') {
            fixedCosts += Number(rt.amount)
          }
        })

        txs.forEach((t: Transacao) => {
          if (t.tipo_id === 'Receita') {
            revenue += t.valor
          } else if (t.tipo_id === 'Despesa') {
            if (!t.recurring_transaction_id) {
              variableCosts += t.valor
            }
          }
        })

        let breakeven = 0
        if (revenue > 0) {
          const margin = 1 - variableCosts / revenue
          if (margin > 0) {
            breakeven = fixedCosts / margin
          }
        }

        setData({ fixedCosts, variableCosts, revenue, breakeven })
      } catch (error) {
        console.error('Error calculating breakeven:', error)
      }
    }
    fetchBreakeven()
  }, [])

  const reached = data.revenue >= data.breakeven && data.breakeven > 0

  return (
    <Card
      id="breakeven-card"
      className="rounded-3xl border-none shadow-sm overflow-hidden relative bg-white"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          Ponto de Equilíbrio Mensal
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Faturamento necessário para cobrir os custos fixos e variáveis deste
            mês.
          </p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(data.breakeven)}
            </span>
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500 font-medium">Progresso Atual</span>
              <span
                className={
                  reached
                    ? 'text-green-600 font-bold'
                    : 'text-gray-700 font-bold'
                }
              >
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(data.revenue)}
              </span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${reached ? 'bg-green-500' : 'bg-purple-500'}`}
                style={{
                  width: `${Math.min((data.revenue / (data.breakeven || 1)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col justify-center gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Custos Fixos</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(data.fixedCosts)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Custos Variáveis</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(data.variableCosts)}
            </span>
          </div>
          {reached ? (
            <div className="mt-2 bg-green-100 text-green-700 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Você já ultrapassou o ponto de equilíbrio!
            </div>
          ) : (
            <div className="mt-2 bg-amber-100 text-amber-700 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Ainda faltam{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(data.breakeven - data.revenue)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
