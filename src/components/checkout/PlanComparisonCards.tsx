import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface PlanData {
  id: string
  name: string
  priceMensal: number
  priceAnual: number
  features: string[]
}

interface PlanComparisonCardsProps {
  plan: PlanData
  onSelect: (billingPeriod: 'mensal' | 'anual') => void
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value,
  )

export function PlanComparisonCards({
  plan,
  onSelect,
}: PlanComparisonCardsProps) {
  const annualMonthlyEquivalent = plan.priceAnual / 12
  const annualSavings = plan.priceMensal * 12 - plan.priceAnual
  const savingsPercent = Math.round(
    (annualSavings / (plan.priceMensal * 12)) * 100,
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <Card className="flex flex-col border-slate-200 transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Mensal</CardTitle>
          <CardDescription>Cobrança mensal recorrente</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          <div className="space-y-1">
            <div className="flex items-baseline text-4xl font-extrabold">
              {formatCurrency(plan.priceMensal)}
              <span className="text-xl font-medium text-slate-500 ml-1">
                /mês
              </span>
            </div>
          </div>
          <ul className="space-y-3">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full h-11 text-base font-semibold bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50"
            onClick={() => onSelect('mensal')}
          >
            Selecionar
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col border-2 border-slate-900 shadow-lg relative transition-all duration-300 hover:shadow-xl md:scale-105">
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <Badge className="bg-slate-900 text-white hover:bg-slate-800 uppercase tracking-wide text-xs font-bold py-1 px-3">
            Mais Popular
          </Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Anual</CardTitle>
          <CardDescription>Cobrança anual com economia</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          <div className="space-y-1">
            <div className="flex items-baseline text-4xl font-extrabold">
              {formatCurrency(plan.priceAnual)}
              <span className="text-xl font-medium text-slate-500 ml-1">
                /ano
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Equivalente a {formatCurrency(annualMonthlyEquivalent)}/mês
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold text-sm">
                Economize {formatCurrency(annualSavings)} ({savingsPercent}%)
              </Badge>
            </div>
          </div>
          <ul className="space-y-3">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full h-11 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => onSelect('anual')}
          >
            Selecionar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
