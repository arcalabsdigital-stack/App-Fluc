import { useDashboard } from '@/hooks/use-dashboard'
import { KPICard } from '@/components/dashboard/KPICard'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { CategoryDistributionChart } from '@/components/dashboard/CategoryDistribution'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { ExpenseDistribution } from '@/components/dashboard/ExpenseDistribution'
import { BudgetsProgress } from '@/components/dashboard/BudgetsProgress'
import { ComparativeChart } from '@/components/dashboard/ComparativeChart'
import { CashFlowProjection } from '@/components/dashboard/CashFlowProjection'
import { BreakevenCard } from '@/components/dashboard/BreakevenCard'
import { UpcomingTransactions } from '@/components/dashboard/UpcomingTransactions'
import { KPIMetric } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Index = () => {
  const {
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
  } = useDashboard()

  // Transform API data to KPI card format
  const kpiData: KPIMetric[] = kpis
    ? [
        {
          label: 'Saldo Total',
          value: kpis.totalBalance,
          subValue: 'Acumulado',
          trend: 0, // Total balance trend is complex without historical snapshots
          trendLabel: 'Tempo real',
          progress: 100,
          color: 'blue',
        },
        {
          label: 'Receita Mensal',
          value: kpis.monthIncome,
          subValue: 'Este mês',
          trend:
            kpis.lastMonthIncome > 0
              ? Math.round(
                  ((kpis.monthIncome - kpis.lastMonthIncome) /
                    kpis.lastMonthIncome) *
                    100,
                )
              : 0,
          trendLabel: 'vs Mês anterior',
          progress: 75, // Could be vs goal
          color: 'green',
        },
        {
          label: 'Despesa Mensal',
          value: kpis.monthExpense,
          subValue: 'Este mês',
          trend:
            kpis.lastMonthExpense > 0
              ? Math.round(
                  ((kpis.monthExpense - kpis.lastMonthExpense) /
                    kpis.lastMonthExpense) *
                    100,
                )
              : 0,
          trendLabel: 'vs Mês anterior',
          progress:
            kpis.monthIncome > 0
              ? (kpis.monthExpense / kpis.monthIncome) * 100
              : 0,
          color: 'red',
        },
        {
          label: 'Eficiência',
          value:
            kpis.monthIncome > 0
              ? `${Math.round(((kpis.monthIncome - kpis.monthExpense) / kpis.monthIncome) * 100)}%`
              : '0%',
          subValue: 'Margem',
          trend: 0,
          trendLabel: 'Atual',
          progress:
            kpis.monthIncome > 0
              ? ((kpis.monthIncome - kpis.monthExpense) / kpis.monthIncome) *
                100
              : 0,
          color: 'purple',
        },
      ]
    : []

  if (loading && !kpis) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-[120px] sm:h-[140px] lg:h-auto lg:min-h-[140px] rounded-2xl sm:rounded-3xl"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 h-[400px]">
          <Skeleton className="xl:col-span-2 h-full rounded-2xl sm:rounded-3xl" />
          <Skeleton className="h-full rounded-2xl sm:rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 h-[400px]">
          <Skeleton className="h-full rounded-2xl sm:rounded-3xl" />
          <Skeleton className="h-full rounded-2xl sm:rounded-3xl" />
        </div>
      </div>
    )
  }

  const periodLabel = format(selectedDate, 'MMMM yyyy', { locale: ptBR })

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in pb-10 px-0 sm:px-0">
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-2 border-b border-border/50 gap-4">
        <h2 className="text-xl font-semibold hidden sm:block">Visão Geral</h2>
        <div
          id="month-filters"
          className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-start"
        >
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

      <UpcomingTransactions />

      {/* KPI Row */}
      <div
        id="dashboard-kpis"
        className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6"
      >
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className="h-[120px] sm:h-[140px] lg:h-auto lg:min-h-[140px]"
          >
            <KPICard data={kpi} />
          </div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="projection">Projeção de Fluxo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4 sm:gap-6">
          {/* Middle Section: Performance + Categories */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 h-auto min-h-[400px]">
            <div className="xl:col-span-2 h-[400px] xl:h-full">
              <PerformanceChart data={chartData} periodLabel={periodLabel} />
            </div>
            <div className="h-[400px] xl:h-full">
              <BudgetsProgress />
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 h-auto min-h-[350px]">
            <div className="h-[350px] xl:h-full xl:col-span-2">
              <ComparativeChart />
            </div>
            <div className="h-[350px] xl:h-full">
              <CategoryDistributionChart
                data={categoryDistribution}
                periodLabel={periodLabel}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <BreakevenCard selectedDate={selectedDate} />
          </div>

          {/* Bottom Section: Recent Transactions + Expense Breakdown */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 h-auto min-h-[400px]">
            <div className="h-full min-h-[400px]">
              <RecentTransactions transactions={recentTransactions} />
            </div>
            <div className="h-full min-h-[400px]">
              <ExpenseDistribution
                data={paymentDistribution}
                periodLabel={periodLabel}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projection">
          <div className="h-[500px]">
            <CashFlowProjection
              data={projectionData}
              months={projectionMonths}
              onMonthsChange={setProjectionMonths}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Index
