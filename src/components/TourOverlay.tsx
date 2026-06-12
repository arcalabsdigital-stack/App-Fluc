import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTourStore } from '@/stores/useTourStore'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const tourSteps = [
  {
    target: 'dashboard-kpis',
    title: 'Visão Geral',
    content:
      'Acompanhe seus saldos, despesas e receitas do mês. Essa é sua central de controle.',
    path: '/',
  },
  {
    target: 'month-filters',
    title: 'Filtros de Mês',
    content:
      'Selecione o mês e o ano para visualizar o diagnóstico de diferentes períodos.',
    path: '/diagnostico',
  },
  {
    target: 'planning-container',
    title: 'Planejamento Financeiro',
    content:
      'Defina suas metas de receita e mapeie seus custos para projetar seu resultado.',
    path: '/planejamento',
  },
  {
    target: 'transactions-list',
    title: 'Gestão de Transações',
    content:
      'Aqui você visualiza todas as suas entradas e saídas e seus respectivos status.',
    path: '/payments',
  },
  {
    target: 'btn-add-transaction',
    title: 'Nova Transação',
    content: 'Adicione rapidamente novas receitas ou despesas clicando aqui.',
    path: '/payments',
  },
  {
    target: 'categories-list',
    title: 'Categorias',
    content:
      'Organize suas transações com categorias pré-definidas ou crie as suas próprias.',
    path: '/categories',
  },
]

export function TourOverlay() {
  const { isActive, step, endTour, nextStep, prevStep } = useTourStore()
  const { user, profile, updateProfileContext } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isActive) return
    const currentStep = tourSteps[step]
    if (location.pathname !== currentStep.path) {
      setIsReady(false)
      // Small delay to allow smooth transition before showing tooltip
      setTimeout(() => navigate(currentStep.path), 300)
    } else {
      setIsReady(true)
    }
  }, [isActive, step, location.pathname, navigate])

  useEffect(() => {
    if (!isActive || isMobile || !isReady) return
    const currentStep = tourSteps[step]

    const updatePosition = () => {
      const el = document.getElementById(currentStep.target)
      if (el) {
        setTargetRect(el.getBoundingClientRect())
      } else {
        setTargetRect(null)
      }
    }

    updatePosition()
    const interval = setInterval(updatePosition, 100)
    return () => clearInterval(interval)
  }, [isActive, step, isMobile, isReady])

  useEffect(() => {
    if (!localStorage.getItem('fluc_tour_completed')) {
      useTourStore.getState().startTour()
    }
  }, [])

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
    if (step < tourSteps.length - 1) {
      nextStep()
    } else {
      handleEnd()
    }
  }

  const currentStep = tourSteps[step]

  let topPos = window.innerHeight / 2 - 100
  let leftPos = window.innerWidth / 2 - 160
  let isPlacedAbove = false

  if (targetRect) {
    topPos = targetRect.bottom + 16
    leftPos = Math.max(16, Math.min(window.innerWidth - 336, targetRect.left))

    if (topPos + 250 > window.innerHeight) {
      topPos = Math.max(16, targetRect.top - 230)
      isPlacedAbove = true
    }
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      />

      {isMobile ? (
        <div className="absolute inset-0 bg-black/60 pointer-events-auto flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-fade-in-up">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-slate-900">
                {currentStep.title}
              </h3>
              <button
                onClick={handleEnd}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {currentStep.content}
            </p>
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEnd}
                className="text-slate-500"
              >
                Pular tour
              </Button>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    Anterior
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90"
                >
                  {step === tourSteps.length - 1 ? 'Concluir' : 'Próximo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {targetRect && isReady ? (
            <div
              className="absolute transition-all duration-300 rounded-xl pointer-events-none ring-2 ring-primary ring-offset-2 ring-offset-transparent z-[101]"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow:
                  '0 0 0 9999px rgba(0,0,0,0.6), 0 0 20px rgba(59,130,246,0.5)',
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-black/60 pointer-events-none z-[101] transition-opacity duration-300" />
          )}

          <div
            className={cn(
              'absolute bg-white rounded-xl shadow-xl p-5 w-80 pointer-events-auto transition-all duration-300 z-[102]',
              isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            )}
            style={{
              top: topPos,
              left: leftPos,
            }}
          >
            {targetRect && (
              <div
                className={cn(
                  'absolute w-4 h-4 bg-white transform rotate-45',
                  isPlacedAbove ? '-bottom-2' : '-top-2',
                )}
                style={{ left: Math.min(targetRect.width / 2 + 16, 140) }}
              />
            )}

            <div className="flex justify-between items-start mb-2 relative">
              <h3 className="font-bold text-lg text-slate-900">
                {currentStep.title}
              </h3>
              <button
                onClick={handleEnd}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 text-sm mb-4 relative">
              {currentStep.content}
            </p>

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs font-semibold text-slate-400">
                {step + 1} de {tourSteps.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEnd}
                className="text-slate-500 h-8 px-2 text-xs"
              >
                Pular tour
              </Button>
            </div>

            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2 w-full">
                {step > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="flex-1"
                  >
                    Anterior
                  </Button>
                ) : (
                  <div className="flex-1" />
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {step === tourSteps.length - 1 ? 'Concluir' : 'Próximo'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
