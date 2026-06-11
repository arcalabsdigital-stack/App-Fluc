import { useState, useEffect, useCallback } from 'react'
import { dashboardService } from '@/services/dashboardService'
import {
  DashboardKPIs,
  Transacao,
  ChartDataPoint,
  CategoryDistribution,
  TipoTransacao,
  PaymentMethodDistribution,
} from '@/lib/types'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  isAfter,
  addWeeks,
  addYears,
  endOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import useTransactionStore from '@/stores/useTransactionStore'
import { useAuth } from '@/hooks/use-auth'

export interface ProjectionDataPoint {
  month: string
  balance: number
  expectedIncome: number
  expectedExpense: number
}

export const useDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [projectionData, setProjectionData] = useState<ProjectionDataPoint[]>(
    [],
  )
  const [projectionMonths, setProjectionMonths] = useState<number>(6)
  const [recentTransactions, setRecentTransactions] = useState<Transacao[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<
    CategoryDistribution[]
  >([])
  const [paymentDistribution, setPaymentDistribution] = useState<
    PaymentMethodDistribution[]
  >([])
  const [loading, setLoading] = useState(true)

  // Listen to transaction store changes to refresh dashboard
  const { transactions: storeTransactions } = useTransactionStore()
  const { role, loading: authLoading, currentWorkspace } = useAuth()

  const fetchData = useCallback(async () => {
    if (authLoading) return

    // If role is not yet determined or is visitante, we might handle it early
    if (!role || role === 'visitante' || !currentWorkspace) {
      setLoading(false)
      setKpis(null)
      setRecentTransactions([])
      setChartData([])
      setCategoryDistribution([])
      setPaymentDistribution([])
      setProjectionData([])
      return
    }

    try {
      setLoading(true)
      // We fetch data regardless of role, trusting RLS and service logic to filter
      const [
        kpiData,
        recentData,
        monthData,
        futureData,
        recurringData,
        categoriesData,
      ] = await Promise.all([
        dashboardService.getKPIs(selectedDate),
        dashboardService.getRecentTransactions(6),
        dashboardService.getTransactionsForPeriod(
          startOfMonth(selectedDate),
          endOfMonth(selectedDate),
        ),
        dashboardService.getFutureTransactions(
          addMonths(selectedDate, 12),
          selectedDate,
        ),
        dashboardService.getRecurringTransactions(),
        dashboardService.getCategories(),
      ])

      setKpis(kpiData)
      setRecentTransactions(recentData)
      processChartData(monthData, selectedDate)
      processCategoryData(monthData, categoriesData)
      processPaymentData(monthData)
      processProjectionData(
        kpiData?.totalBalance || 0,
        futureData,
        recurringData,
        selectedDate,
      )
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }, [role, selectedDate, authLoading, currentWorkspace])

  // Process data for charts
  const processChartData = (transactions: Transacao[], date: Date) => {
    // For collaborators, 'transactions' might only contain 1 item if it falls in the current month
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const days = eachDayOfInterval({ start, end })

    const data: ChartDataPoint[] = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayTrans = transactions.filter(
        (t) => format(t.data, 'yyyy-MM-dd') === dayStr,
      )

      return {
        date: format(day, 'd MMM', { locale: ptBR }),
        revenue: dayTrans
          .filter((t) => t.tipo_id === TipoTransacao.Receita)
          .reduce((acc, curr) => acc + curr.valor, 0),
        expenses: dayTrans
          .filter((t) => t.tipo_id === TipoTransacao.Despesa)
          .reduce((acc, curr) => acc + curr.valor, 0),
      }
    })
    setChartData(data)
  }

  const processCategoryData = (
    transactions: Transacao[],
    categories: { id: string; nome: string }[],
  ) => {
    const expenses = transactions.filter(
      (t) => t.tipo_id === TipoTransacao.Despesa,
    )
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.valor, 0)

    const categoryMap = new Map<string, number>()

    expenses.forEach((t) => {
      const idOrName = t.categoria_id
      const matchedCategory = categories.find(
        (c) => c.id === idOrName || c.nome === idOrName,
      )
      const catName = matchedCategory
        ? matchedCategory.nome
        : idOrName || 'Outros'

      const current = categoryMap.get(catName) || 0
      categoryMap.set(catName, current + t.valor)
    })

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
    ]

    const distribution: CategoryDistribution[] = Array.from(
      categoryMap.entries(),
    )
      .map(([name, value], index) => {
        return {
          name,
          value,
          percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
          color: colors[index % colors.length],
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 categories

    setCategoryDistribution(distribution)
  }

  const processPaymentData = (transactions: Transacao[]) => {
    const expenses = transactions.filter(
      (t) => t.tipo_id === TipoTransacao.Despesa,
    )
    const methodMap = new Map<string, number>()

    expenses.forEach((t) => {
      const current = methodMap.get(t.forma_pagamento_id) || 0
      methodMap.set(t.forma_pagamento_id, current + t.valor)
    })

    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#EC4899', // pink
    ]

    const distribution: PaymentMethodDistribution[] = Array.from(
      methodMap.entries(),
    ).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }))

    setPaymentDistribution(distribution)
  }

  const processProjectionData = (
    currentBalance: number,
    futureTransactions: Transacao[],
    recurringTransactions: any[],
    baseDate: Date,
  ) => {
    const today = baseDate

    // Generate projection for 12 periods, starting with the current month
    const months = Array.from({ length: 12 }).map((_, i) => {
      const monthDate = addMonths(today, i)
      return {
        date: monthDate,
        label: format(monthDate, 'MMM/yy', { locale: ptBR }),
        start: i === 0 ? endOfDay(today) : startOfMonth(monthDate),
        end: endOfMonth(monthDate),
      }
    })

    let runningBalance = currentBalance
    const projection: ProjectionDataPoint[] = []

    months.forEach((m) => {
      let income = 0
      let expense = 0

      // Add future manual transactions for this month segment
      futureTransactions.forEach((t) => {
        if (isAfter(t.data, m.start) && !isAfter(t.data, m.end)) {
          if (t.tipo_id === TipoTransacao.Receita) income += t.valor
          else expense += t.valor
        }
      })

      // Add recurring transactions occurrences for this month segment
      recurringTransactions.forEach((rt) => {
        let simDate = new Date(rt.next_date)

        let circuitBreaker = 0
        while (!isAfter(simDate, m.end) && circuitBreaker < 100) {
          circuitBreaker++
          if (isAfter(simDate, m.start)) {
            if (rt.type === 'Receita') income += Number(rt.amount)
            else expense += Number(rt.amount)
          }

          if (rt.frequency === 'monthly') {
            simDate = addMonths(simDate, 1)
          } else if (rt.frequency === 'weekly') {
            simDate = addWeeks(simDate, 1)
          } else if (rt.frequency === 'yearly') {
            simDate = addYears(simDate, 1)
          } else {
            simDate = addMonths(simDate, 1)
          }
        }
      })

      runningBalance += income - expense

      projection.push({
        month: m.label,
        balance: runningBalance,
        expectedIncome: income,
        expectedExpense: expense,
      })
    })

    setProjectionData(projection)
  }

  useEffect(() => {
    fetchData()
  }, [fetchData, storeTransactions]) // Refresh when transactions change in store

  return {
    selectedDate,
    setSelectedDate,
    kpis,
    recentTransactions,
    chartData,
    categoryDistribution,
    paymentDistribution,
    projectionData,
    projectionMonths,
    setProjectionMonths,
    loading,
    refresh: fetchData,
  }
}
