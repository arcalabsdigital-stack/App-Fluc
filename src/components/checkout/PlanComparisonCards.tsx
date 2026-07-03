import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface PlanComparisonCardsProps {
  onSelect: (plan: 'mensal' | 'anual') => void
}

const monthlyBenefits = [
  'Acesso completo ao Fluc',
  'Dashboard financeiro',
  'Transações ilimitadas',
  'Conciliação bancária',
  'DRE e Valuation',
  'Suporte por e-mail',
]

const annualBenefits = [
  'Acesso completo ao Fluc',
  'Dashboard financeiro',
  'Transações ilimitadas',
  'Conciliação bancária',
  'DRE e Valuation',
  'Suporte por e-mail',
  'Suporte prioritário',
  '2 meses grátis',
]

function BenefitsList({ benefits }: { benefits: string[] }) {
  return (
    <ul className="space-y-3">
      {benefits.map((benefit, i) => (
        <li key={i} className="flex items-start">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 shrink-0 mr-3 mt-0.5">
            <Check className="h-3.5 w-3.5 text-green-600" />
          </div>
          <span className="text-slate-700 text-sm">{benefit}</span>
        </li>
      ))}
    </ul>
  )
}

export function PlanComparisonCards({ onSelect }: PlanComparisonCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
      <Card className="flex flex-col shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Plano Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          <div>
            <div className="flex items-baseline text-4xl font-extrabold text-slate-900">
              R$ 49,90
              <span className="text-xl font-medium text-slate-500 ml-1">
                /mês
              </span>
            </div>
          </div>
          <BenefitsList benefits={monthlyBenefits} />
        </CardContent>
        <CardFooter>
          <Button
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            onClick={() => onSelect('mensal')}
          >
            Assinar Mensal
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col border-2 border-blue-600 shadow-xl relative transition-all duration-300 hover:shadow-2xl md:scale-[1.03]">
        <div className="absolute -top-3 left-0 right-0 flex justify-center">
          <Badge className="bg-blue-600 text-white hover:bg-blue-700 uppercase tracking-wide text-xs font-bold py-1.5 px-4 shadow-md">
            MAIS POPULAR
          </Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Plano Anual
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          <div>
            <div className="flex items-baseline text-4xl font-extrabold text-slate-900">
              R$ 29,90
              <span className="text-xl font-medium text-slate-500 ml-1">
                /mês
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Equivalente a R$ 358,80/ano
            </p>
            <p className="text-sm text-green-600 font-bold mt-1">
              Economia de R$ 240/ano
            </p>
          </div>
          <BenefitsList benefits={annualBenefits} />
        </CardContent>
        <CardFooter>
          <Button
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md"
            onClick={() => onSelect('anual')}
          >
            Assinar Anual
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
