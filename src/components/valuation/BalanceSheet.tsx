import { useEffect, useState } from 'react'
import { Info, Loader2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { supabase } from '@/lib/supabase/client'

export function BalanceSheet() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    ativoCirculante: 0,
    ativoNaoCirculante: 0,
    passivoCirculante: 0,
    passivoNaoCirculante: 0,
    plCalculado: 0,
    plReal: 0,
  })
  const [hasLegacy, setHasLegacy] = useState(false)
  const [isBalanced, setIsBalanced] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: orgId } = await supabase.rpc('get_current_user_org_id')

      const [{ data: categories }, { data: txs }] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('transactions').select('*').eq('organization_id', orgId),
      ])

      const categoriesMap = new Map(categories?.map((c) => [c.id, c]))

      let ativoCirculante = 0
      let ativoNaoCirculante = 0
      let passivoCirculante = 0
      let passivoNaoCirculante = 0
      let plLancado = 0
      let resultadoAcumulado = 0
      let legacy = false

      if (txs) {
        txs.forEach((t: any) => {
          if (t.created_at && new Date(t.created_at) < new Date('2026-05-25')) {
            legacy = true
          }

          const amount = Number(t.amount || t.valor)
          const cat =
            categoriesMap.get(t.category) ||
            Array.from(categoriesMap.values()).find(
              (c) => c.nome === t.category,
            )
          const accGroup = cat?.accounting_group
          const natContabil = cat?.natureza_contabil

          if (accGroup === 'Ativo Circulante') ativoCirculante += amount
          else if (accGroup === 'Ativo Não-Circulante')
            ativoNaoCirculante += amount
          else if (accGroup === 'Passivo Circulante')
            passivoCirculante += amount
          else if (accGroup === 'Passivo Não-Circulante')
            passivoNaoCirculante += amount
          else if (accGroup === 'Patrimônio Líquido') plLancado += amount
          else {
            if (natContabil === 'Receita') resultadoAcumulado += amount
            if (natContabil === 'Despesa') resultadoAcumulado -= amount
          }
        })
      }

      const totalAtivo = ativoCirculante + ativoNaoCirculante
      const totalPassivo = passivoCirculante + passivoNaoCirculante
      const plCalculado = totalAtivo - totalPassivo
      const plReal = plLancado + resultadoAcumulado

      setData({
        ativoCirculante,
        ativoNaoCirculante,
        passivoCirculante,
        passivoNaoCirculante,
        plCalculado,
        plReal,
      })
      setHasLegacy(legacy)
      setIsBalanced(Math.abs(totalAtivo - (totalPassivo + plReal)) < 0.01)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center p-12 w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalAtivos = data.ativoCirculante + data.ativoNaoCirculante
  const totalPassivos = data.passivoCirculante + data.passivoNaoCirculante

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-6">
      {hasLegacy && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
          ⚠️ Dados legados não refletem estrutura contábil corrigida
        </div>
      )}
      {!isBalanced && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm font-semibold">
          ⚠️ Equação contábil não bate! Há erro nos lançamentos.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Ativos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Ativos
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gray-400 hover:text-primary transition-colors print:hidden">
                    <Info className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm">
                  <p className="font-semibold mb-2">O que são Ativos?</p>
                  <p className="text-gray-600 mb-2">
                    Bens e direitos capazes de gerar benefícios econômicos
                    futuros.
                  </p>
                </PopoverContent>
              </Popover>
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">
                Ativo Circulante (Subtotal)
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(data.ativoCirculante)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">
                Ativo Não-Circulante (Subtotal)
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(data.ativoNaoCirculante)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-gray-900">
                TOTAL ATIVO
              </span>
              <span className="text-sm font-bold text-green-600">
                {formatCurrency(totalAtivos)}
              </span>
            </div>
          </div>
        </div>

        {/* Passivos e PL */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Passivos e Patrimônio Líquido
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gray-400 hover:text-primary transition-colors print:hidden">
                    <Info className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm">
                  <p className="font-semibold mb-2">Estrutura Contábil</p>
                  <p className="text-gray-600 mb-2">
                    Passivos representam as obrigações. Patrimônio Líquido (PL)
                    representa o capital investido e os resultados acumulados.
                  </p>
                </PopoverContent>
              </Popover>
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">
                Passivo Circulante (Subtotal)
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(data.passivoCirculante)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">
                Passivo Não-Circulante (Subtotal)
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(data.passivoNaoCirculante)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm font-bold text-gray-900">
                TOTAL PASSIVO
              </span>
              <span className="text-sm font-bold text-red-600">
                {formatCurrency(totalPassivos)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50 mt-4">
              <span className="text-sm font-medium text-gray-600">
                Patrimônio Líquido (Subtotal)
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(data.plCalculado)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-gray-900">
                TOTAL PASSIVO + PL
              </span>
              <span className="text-sm font-bold text-blue-600">
                {formatCurrency(totalPassivos + data.plCalculado)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
