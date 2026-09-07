import { useEffect, useState, useMemo } from 'react'
import { Info, Loader2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { dashboardService } from '@/services/dashboardService'
import { subMonths } from 'date-fns'
import { Slider } from '@/components/ui/slider'

export function FcdTab() {
  const [loading, setLoading] = useState(true)
  const [baseFcf, setBaseFcf] = useState(0)
  const [wacc, setWacc] = useState([12]) // 12%
  const [growth, setGrowth] = useState([5]) // 5%
  const [terminalGrowth, setTerminalGrowth] = useState([2]) // 2%

  useEffect(() => {
    async function load() {
      const end = new Date()
      const start = subMonths(end, 12)
      const txs = await dashboardService.getTransactionsForPeriod(start, end)

      let cashFlow = 0
      txs.forEach((t) => {
        if (t.efeito_caixa) {
          if (t.efeito_caixa === 'Entrada') cashFlow += t.valor
          else if (t.efeito_caixa === 'Saida') cashFlow -= t.valor
          // 'Sem_efeito' não movimenta caixa
        } else {
          // Fallback se não houver efeito_caixa definido na categoria
          if (t.tipo_id === 'Receita') cashFlow += t.valor
          if (t.tipo_id === 'Despesa') cashFlow -= t.valor
        }
      })
      setBaseFcf(cashFlow > 0 ? cashFlow : 0)
      setLoading(false)
    }
    load()
  }, [])

  const projections = useMemo(() => {
    const years = []
    let currentFcf = baseFcf
    let presentValueSum = 0
    const w = wacc[0] / 100
    const g = growth[0] / 100
    const tg = terminalGrowth[0] / 100

    // Safeguard to ensure WACC > Terminal Growth
    const effectiveW = Math.max(w, tg + 0.001)

    for (let i = 1; i <= 4; i++) {
      currentFcf = currentFcf * (1 + g)
      const pv = currentFcf / Math.pow(1 + effectiveW, i)
      presentValueSum += pv
      years.push({ year: i, fcf: currentFcf, pv })
    }

    // Terminal Value
    const terminalValue = (currentFcf * (1 + tg)) / (effectiveW - tg)
    const presentTerminalValue = terminalValue / Math.pow(1 + effectiveW, 4)
    const enterpriseValue = presentValueSum + presentTerminalValue

    // Sensitivity WACC ±2%
    const wHigh = effectiveW + 0.02
    const wLow = Math.max(effectiveW - 0.02, tg + 0.001)

    const evHighWacc =
      presentValueSum +
      (currentFcf * (1 + tg)) / (wHigh - tg) / Math.pow(1 + wHigh, 4)
    const evLowWacc =
      presentValueSum +
      (currentFcf * (1 + tg)) / (wLow - tg) / Math.pow(1 + wLow, 4)

    return {
      years,
      terminalValue,
      presentTerminalValue,
      enterpriseValue,
      evHighWacc,
      evLowWacc,
    }
  }, [baseFcf, wacc, growth, terminalGrowth])

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <label className="text-sm font-medium text-gray-700 flex items-center justify-between mb-4">
            Custo de Capital (WACC): {wacc[0]}%
          </label>
          <Slider
            value={wacc}
            onValueChange={setWacc}
            min={5}
            max={30}
            step={0.5}
          />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <label className="text-sm font-medium text-gray-700 flex items-center justify-between mb-4">
            Crescimento (Anos 1-4): {growth[0]}%
          </label>
          <Slider
            value={growth}
            onValueChange={setGrowth}
            min={0}
            max={50}
            step={1}
          />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <label className="text-sm font-medium text-gray-700 flex items-center justify-between mb-4">
            Crescimento Perpétuo: {terminalGrowth[0]}%
          </label>
          <Slider
            value={terminalGrowth}
            onValueChange={setTerminalGrowth}
            min={0}
            max={10}
            step={0.5}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 gap-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Valuation Estimado (Enterprise Value)
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-gray-400 hover:text-primary print:hidden">
                  <Info className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm">
                <p className="font-semibold mb-2">Fluxo de Caixa Descontado</p>
                <p className="text-gray-600">
                  Calcula o valor da empresa baseado no dinheiro que ela vai
                  gerar no futuro, descontado a uma taxa de risco (WACC).
                </p>
              </PopoverContent>
            </Popover>
          </h3>
          <span className="text-2xl font-bold text-primary">
            {projections.enterpriseValue.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-gray-50/50">
            <p className="text-sm text-gray-500 mb-1">
              Cenário Otimista (WACC -2%)
            </p>
            <p className="text-lg font-bold text-green-600">
              {projections.evLowWacc.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
          <div className="p-4 border rounded-lg bg-gray-50/50">
            <p className="text-sm text-gray-500 mb-1">
              Cenário Pessimista (WACC +2%)
            </p>
            <p className="text-lg font-bold text-red-600">
              {projections.evHighWacc.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>

        <div className="p-0 overflow-x-auto border-t border-gray-100">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Ano</th>
                <th className="p-4 font-semibold">FCF Projetado</th>
                <th className="p-4 font-semibold">Valor Presente (PV)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="p-4 font-medium">Ano 0 (Base Real 12m)</td>
                <td className="p-4 text-gray-600">
                  {baseFcf.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>
                <td className="p-4">-</td>
              </tr>
              {projections.years.map((y) => (
                <tr key={y.year} className="border-b border-gray-50">
                  <td className="p-4 font-medium">Ano {y.year}</td>
                  <td className="p-4 text-gray-600">
                    {y.fcf.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="p-4 text-gray-600">
                    {y.pv.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <td className="p-4 font-bold text-gray-900">Valor Terminal</td>
                <td className="p-4 text-gray-600 font-medium">
                  {projections.terminalValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>
                <td className="p-4 font-bold text-primary">
                  {projections.presentTerminalValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hidden print:block p-6 bg-gray-50 border-t border-gray-100 text-sm">
          <p className="font-semibold mb-2">Premissas Utilizadas:</p>
          <ul className="list-disc pl-4 space-y-1 text-gray-600">
            <li>Custo de Capital (WACC): {wacc[0]}%</li>
            <li>Crescimento Projetado (Anos 1-4): {growth[0]}%</li>
            <li>Crescimento Perpétuo na Perpetuidade: {terminalGrowth[0]}%</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
