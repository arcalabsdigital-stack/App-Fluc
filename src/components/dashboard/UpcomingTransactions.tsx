import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format, isBefore, addDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarClock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function UpcomingTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const today = startOfDay(new Date())
        const nextWeek = addDays(today, 7)

        const { data, error } = await supabase
          .from('transactions')
          .select('id, description, amount, date, type')
          .eq('status', 'aberto')
          .lte('date', format(nextWeek, 'yyyy-MM-dd'))
          .order('date', { ascending: true })

        if (error) throw error

        setTransactions(data || [])
      } catch (error) {
        console.error('Error fetching upcoming transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcoming()
  }, [])

  if (loading) {
    return (
      <Skeleton className="h-[150px] w-full rounded-2xl sm:rounded-3xl mb-4 sm:mb-6" />
    )
  }

  const today = startOfDay(new Date())

  const overdue = transactions.filter((t) =>
    isBefore(new Date(t.date + 'T00:00:00'), today),
  )
  const upcoming = transactions.filter(
    (t) => !isBefore(new Date(t.date + 'T00:00:00'), today),
  )

  if (overdue.length === 0 && upcoming.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/50 text-card-foreground shadow-sm mb-4 sm:mb-6">
        <div className="p-6 flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mb-3 text-emerald-500 opacity-80" />
          <p className="font-medium text-foreground">
            Nenhum lançamento para os próximos dias
          </p>
          <p className="text-sm">Tudo em dia com suas obrigações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm mb-4 sm:mb-6">
      <div className="flex flex-col space-y-1.5 p-6 pb-3">
        <h3 className="font-semibold leading-none tracking-tight text-lg flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Próximos Lançamentos
        </h3>
      </div>
      <div className="p-6 pt-0">
        <div className="flex flex-col gap-3">
          {overdue.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Vencidos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {overdue.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                  >
                    <span
                      className="text-sm font-medium text-destructive truncate"
                      title={t.description}
                    >
                      {t.description}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-destructive/80 font-medium">
                        {format(new Date(t.date + 'T00:00:00'), "dd 'de' MMM", {
                          locale: ptBR,
                        })}
                      </span>
                      <span className="text-sm font-bold text-destructive">
                        {t.type === 'Despesa' ? '-' : '+'}
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {overdue.length > 0 && (
                <h4 className="text-sm font-medium text-muted-foreground mt-2">
                  Próximos 7 Dias
                </h4>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {upcoming.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col p-3 rounded-lg border bg-background"
                  >
                    <span
                      className="text-sm font-medium truncate"
                      title={t.description}
                    >
                      {t.description}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(t.date + 'T00:00:00'), "dd 'de' MMM", {
                          locale: ptBR,
                        })}
                      </span>
                      <span
                        className={`text-sm font-bold ${t.type === 'Despesa' ? 'text-foreground' : 'text-emerald-600'}`}
                      >
                        {t.type === 'Despesa' ? '-' : '+'}
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
