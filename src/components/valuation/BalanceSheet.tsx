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
    itemsAtivoCirculante: [] as any[],
    itemsAtivoNaoCirculante: [] as any[],
    itemsPassivoCirculante: [] as any[],
    itemsPassivoNaoCirculante: [] as any[],
    itemsPl: [] as any[],
  })
  const [isBalanced, setIsBalanced] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: orgId } = await supabase.rpc('get_current_user_org_id')

      const [{ data: categories }, { data: simpCats }, { data: txs }] =
        await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('categoria_simplificada').select('*'),
          supabase
            .from('transactions')
            .select('*')
            .eq('organization_id', orgId),
        ])

      const categoriesMap = new Map(categories?.map((c) => [c.id, c]))
      const simpCatsMap = new Map(
        simpCats?.map((c) => [c.nome_simplificado, c]),
      )

      let ativoCirculante = 0
      let ativoNaoCirculante = 0
      let passivoCirculante = 0
      let passivoNaoCirculante = 0
      let plLancado = 0
      let resultadoAcumulado = 0

      const groupMap = new Map<
        string,
        { nome: string; descTecnica: string; group: string; amount: number }
      >()

      if (txs) {
        txs.forEach((t: any) => {
          const amount = Number(t.amount || t.valor)
          let accGroup = 'Resultado'
          let natContabil = t.type === 'Receita' ? 'Receita' : 'Despesa'
          let nomeSimplificado = t.category
          let foundCat = false

          if (simpCatsMap.has(t.category)) {
            const sc = simpCatsMap.get(t.category)
            accGroup = sc.accounting_group
            natContabil = sc.natureza_contabil
            nomeSimplificado = sc.nome_simplificado
            foundCat = true
          }

          if (!foundCat) {
            const cat =
              categoriesMap.get(t.category) ||
              Array.from(categoriesMap.values()).find(
                (c) => c.nome === t.category,
              )
            if (cat) {
              accGroup = cat.accounting_group || 'Resultado'
              natContabil =
                cat.natureza_contabil ||
                (t.type === 'Receita' ? 'Receita' : 'Despesa')
              nomeSimplificado = cat.nome
            }
          }

          let netAmount = 0
          if (t.category === 'Depreciação e Amortização') {
            ativoNaoCirculante -= amount
            resultadoAcumulado -= amount
            netAmount = -amount
            accGroup = 'Ativo Não-Circulante'
            natContabil = 'Ativo'
            nomeSimplificado = 'Depreciação e Amortização'
          } else {
            if (accGroup === 'Ativo Circulante') {
              netAmount =
                natContabil === 'Ativo' && t.type === 'Receita'
                  ? -amount
                  : amount
              ativoCirculante += netAmount
            } else if (accGroup === 'Ativo Não-Circulante') {
              netAmount =
                natContabil === 'Ativo' && t.type === 'Receita'
                  ? -amount
                  : amount
              ativoNaoCirculante += netAmount
            } else if (accGroup === 'Passivo Circulante') {
              netAmount =
                natContabil === 'Passivo' && t.type === 'Despesa'
                  ? -amount
                  : amount
              passivoCirculante += netAmount
            } else if (accGroup === 'Passivo Não-Circulante') {
              netAmount =
                natContabil === 'Passivo' && t.type === 'Despesa'
                  ? -amount
                  : amount
              passivoNaoCirculante += netAmount
            } else if (accGroup === 'Patrimônio Líquido') {
              netAmount = amount
              plLancado += netAmount
            } else {
              if (t.type === 'Receita') resultadoAcumulado += amount
              else resultadoAcumulado -= amount
            }
          }

          if (
            accGroup !== 'Resultado' ||
            t.category === 'Depreciação e Amortização'
          ) {
            const key = `${nomeSimplificado}-${accGroup}`
            if (!groupMap.has(key)) {
              groupMap.set(key, {
                nome: nomeSimplificado,
                descTecnica: accGroup,
                group: accGroup,
                amount: 0,
              })
            }
            groupMap.get(key)!.amount += netAmount
          }
        })
      }

      const totalAtivo = ativoCirculante + ativoNaoCirculante
      const totalPassivo = passivoCirculante + passivoNaoCirculante
      const plCalculado = plLancado + resultadoAcumulado

      const allItems = Array.from(groupMap.values()).filter(
        (i) => i.amount !== 0,
      )

      setData({
        ativoCirculante,
        ativoNaoCirculante,
        passivoCirculante,
        passivoNaoCirculante,
        plCalculado,
        plReal: plLancado + resultadoAcumulado,
        itemsAtivoCirculante: allItems.filter(
          (i) => i.group === 'Ativo Circulante',
        ),
        itemsAtivoNaoCirculante: allItems.filter(
          (i) => i.group === 'Ativo Não-Circulante',
        ),
        itemsPassivoCirculante: allItems.filter(
          (i) => i.group === 'Passivo Circulante',
        ),
        itemsPassivoNaoCirculante: allItems.filter(
          (i) => i.group === 'Passivo Não-Circulante',
        ),
        itemsPl: allItems.filter((i) => i.group === 'Patrimônio Líquido'),
      })

      setIsBalanced(Math.abs(totalAtivo - (totalPassivo + plCalculado)) < 0.1)
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

  const renderItem = (item: any) => (
    <div
      key={item.nome}
      className="flex justify-between items-center py-1.5 pl-4 border-b border-gray-50/50"
    >
      <span className="text-xs text-gray-500">
        {item.nome} <span className="text-gray-400">({item.descTecnica})</span>
      </span>
      <span className="text-xs font-medium text-gray-700">
        {formatCurrency(item.amount)}
      </span>
    </div>
  )

  return (
    <div className="space-y-6">
      {!isBalanced && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm font-semibold">
          ⚠️ Equação contábil não bate! Há erro nos lançamentos. O Ativo deve
          ser exatamente igual ao Passivo + PL.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-blue-50/30">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              BENS E DIREITOS (ATIVOS)
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
                    futuros (Caixa, Estoque, Máquinas).
                  </p>
                </PopoverContent>
              </Popover>
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-gray-50/50 px-2 rounded">
                <span className="text-sm font-semibold text-gray-800">
                  Bens Atuais (Circulante)
                </span>
                <span className="text-sm font-semibold">
                  {formatCurrency(data.ativoCirculante)}
                </span>
              </div>
              {data.itemsAtivoCirculante.map(renderItem)}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-gray-50/50 px-2 rounded">
                <span className="text-sm font-semibold text-gray-800">
                  Bens Duráveis (Não-Circulante)
                </span>
                <span className="text-sm font-semibold">
                  {formatCurrency(data.ativoNaoCirculante)}
                </span>
              </div>
              {data.itemsAtivoNaoCirculante.map(renderItem)}
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
              <span className="text-base font-bold text-gray-900">
                TOTAL ATIVO
              </span>
              <span className="text-base font-bold text-blue-600">
                {formatCurrency(totalAtivos)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-red-50/30">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              DÍVIDAS E PATRIMÔNIO (PASSIVO + PL)
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gray-400 hover:text-primary transition-colors print:hidden">
                    <Info className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm">
                  <p className="font-semibold mb-2">Estrutura Contábil</p>
                  <p className="text-gray-600 mb-2">
                    Passivos representam as obrigações com terceiros. Patrimônio
                    Líquido (PL) representa o capital próprio e lucros retidos.
                  </p>
                </PopoverContent>
              </Popover>
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-gray-50/50 px-2 rounded">
                <span className="text-sm font-semibold text-gray-800">
                  Dívidas Curto Prazo (Circulante)
                </span>
                <span className="text-sm font-semibold">
                  {formatCurrency(data.passivoCirculante)}
                </span>
              </div>
              {data.itemsPassivoCirculante.map(renderItem)}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-gray-50/50 px-2 rounded">
                <span className="text-sm font-semibold text-gray-800">
                  Dívidas Longo Prazo (Não-Circulante)
                </span>
                <span className="text-sm font-semibold">
                  {formatCurrency(data.passivoNaoCirculante)}
                </span>
              </div>
              {data.itemsPassivoNaoCirculante.map(renderItem)}
            </div>

            <div className="space-y-1 mt-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-gray-50/50 px-2 rounded">
                <span className="text-sm font-semibold text-gray-800">
                  Seu Patrimônio (Patrimônio Líquido)
                </span>
                <span className="text-sm font-semibold">
                  {formatCurrency(data.plCalculado)}
                </span>
              </div>
              {data.itemsPl.map(renderItem)}
              <div className="flex justify-between items-center py-1.5 pl-4 border-b border-gray-50/50">
                <span className="text-xs text-gray-500">
                  Resultado Acumulado (Lucro/Prejuízo)
                </span>
                <span className="text-xs font-medium text-gray-700">
                  {formatCurrency(data.plCalculado - data.plReal)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
              <span className="text-base font-bold text-gray-900">
                TOTAL PASSIVO + PL
              </span>
              <span className="text-base font-bold text-red-600">
                {formatCurrency(totalPassivos + data.plCalculado)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
