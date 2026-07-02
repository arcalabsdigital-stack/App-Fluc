import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { PlanComparisonCards } from '@/components/checkout/PlanComparisonCards'
import { CheckoutModal } from '@/components/checkout/CheckoutModal'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface PlanData {
  id: string
  name: string
  priceMensal: number
  priceAnual: number
  features: string[]
}

function parseFeatures(features: any): string[] {
  if (Array.isArray(features)) return features
  if (features && typeof features === 'object' && Array.isArray(features.items))
    return features.items
  return []
}

export default function Checkout() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<PlanData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<
    'mensal' | 'anual'
  >('mensal')
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .order('price_mensal', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((p) => ({
            id: p.id,
            name: p.name,
            priceMensal: p.price_mensal || p.price || 0,
            priceAnual: p.price_anual || (p.price_mensal || p.price || 0) * 10,
            features: parseFeatures(p.features),
          }))
          setPlans(mapped)
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setOrgId(data.organization_id)
        })
    }
  }, [user])

  const selectedPlan = plans[selectedPlanIndex] || null

  const handleSelect = (billingPeriod: 'mensal' | 'anual') => {
    setSelectedBillingPeriod(billingPeriod)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="py-6 px-4 sm:px-6 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              F
            </div>
            <span className="text-2xl font-bold tracking-tight">Fluc</span>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Escolha seu plano
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Compare as opções e escolha a melhor para o seu negócio.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {plans.length > 1 && (
                <div className="flex justify-center gap-2 flex-wrap">
                  {plans.map((plan, i) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanIndex(i)}
                      className={cn(
                        'px-6 py-2 rounded-full font-semibold text-sm transition-all',
                        i === selectedPlanIndex
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      {plan.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedPlan && (
                <PlanComparisonCards
                  plan={selectedPlan}
                  onSelect={handleSelect}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="py-6 px-4 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              F
            </div>
            <span className="text-lg font-bold tracking-tight">Fluc</span>
          </div>
        </div>
      </footer>

      <CheckoutModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        plan={selectedPlan}
        billingPeriod={selectedBillingPeriod}
        orgId={orgId}
      />
    </div>
  )
}
