import { useState, useEffect } from 'react'
import { PlanComparisonCards } from '@/components/checkout/PlanComparisonCards'
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader'
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter'
import { CheckoutModal } from '@/components/checkout/CheckoutModal'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

interface PlanData {
  id: string
  name: string
  priceMensal: number
  priceAnual: number
  features: string[]
}

export default function Checkout() {
  const { currentWorkspace } = useAuth()
  const [plans, setPlans] = useState<PlanData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'mensal' | 'anual'>(
    'mensal',
  )

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('plans')
        .select('*')
        .in('name', ['Mensal', 'Anual'])

      if (data) {
        const mapped: PlanData[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          priceMensal: p.price_mensal ?? p.price,
          priceAnual: p.price_anual ?? 0,
          features: Array.isArray(p.features) ? p.features : [],
        }))
        setPlans(mapped)
      }
      setLoading(false)
    }
    fetchPlans()
  }, [])

  const handleSelect = (period: 'mensal' | 'anual') => {
    const planName = period === 'anual' ? 'Anual' : 'Mensal'
    const plan = plans.find((p) => p.name === planName)
    if (plan) {
      setSelectedPlan(plan)
      setSelectedPeriod(period)
      setModalOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <CheckoutHeader />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Escolha o plano ideal para o seu negócio
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Compare as opções e escolha a melhor para o seu negócio. Sem
              fidelidade, cancele quando quiser.
            </p>
          </div>

          <PlanComparisonCards onSelect={handleSelect} />
        </div>
      </main>

      <CheckoutFooter />

      <CheckoutModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        plan={selectedPlan}
        billingPeriod={selectedPeriod}
        orgId={currentWorkspace?.id ?? null}
      />
    </div>
  )
}
