import { useEffect, useState } from 'react'
import { Info, Loader2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { supabase } from '@/lib/supabase/client'
import { subMonths, isSameMonth } from 'date-fns'

interface MonthData {
  label: string
  date: Date
  rob: number
  deducoes: number
  rol: number
  cpv: number
  lucroBruto: number
  margemBruta: number
  despesasOperacionais: number
  depreciacao: number
  ebit: number
  receitasFinanceiras: number
  despesasFinanceiras: number
  resultadoFinanceiro: number
  lair: number
  irCsll: number
  lucroLiquido: number
  margemLiquida: number
}

const monthNames = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

export function DreTab() {
  const [loading, setLoading] = useState(true)
  const [hasLegacy, setHasLegacy] = useState(false)
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [totals, setTotals] = useState<Omit<MonthData, 'label' | 'date'>>({
    rob: 0,
    deducoes: 0,
    rol: 0,
    cpv: 0,
    lucroBruto: 0,
    margemBruta: 0,
    despesasOperacionais: 0,
    depreciacao: 0,
    ebit: 0,
    receitasFinanceiras: 0,
    despesasFinanceiras: 0,
    resultadoFinanceiro: 0,
    lair: 0,
    irCsll: 0,
    lucroLiquido: 0,
    margemLiquida: 0,
  })

  useEffect(() => {
    async function load() {
      const { data: orgId } = await supabase.rpc('get_current_user_org_id')

      const [{ data: categories }, { data: simCategories }, { data: txs }] =
        await Promise.all([
          supabase.from('categories').select('*'),
          supabase
            .from('categoria_simplificada')
            .select('*')
            .or(`organization_id.eq.${orgId},organization_id.is.null`),
          supabase
            .from('transactions')
            .select('*')
            .eq('organization_id', orgId),
        ])

      const categoriesMap = new Map(categories?.map((c) => [c.id, c]))
      const simCategoriesMap = new Map(
        simCategories?.map((c) => [c.nome_simplificado, c]),
      )

      const end = new Date()
      const start = subMonths(end, 11)

      const months: MonthData[] = Array.from({ length: 12 }).map((_, i) => {
        const d = subMonths(end, 11 - i)
        return {
          date: d,
          label: `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`,
          rob: 0,
          deducoes: 0,
          rol: 0,
          cpv: 0,
          lucroBruto: 0,
          margemBruta: 0,
          despesasOperacionais: 0,
          depreciacao: 0,
          ebit: 0,
          receitasFinanceiras: 0,
          despesasFinanceiras: 0,
          resultadoFinanceiro: 0,
          lair: 0,
          irCsll: 0,
          lucroLiquido: 0,
          margemLiquida: 0,
        }
      })

      const tot = {
        rob: 0,
        deducoes: 0,
        rol: 0,
        cpv: 0,
        lucroBruto: 0,
        margemBruta: 0,
        despesasOperacionais: 0,
        depreciacao: 0,
        ebit: 0,
        receitasFinanceiras: 0,
        despesasFinanceiras: 0,
        resultadoFinanceiro: 0,
        lair: 0,
        irCsll: 0,
        lucroLiquido: 0,
        margemLiquida: 0,
      }

      let legacy = false

      if (txs) {
        txs.forEach((t: any) => {
          if (t.created_at && new Date(t.created_at) < new Date('2026-05-25')) {
            legacy = true
          }

          const txDate = new Date(t.date + 'T12:00:00')
          if (
            txDate < start ||
            txDate > new Date(end.getFullYear(), end.getMonth() + 1, 0)
          )
            return

          const m = months.find((x) => isSameMonth(x.date, txDate))
          if (!m) return

          const amount = Number(t.amount || t.valor)
          let accGroup = null
          let natContabil = null

          const simCat =
            simCategoriesMap.get(t.category) ||
            simCategoriesMap.get(t.categoria_id)

          if (simCat) {
            accGroup = simCat.accounting_group
            natContabil = simCat.natureza_contabil
          } else {
            const cat =
              categoriesMap.get(t.category) ||
              Array.from(categoriesMap.values()).find(
                (c) => c.nome === t.category,
              )
            accGroup = cat?.accounting_group
            natContabil = cat?.natureza_contabil
          }

          if (natContabil === 'Receita' && accGroup === 'Receita Operacional') {
            m.rob += amount
            tot.rob += amount
          } else if (accGroup === 'Dedução') {
            m.deducoes += amount
            tot.deducoes += amount
          } else if (accGroup === 'Custo Direto') {
            m.cpv += amount
            tot.cpv += amount
          } else if (
            accGroup === 'Operacional' ||
            accGroup === 'CUSTOS FIXOS'
          ) {
            m.despesasOperacionais += amount
            tot.despesasOperacionais += amount
          } else if (accGroup === 'Não Desembolsável') {
            m.depreciacao += amount
            tot.depreciacao += amount
          } else if (accGroup === 'Receita Financeira') {
            m.receitasFinanceiras += amount
            tot.receitasFinanceiras += amount
          } else if (accGroup === 'Financeira') {
            m.despesasFinanceiras += amount
            tot.despesasFinanceiras += amount
          }
        })
      }

      months.forEach((m) => {
        m.rol = m.rob - m.deducoes
        m.lucroBruto = m.rol - m.cpv
        m.margemBruta = m.rol > 0 ? (m.lucroBruto / m.rol) * 100 : 0
        m.ebit = m.lucroBruto - m.despesasOperacionais - m.depreciacao
        m.resultadoFinanceiro = m.receitasFinanceiras - m.despesasFinanceiras
        m.lair = m.ebit + m.resultadoFinanceiro
        m.irCsll = m.lair > 0 ? m.lair * 0.06 : 0
        m.lucroLiquido = m.lair - m.irCsll
        m.margemLiquida = m.rol > 0 ? (m.lucroLiquido / m.rol) * 100 : 0
      })

      tot.rol = tot.rob - tot.deducoes
      tot.lucroBruto = tot.rol - tot.cpv
      tot.margemBruta = tot.rol > 0 ? (tot.lucroBruto / tot.rol) * 100 : 0
      tot.ebit = tot.lucroBruto - tot.despesasOperacionais - tot.depreciacao
      tot.resultadoFinanceiro =
        tot.receitasFinanceiras - tot.despesasFinanceiras
      tot.lair = tot.ebit + tot.resultadoFinanceiro
      tot.irCsll = tot.lair > 0 ? tot.lair * 0.06 : 0
      tot.lucroLiquido = tot.lair - tot.irCsll
      tot.margemLiquida = tot.rol > 0 ? (tot.lucroLiquido / tot.rol) * 100 : 0

      setMonthlyData(months)
      setTotals(tot)
      setHasLegacy(legacy)
      setLoading(false)
    }
    load()
  }, [])

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )

  const formatVal = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const formatPct = (v: number) => `${v.toFixed(1)}%`

  return (
    <div className="space-y-6">
      {hasLegacy && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
          ⚠️ Dados legados não refletem estrutura contábil corrigida
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Demonstrativo do Resultado do Exercício (DRE)
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-gray-400 hover:text-primary print:hidden">
                  <Info className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm">
                <p className="font-semibold mb-2">O que é o DRE?</p>
                <p className="text-gray-600">
                  Resumo financeiro estruturado que evidencia o desempenho do
                  negócio partindo da receita bruta até o lucro líquido.
                </p>
              </PopoverContent>
            </Popover>
          </h3>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold min-w-[250px]">Métrica</th>
                {monthlyData.map((m) => (
                  <th
                    key={m.label}
                    className="p-4 font-semibold whitespace-nowrap"
                  >
                    {m.label}
                  </th>
                ))}
                <th className="p-4 font-semibold text-primary whitespace-nowrap">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="p-4 font-medium">RECEITA OPERACIONAL BRUTA</td>
                {monthlyData.map((m, i) => (
                  <td key={i} className="p-4 text-green-600 whitespace-nowrap">
                    {formatVal(m.rob)}
                  </td>
                ))}
                <td className="p-4 font-bold text-green-600 whitespace-nowrap">
                  {formatVal(totals.rob)}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="p-4 font-medium text-red-600">(-) DEDUÇÕES</td>
                {monthlyData.map((m, i) => (
                  <td key={i} className="p-4 text-red-600 whitespace-nowrap">
                    {formatVal(m.deducoes)}
                  </td>
                ))}
                <td className="p-4 font-bold text-red-600 whitespace-nowrap">
                  {formatVal(totals.deducoes)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <td className="p-4 font-bold">
                  (=) RECEITA OPERACIONAL LÍQUIDA
                </td>
                {monthlyData.map((m, i) => (
                  <td
                    key={i}
                    className={`p-4 font-bold whitespace-nowrap ${m.rol >= 0 ? 'text-primary' : 'text-red-600'}`}
                  >
                    {formatVal(m.rol)}
                  </td>
                ))}
                <td
                  className={`p-4 font-bold whitespace-nowrap ${totals.rol >= 0 ? 'text-primary' : 'text-red-600'}`}
                >
                  {formatVal(totals.rol)}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="p-4 font-medium text-red-600">
                  (-) CUSTOS DOS PRODUTOS/SERVIÇOS
                </td>
                {monthlyData.map((m, i) => (
                  <td key={i} className="p-4 text-red-600 whitespace-nowrap">
                    {formatVal(m.cpv)}
                  </td>
                ))}
                <td className="p-4 font-bold text-red-600 whitespace-nowrap">
                  {formatVal(totals.cpv)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <td className="p-4 font-bold">(=) LUCRO BRUTO</td>
                {monthlyData.map((m, i) => (
                  <td
                    key={i}
                    className={`p-4 font-bold whitespace-nowrap ${m.lucroBruto >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatVal(m.lucroBruto)}
                  </td>
                ))}
                <td
                  className={`p-4 font-bold whitespace-nowrap ${totals.lucroBruto >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatVal(totals.lucroBruto)}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="p-4 font-medium text-gray-500">
                  Margem Bruta (%)
                </td>
                {monthlyData.map((m, i) => (
                  <td key={i} className="p-4 text-gray-500 whitespace-nowrap">
                    {formatPct(m.margemBruta)}
                  </td>
                ))}
                <td className="p-4 font-semibold text-gray-600 whitespace-nowrap">
                  {formatPct(totals.margemBruta)}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="p-4 font-medium text-red-600">
                  (-) DESPESAS OPERACIONAIS
                </td>
                {monthlyData.map((m, i) => (
                  <td key={i} className="p-4 text-red-600 whitespace-nowrap">
                    {formatVal(m.despesasOperacionais)}
                  </td>
                ))}
                <td className="p-4 font-bold text-red-600 whitespace-nowrap">
                  {formatVal(totals.despesasOperacionais)}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="p-4 font-medium text-red-600">
                  (-) DEPRECIAÇÃO E AMORTIZAÇÃO
                </td>
                {monthlyData.map((m, i) => (
                  <td key={i} className="p-4 text-red-600 whitespace-nowrap">
                    {formatVal(m.depreciacao)}
                  </td>
                ))}
                <td className="p-4 font-bold text-red-600 whitespace-nowrap">
                  {formatVal(totals.depreciacao)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <td className="p-4 font-bold">(=) EBIT (LUCRO OPERACIONAL)</td>
                {monthlyData.map((m, i) => (
                  <td
                    key={i}
                    className={`p-4 font-bold whitespace-nowrap ${m.ebit >= 0 ? 'text-primary' : 'text-red-600'}`}
                  >
                    {formatVal(m.ebit)}
                  </td>
                ))}
                <td
                  className={`p-4 font-bold whitespace-nowrap ${totals.ebit >= 0 ? 'text-primary' : 'text-red-600'}`}
                >
                  {formatVal(totals.ebit)}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="p-4 font-medium text-gray-700">
                  (+/-) RESULTADO FINANCEIRO
                </td>
                {monthlyData.map((m, i) => (
                  <td
                    key={i}
                    className={`p-4 whitespace-nowrap ${m.resultadoFinanceiro >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatVal(m.resultadoFinanceiro)}
                  </td>
                ))}
                <td
                  className={`p-4 font-bold whitespace-nowrap ${totals.resultadoFinanceiro >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatVal(totals.resultadoFinanceiro)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <td className="p-4 font-bold">(=) LAIR</td>
                {monthlyData.map((m, i) => (
                  <td
                    key={i}
                    className={`p-4 font-bold whitespace-nowrap ${m.lair >= 0 ? 'text-primary' : 'text-red-600'}`}
                  >
                    {formatVal(m.lair)}
                  </td>
                ))}
                <td
                  className={`p-4 font-bold whitespace-nowrap ${totals.lair >= 0 ? 'text-primary' : 'text-red-600'}`}
                >
                  {formatVal(totals.lair)}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="p-4 font-medium text-red-600">(-) IR E CSLL</td>
                {monthlyData.map((m, i) => (
                  <td key={i} className="p-4 text-red-600 whitespace-nowrap">
                    {formatVal(m.irCsll)}
                  </td>
                ))}
                <td className="p-4 font-bold text-red-600 whitespace-nowrap">
                  {formatVal(totals.irCsll)}
                </td>
              </tr>
              <tr className="bg-primary/5 border-b-2 border-primary/20">
                <td className="p-4 font-bold text-primary">
                  (=) LUCRO LÍQUIDO DO EXERCÍCIO
                </td>
                {monthlyData.map((m, i) => (
                  <td
                    key={i}
                    className={`p-4 font-bold whitespace-nowrap ${m.lucroLiquido >= 0 ? 'text-primary' : 'text-red-600'}`}
                  >
                    {formatVal(m.lucroLiquido)}
                  </td>
                ))}
                <td
                  className={`p-4 font-bold whitespace-nowrap ${totals.lucroLiquido >= 0 ? 'text-primary' : 'text-red-600'}`}
                >
                  {formatVal(totals.lucroLiquido)}
                </td>
              </tr>
              <tr className="bg-gray-50/30">
                <td className="p-4 font-medium text-gray-600">
                  Margem Líquida (%)
                </td>
                {monthlyData.map((m, i) => (
                  <td
                    key={i}
                    className={`p-4 whitespace-nowrap font-medium ${m.margemLiquida >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatPct(m.margemLiquida)}
                  </td>
                ))}
                <td
                  className={`p-4 font-bold whitespace-nowrap ${totals.margemLiquida >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatPct(totals.margemLiquida)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
