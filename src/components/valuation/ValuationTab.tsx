import { useEffect, useState } from 'react'
import { Loader2, TrendingUp, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { subMonths } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'

export function ValuationTab() {
  const [loading, setLoading] = useState(true)
  const [ebitda, setEbitda] = useState(0)
  const { role } = useAuth()

  useEffect(() => {
    async function calcValuation() {
      if (role === 'visitante') {
        setLoading(false)
        return
      }

      const end = new Date()
      const start = subMonths(end, 11)

      const [{ data: txs }, { data: cats }] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount, type, category')
          .gte('date', start.toISOString())
          .lte('date', end.toISOString()),
        supabase
          .from('categories')
          .select(
            'id, nome, natureza_contabil, efeito_caixa, accounting_group',
          ),
      ])

      let calcEbitda = 0

      if (txs && cats) {
        const catMap = new Map(cats.map((c) => [c.id, c]))
        txs.forEach((t) => {
          const cat =
            catMap.get(t.category) || cats.find((c) => c.nome === t.category)
          const val = Number(t.amount)
          // Se houver natureza_contabil na categoria, usa estritamente a classificação contábil
          // despesa operacional = categories.natureza_contabil = 'Despesa'
          // receita operacional = categories.natureza_contabil = 'Receita'
          if (cat?.natureza_contabil) {
            if (cat.natureza_contabil === 'Receita') {
              calcEbitda += val
            } else if (cat.natureza_contabil === 'Despesa') {
              calcEbitda -= val
            }
          } else {
            // Fallback caso categoria não tenha natureza_contabil preenchida
            const accGroup = cat?.accounting_group || ''
            if (t.type === 'Receita' && accGroup !== 'Ativo') {
              calcEbitda += val
            } else if (t.type === 'Despesa') {
              if (
                accGroup !== 'Passivo' &&
                accGroup !== 'Ativo' &&
                accGroup !== 'Não Desembolsável'
              ) {
                calcEbitda -= val
              }
            }
          }
        })
      }

      setEbitda(Math.max(0, calcEbitda))
      setLoading(false)
    }

    calcValuation()
  }, [role])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const multiple = 5
  const valuation = ebitda * multiple

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Valuation pelo Método de Múltiplos
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-gray-400 hover:text-primary transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm">
                <p className="font-semibold mb-2">Como calculamos?</p>
                <p className="text-gray-600">
                  Calculamos o EBITDA (Lucros antes de juros, impostos,
                  depreciação e amortização) dos últimos 12 meses e aplicamos um
                  múltiplo de mercado conservador de {multiple}x.
                </p>
              </PopoverContent>
            </Popover>
          </h3>
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">
              EBITDA (Últimos 12m)
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {ebitda.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col justify-center items-center">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Múltiplo Aplicado
            </p>
            <p className="text-2xl font-bold text-gray-900">{multiple}x</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium text-primary mb-1">
              Valor Estimado da Empresa
            </p>
            <p className="text-3xl font-black text-primary">
              {valuation.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
