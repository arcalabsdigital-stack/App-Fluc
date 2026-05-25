import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { format, isPast, isToday, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function NextTransactionsCard() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNext() {
      const nextWeekStr = format(addDays(new Date(), 7), 'yyyy-MM-dd')

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'aberto')
        .lte('date', nextWeekStr)
        .order('date', { ascending: true })

      if (data) {
        setTransactions(data)
      }
      setLoading(false)
    }

    fetchNext()
  }, [])

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Próximos Lançamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center min-h-[250px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Próximos Lançamentos
          </CardTitle>
          <Link
            to="/payments"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1 transition-all hover:gap-2"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {transactions.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground min-h-[250px]">
            <CheckCircle2 className="w-12 h-12 mb-3 text-green-500/80" />
            <p className="font-medium text-gray-700">Tudo em dia!</p>
            <p className="text-sm mt-1">
              Nenhum lançamento pendente para os próximos 7 dias.
            </p>
          </div>
        ) : (
          <div className="divide-y max-h-[350px] overflow-y-auto">
            {transactions.map((t) => {
              const date = new Date(t.date)
              // Overdue if the date is in the past, but not today
              const overdue = isPast(date) && !isToday(date)
              const typeColor =
                t.type === 'Receita' ? 'text-green-600' : 'text-red-600'

              return (
                <div
                  key={t.id}
                  className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 ${overdue ? 'text-red-500' : 'text-gray-400'}`}
                    >
                      {overdue ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <CalendarClock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {t.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${overdue ? 'text-red-700 bg-red-100' : 'text-gray-600 bg-gray-100'}`}
                        >
                          {format(date, "dd 'de' MMM", { locale: ptBR })}
                          {overdue && ' (Atrasado)'}
                          {isToday(date) && ' (Hoje)'}
                        </span>
                        <span className="text-xs text-gray-400">&bull;</span>
                        <span className="text-xs text-gray-500 truncate max-w-[120px]">
                          {t.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-sm ${typeColor} whitespace-nowrap ml-4 bg-white/50 px-2 py-1 rounded-md border border-gray-100`}
                  >
                    {t.type === 'Receita' ? '+' : '-'}{' '}
                    {Number(t.amount).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
