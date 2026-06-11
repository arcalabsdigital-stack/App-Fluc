import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { KPIMetric } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  data: KPIMetric
}

export function KPICard({ data }: KPICardProps) {
  const isPositive = data.trend > 0
  const isNeutral = data.trend === 0

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-400',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  }

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(val)
    }
    return val
  }

  return (
    <Card className="rounded-2xl sm:rounded-3xl border-none shadow-sm hover:scale-[1.02] transition-transform duration-300 h-full lg:h-auto lg:min-h-[140px]">
      <CardContent className="p-3 sm:p-6 flex justify-between items-center h-full lg:h-auto lg:min-h-full">
        <div className="flex flex-col justify-between h-full lg:h-auto gap-2 sm:gap-4 w-full overflow-hidden">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 truncate pr-2">
            {data.label}
          </h3>

          <div className="flex flex-col">
            <span className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
              {formatValue(data.value)}
            </span>
            {data.subValue && (
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">
                {data.subValue}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap lg:mt-auto">
            <div
              className={cn(
                'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 sm:gap-1',
                isNeutral
                  ? 'bg-gray-100 text-gray-600'
                  : isPositive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700',
              )}
            >
              {isNeutral ? (
                <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              ) : isPositive ? (
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              )}
              {Math.abs(data.trend)}%
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 truncate hidden sm:inline-block max-w-[80px] xl:max-w-none">
              {data.trendLabel}
            </span>
          </div>
        </div>

        <div className="h-full flex items-end ml-2 sm:ml-4 flex-shrink-0">
          {/* Simple progress ring or bar could go here, but omitted for cleaner real-time UI */}
          <div className="h-12 sm:h-16 w-1 sm:w-1.5 rounded-full bg-gray-100 relative overflow-hidden">
            <div
              className={cn(
                'absolute bottom-0 left-0 w-full rounded-full transition-all duration-1000',
                colorMap[data.color],
              )}
              style={{
                height: `${Math.min(Math.max(data.progress, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
