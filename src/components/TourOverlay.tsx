import { useEffect, useState } from 'react'
import { useTourStore } from '@/stores/useTourStore'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'

const steps = [
  {
    target: 'sidebar-item-Início',
    title: 'Visão Geral',
    content:
      'Acompanhe seus saldos, despesas e receitas do mês. Essa é sua central de controle.',
  },
  {
    target: 'sidebar-item-Transações',
    title: 'Transações',
    content:
      'Registre todas as suas entradas e saídas para manter seu fluxo de caixa atualizado.',
  },
  {
    target: 'sidebar-item-DRE-Valuation',
    title: 'DRE e Valuation',
    content:
      'Analise seu Demonstrativo de Resultados (DRE) e descubra o valor do seu negócio de forma automatizada.',
  },
]

export function TourOverlay() {
  const { isActive, step, endTour, nextStep, prevStep } = useTourStore()
  const { user, profile, updateProfileContext } = useAuth()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isActive || isMobile) return

    const updatePosition = () => {
      const el = document.getElementById(steps[step].target)
      if (el) {
        setTargetRect(el.getBoundingClientRect())
      } else {
        setTargetRect(null)
      }
    }

    updatePosition()

    const interval = setInterval(updatePosition, 100)
    const timeout = setTimeout(() => clearInterval(interval), 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isActive, step, isMobile])

  // auto start tour
  useEffect(() => {
    if (profile && profile.onboarding_completed === false) {
      useTourStore.getState().startTour()
    }
  }, [profile])

  if (!isActive) return null

  const handleEnd = async () => {
    endTour()
    if (user && profile && !profile.onboarding_completed) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
      updateProfileContext({ onboarding_completed: true })
    }
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      nextStep()
    } else {
      handleEnd()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {isMobile || !targetRect ? (
        <div className="absolute inset-0 bg-black/60 pointer-events-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm pointer-events-auto animate-fade-in-up">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-slate-900">
                {steps[step].title}
              </h3>
              <button
                onClick={handleEnd}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {steps[step].content}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-400">
                {step + 1} de {steps.length}
              </span>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    Anterior
                  </Button>
                )}
                <Button size="sm" onClick={handleNext}>
                  {step === steps.length - 1 ? 'Concluir' : 'Próximo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className="absolute transition-all duration-300 rounded-xl pointer-events-auto"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            }}
          />
          <div
            className="absolute bg-white rounded-xl shadow-xl p-5 w-80 pointer-events-auto transition-all duration-300 animate-fade-in-up"
            style={{
              top: Math.max(16, targetRect.top),
              left: targetRect.right + 20,
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-900">
                {steps[step].title}
              </h3>
              <button
                onClick={handleEnd}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 text-sm mb-4">{steps[step].content}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400">
                {step + 1} de {steps.length}
              </span>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    Anterior
                  </Button>
                )}
                <Button size="sm" onClick={handleNext}>
                  {step === steps.length - 1 ? 'Concluir' : 'Próximo'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
