import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { ChartDataPoint } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PerformanceChartProps {
  data: ChartDataPoint[]
  periodLabel?: string
}

export function PerformanceChart({ data, periodLabel }: PerformanceChartProps) {
  const hasData =
    data.length > 0 &&
    data.some(
      (d: any) =>
        d.realized !== 0 ||
        d.projected !== 0 ||
        d.revenue > 0 ||
        d.expenses > 0,
    )

  return (
    <Card className="rounded-3xl border-none shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold capitalize">
          Desempenho Financeiro{' '}
          {periodLabel ? `(${periodLabel})` : '(Este Mês)'}
        </CardTitle>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Realizado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
            <span className="text-gray-600">Projetado</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[250px] relative">
        {hasData ? (
          <ChartContainer
            config={{
              realized: { label: 'Realizado', color: 'hsl(var(--primary))' },
              projected: { label: 'Projetado', color: 'hsl(var(--muted))' },
            }}
            className="w-full h-full"
          >
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barGap={0}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                dy={10}
                minTickGap={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={(value) => `R$${value}`}
                width={50}
              />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const realized =
                      (payload.find((p) => p.dataKey === 'realized')
                        ?.value as number) || 0
                    const projected =
                      (payload.find((p) => p.dataKey === 'projected')
                        ?.value as number) || 0

                    const entry = payload[0].payload as any

                    return (
                      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 text-xs font-medium">
                        <p className="font-bold text-gray-700 mb-2">{label}</p>

                        <div className="mb-3">
                          <p className="text-gray-500 mb-1 text-[10px] uppercase">
                            Líquido
                          </p>
                          <div className="flex justify-between gap-4 text-blue-600 mb-1">
                            <span>Realizado:</span>
                            <span>R$ {realized.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-gray-500 mb-2">
                            <span>Projetado:</span>
                            <span>R$ {projected.toLocaleString('pt-BR')}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t flex flex-col gap-1">
                          <p className="text-gray-500 mb-1 text-[10px] uppercase mt-1">
                            Realizado Detalhado
                          </p>
                          <div className="flex justify-between gap-4 text-green-600">
                            <span>Receita:</span>
                            <span>
                              R${' '}
                              {entry.revRealized?.toLocaleString('pt-BR') || 0}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 text-red-500">
                            <span>Despesa:</span>
                            <span>
                              R${' '}
                              {entry.expRealized?.toLocaleString('pt-BR') || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="projected"
                fill="#E5E7EB"
                radius={[4, 4, 4, 4]}
                barSize={20}
              />
              <Bar
                dataKey="realized"
                fill="#3B82F6"
                radius={[4, 4, 4, 4]}
                barSize={20}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            Nenhum dado para este período
          </div>
        )}
      </CardContent>
    </Card>
  )
}
