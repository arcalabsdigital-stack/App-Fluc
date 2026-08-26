import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { transactionService } from '@/services/transactionService'
import { supabase } from '@/lib/supabase/client'
import { Transacao, TipoTransacao } from '@/lib/types'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { ArrowDownRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface GroupedPosition {
  label: string
  days: number
  payable: number
  receivable: number
  transactions: Transacao[]
}

export function AccountsPosition() {
  const [positions, setPositions] = useState<GroupedPosition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPositions() {
      try {
        const [rawTxs, { data: categories }] = await Promise.all([
          transactionService.fetchTransactions(
            {
              search: '',
              type: 'all',
              category: 'all',
              paymentMethod: 'all',
              status: 'aberto',
              dateRange: undefined,
            },
            'admin',
          ),
          supabase
            .from('categories')
            .select('id, nome, natureza_contabil, efeito_caixa'),
        ])

        const categoryMap = new Map(categories?.map((c) => [c.id, c]) || [])

        const txs = rawTxs.map((tx) => {
          const cat =
            categoryMap.get(tx.categoria_id) ||
            categories?.find((c) => c.nome === tx.categoria_id)

          return {
            ...tx,
            natureza_contabil: cat?.natureza_contabil,
            efeito_caixa: cat?.efeito_caixa,
          }
        })

        const today = startOfDay(new Date())

        const groups: GroupedPosition[] = [
          {
            label: 'Hoje (D+0)',
            days: 0,
            payable: 0,
            receivable: 0,
            transactions: [],
          },
          {
            label: 'Próximos 7 dias',
            days: 7,
            payable: 0,
            receivable: 0,
            transactions: [],
          },
          {
            label: 'Próximos 15 dias',
            days: 15,
            payable: 0,
            receivable: 0,
            transactions: [],
          },
          {
            label: 'Próximos 30 dias',
            days: 30,
            payable: 0,
            receivable: 0,
            transactions: [],
          },
          {
            label: 'Futuro (> 30 dias)',
            days: 999,
            payable: 0,
            receivable: 0,
            transactions: [],
          },
        ]

        txs.forEach((tx) => {
          const diff = differenceInDays(startOfDay(tx.data), today)
          let targetGroup = groups[4]

          if (diff <= 0) targetGroup = groups[0]
          else if (diff <= 7) targetGroup = groups[1]
          else if (diff <= 15) targetGroup = groups[2]
          else if (diff <= 30) targetGroup = groups[3]

          if (tx.efeito_caixa === 'Saida') {
            targetGroup.payable += tx.valor
          } else if (tx.efeito_caixa === 'Entrada') {
            targetGroup.receivable += tx.valor
          } else if (tx.efeito_caixa === 'Sem_efeito') {
            // Sem efeito no caixa
          } else {
            // Fallback para tipo_id se sem efeito_caixa definido
            if (tx.tipo_id === TipoTransacao.Despesa) {
              targetGroup.payable += tx.valor
            } else {
              targetGroup.receivable += tx.valor
            }
          }
          targetGroup.transactions.push(tx)
        })

        setPositions(groups)
      } catch (err) {
        console.error('Failed to fetch positions', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPositions()
  }, [])

  if (loading) return null

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  return (
    <Card className="rounded-3xl border-none shadow-sm mt-0 sm:mt-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">
          Posição de Contas (Projetado)
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {positions.map((pos, idx) => (
          <Collapsible
            key={idx}
            className="border rounded-2xl bg-white p-3 sm:p-4 flex flex-col justify-between group/collapsible"
          >
            <CollapsibleTrigger className="w-full text-left flex items-center justify-between group">
              <div>
                <h4 className="text-sm font-semibold text-gray-700">
                  {pos.label}
                </h4>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-xs text-red-600 font-medium">
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                    Pagar: {formatCurrency(pos.payable)}
                  </div>
                  <div className="flex items-center text-xs text-green-600 font-medium">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    Receber: {formatCurrency(pos.receivable)}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400 transition-transform group-data-[state=open]/collapsible:rotate-180 self-start" />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4 pt-4 border-t space-y-2">
              {pos.transactions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center">
                  Sem contas neste período.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pos.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex flex-col overflow-hidden mr-2">
                        <span
                          className="font-semibold text-gray-800 truncate"
                          title={tx.descricao}
                        >
                          {tx.descricao}
                        </span>
                        <span className="text-gray-500">
                          {format(tx.data, 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'font-bold',
                          (
                            tx.efeito_caixa
                              ? tx.efeito_caixa === 'Saida'
                              : tx.tipo_id === 'Despesa'
                          )
                            ? 'text-red-600'
                            : 'text-green-600',
                        )}
                      >
                        {(
                          tx.efeito_caixa
                            ? tx.efeito_caixa === 'Saida'
                            : tx.tipo_id === 'Despesa'
                        )
                          ? '-'
                          : '+'}
                        {formatCurrency(tx.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  )
}
