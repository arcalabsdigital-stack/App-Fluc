import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import {
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Activity,
  TrendingUp,
} from 'lucide-react'
import { ExtendedDashboardKPIs } from '@/hooks/use-dashboard'

interface UnifiedCashPositionProps {
  kpis: ExtendedDashboardKPIs | null
}

export function UnifiedCashPosition({ kpis }: UnifiedCashPositionProps) {
  if (!kpis) return null

  const { conciliatedBalance, realizedBalance, projectedBalance } = kpis
  const hasDivergence = realizedBalance !== conciliatedBalance

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <Card className="w-full border-border/50 shadow-sm overflow-hidden animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50 bg-card">
        {/* Layer 1: Conciliated */}
        <div className="p-5 sm:p-6 flex flex-col gap-2 bg-slate-50/30 dark:bg-slate-900/10">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="font-medium text-sm sm:text-base">
              Saldo Conciliado
            </h3>
          </div>
          <div className="mt-1">
            <p className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-300 tracking-tight">
              {formatCurrency(conciliatedBalance)}
            </p>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              A Realidade
            </p>
          </div>
        </div>

        {/* Layer 2: Realized */}
        <div className="p-5 sm:p-6 flex flex-col gap-2 relative overflow-hidden bg-blue-50/30 dark:bg-blue-900/10">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 hidden md:block"></div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Activity className="h-5 w-5" />
            <h3 className="font-medium text-sm sm:text-base">
              Saldo Realizado
            </h3>
          </div>
          <div className="mt-1">
            <p className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300 tracking-tight">
              {formatCurrency(realizedBalance)}
            </p>
            <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1 font-medium">
              O Presente
            </p>
          </div>
        </div>

        {/* Layer 3: Projected */}
        <div className="p-5 sm:p-6 flex flex-col gap-2 relative overflow-hidden bg-purple-50/30 dark:bg-purple-900/10">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 hidden md:block"></div>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-medium text-sm sm:text-base">
              Saldo Projetado
            </h3>
          </div>
          <div className="mt-1">
            <p className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300 tracking-tight">
              {formatCurrency(projectedBalance)}
            </p>
            <p className="text-sm text-purple-600/80 dark:text-purple-400/80 mt-1 font-medium">
              O Futuro
            </p>
          </div>
        </div>
      </div>

      {hasDivergence && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200/60 dark:border-amber-900/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-400">
            <div className="bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded-full flex-shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">
              Divergência detectada entre o saldo realizado e o conciliado.
            </p>
          </div>
          <Link
            to="/payments"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 transition-colors bg-white/60 dark:bg-black/20 px-4 py-2 rounded-lg hover:bg-white dark:hover:bg-black/40 shadow-sm border border-amber-200/50 dark:border-amber-800/50 w-full sm:w-auto"
          >
            Conciliar Agora
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Card>
  )
}
