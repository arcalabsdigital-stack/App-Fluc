import { PlanComparisonCards } from '@/components/checkout/PlanComparisonCards'
import { GuaranteeSection } from '@/components/checkout/GuaranteeSection'
import { FAQSection } from '@/components/checkout/FAQSection'
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader'
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter'
import { useToast } from '@/components/ui/use-toast'

export default function Checkout() {
  const { toast } = useToast()

  const handleSelect = (plan: 'mensal' | 'anual') => {
    toast({
      title: 'Plano selecionado!',
      description: `Você selecionou o plano ${
        plan === 'anual' ? 'Anual' : 'Mensal'
      }. O pagamento será processado em breve.`,
    })
  }

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex flex-col">
      <CheckoutHeader />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Escolha o plano ideal para o seu negócio
            </h1>
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Compare as opções e escolha a melhor para o seu negócio. Sem
              fidelidade, cancele quando quiser.
            </p>
          </div>

          <PlanComparisonCards onSelect={handleSelect} />

          <GuaranteeSection />

          <FAQSection />
        </div>
      </main>

      <CheckoutFooter />
    </div>
  )
}
