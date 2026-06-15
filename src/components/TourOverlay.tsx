import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTourStore } from '@/stores/useTourStore'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const allTourSteps = [
  {
    target: 'unified-cash-position',
    title: 'Visão Geral: Seus Saldos',
    content:
      'Estes são seus 3 saldos. Conciliado é o que bate com o banco. Realizado é o que já entrou ou saiu. Projetado é o futuro previsto. Eles formam a base do seu controle.',
    path: '/',
  },
  {
    target: 'upcoming-transactions',
    title: 'Visão Geral: Próximos Lançamentos',
    content:
      'Aqui aparecem as contas que vencem em breve. O laranja indica vencidos. Clique em qualquer item para conciliar ou pagar.',
    path: '/',
  },
  {
    target: 'unified-cash-position',
    title: 'Visão Geral: Projeção de Caixa',
    content:
      'Sua projeção de caixa mostra se você terá dinheiro sobrando ou faltando em cada período. Verde é positivo, vermelho é negativo.',
    path: '/',
  },
  {
    target: 'sidebar-item-Diagnostico',
    title: 'Menu: Meu Diagnóstico',
    content:
      'Acesse seu painel de saúde financeira. O Score e o GAP mostram se você está no controle ou precisa de ação.',
    path: '/',
  },
  {
    target: 'diagnostico-score-gap',
    title: 'Meu Diagnóstico: Score e GAP',
    content:
      'Score vai de 0 a 100 e mede sua performance. GAP mostra a diferença entre planejado e realizado. Sem projeção, o Score fica zerado e aparece o alerta Atenção necessária.',
    path: '/diagnostico',
  },
  {
    target: 'diagnostico-receitas-despesas',
    title: 'Meu Diagnóstico: Receitas e Despesas',
    content:
      'Compare o planejado versus o realizado por tipo. Isso revela se você está estimando bem seus números.',
    path: '/diagnostico',
  },
  {
    target: 'btn-simular-decisao',
    title: 'Meu Diagnóstico: Simular Decisão',
    content:
      'Teste cenários antes de decidir. Que tal simular uma nova despesa ou receita e ver o impacto no caixa?',
    path: '/diagnostico',
  },
  {
    target: 'month-filters',
    title: 'Meu Diagnóstico: Filtros de Mês',
    content:
      'Use este filtro para navegar entre meses. Todo o diagnóstico se atualiza automaticamente para o período escolhido.',
    path: '/diagnostico',
  },
  {
    target: 'sidebar-item-Transações',
    title: 'Menu: Transações',
    content:
      'Esta é a tela central de registros. Toda receita, despesa, transferência e projeção vive aqui.',
    path: '/diagnostico',
  },
  {
    target: 'transactions-list',
    title: 'Transações: Tabela de Registros',
    content:
      'Veja todas as entradas e saídas. Use os filtros para encontrar qualquer registro. Receita aparece em verde, Despesa em vermelho.',
    path: '/payments',
  },
  {
    target: 'btn-add-transaction',
    title: 'Transações: Nova Transação',
    content:
      'Clique aqui para lançar uma receita ou despesa rápida. É o botão mais usado do Fluc. Preencha data, descrição, categoria, valor e forma de pagamento.',
    path: '/payments',
  },
  {
    target: 'btn-import-csv',
    title: 'Transações: Importar via CSV',
    content:
      'Se já tem uma planilha pronta, use o modelo CSV, preencha e importe tudo de uma vez. Agilidade na migração.',
    path: '/payments',
  },
  {
    target: 'transactions-status-col',
    title: 'Transações: Status e Conciliação',
    content:
      'Pendente é projeção. Realizado é o que já aconteceu. Conciliado é o que bateu com o extrato bancário. O triângulo do Método PAC.',
    path: '/payments',
  },
  {
    target: 'sidebar-item-Contas',
    title: 'Menu: Contas Bancárias',
    content:
      'Cadastre suas contas bancárias, cartões e carteiras. O saldo conciliado vem daqui.',
    path: '/payments',
  },
  {
    target: 'sidebar-item-Conciliacao',
    title: 'Menu: Conciliação',
    content:
      'Compare suas transações com o extrato bancário. O Fluc ajuda a encontrar divergências automaticamente.',
    path: '/payments',
  },
  {
    target: 'sidebar-item-Orçamentos',
    title: 'Menu: Orçamentos',
    content:
      'Defina limites de gasto por categoria e acompanhe o quanto já foi consumido.',
    path: '/payments',
  },
  {
    target: 'budgets-progress',
    title: 'Orçamentos: Barra de Progresso',
    content:
      'Verde está dentro do previsto. Amarelo está perto do limite. Vermelho estourou. Controle visual e imediato.',
    path: '/budgets',
  },
  {
    target: 'sidebar-item-Recorrentes',
    title: 'Menu: Gastos Recorrentes',
    content:
      'Cadastre contas que repetem todo mês: aluguel, salários, assinaturas. O Fluc gera as projeções automaticamente.',
    path: '/budgets',
  },
  {
    target: 'sidebar-item-Categorias',
    title: 'Menu: Categorias',
    content:
      'Organize suas finanças por categorias personalizadas. Receitas e despesas separadas para clareza nos relatórios.',
    path: '/budgets',
  },
  {
    target: 'sidebar-item-Histórico',
    title: 'Menu: Histórico',
    content:
      'Veja todos os planejamentos mensais já criados. Acompanhe a evolução das suas projeções de receita e custo ao longo do tempo.',
    path: '/budgets',
  },
  {
    target: 'btn-novo-planejamento',
    title: 'Histórico: Novo Planejamento',
    content:
      'Inicie o planejamento de um novo mês. Defina meta de faturamento, mapeie custos fixos e variáveis, e projete seu resultado.',
    path: '/planejamento',
  },
  {
    target: 'planejamento-receitas',
    title: 'Planejamento: Projeção de Receitas',
    content:
      'Defina sua meta de faturamento e descreva as fontes: contratos recorrentes, novos projetos, vendas. Use Replicar do mês anterior para agilizar.',
    path: '/planejamento',
  },
  {
    target: 'sidebar-item-DRE-Valuation',
    title: 'Menu: DRE / Valuation',
    content:
      'Gere sua Demonstração do Resultado do Exercício e valuation da empresa. Exporte para PDF ou Excel.',
    path: '/planejamento',
  },
  {
    target: 'sidebar-item-Usuários',
    title: 'Menu: Gerenciar Usuários',
    content:
      'Adicione colaboradores e contadores. Defina permissões de acesso por perfil.',
    path: '/planejamento',
  },
  {
    target: 'sidebar-workspace',
    title: 'Menu: Novo Workspace',
    content:
      'Aqui você vê em qual workspace está trabalhando. Para criar um novo workspace ou alternar entre empresas, clique nesta área.',
    path: '/planejamento',
  },
  {
    target: 'sidebar-item-Configurações',
    title: 'Menu: Configurações',
    content: 'Ajuste dados da empresa, logo, preferências e integrações.',
    path: '/planejamento',
  },
  {
    target: 'sidebar-item-Ajuda',
    title: 'Menu: Ajuda',
    content: 'Acesso ao tutorial, FAQ e suporte. Se travar, comece por aqui.',
    path: '/planejamento',
  },
  {
    target: 'sidebar-item-Como-Funciona',
    title: 'Menu: Como Funciona',
    content:
      'Reinicie este tour de onboarding a qualquer momento. Use quando quiser revisar uma funcionalidade.',
    path: '/planejamento',
  },
  {
    target: 'sidebar-footer-access',
    title: 'Perfil e Acesso',
    content:
      'Aqui você vê seu perfil de acesso e pode sair com segurança. O Fluc protege seus dados financeiros.',
    path: '/planejamento',
  },
  {
    target: 'tour-end-modal',
    title: 'Fim do Tour',
    content:
      'Parabéns! Você conheceu o Fluc. Agora cadastre sua primeira transação e comece a transformar sua gestão financeira com o Método PAC.',
    path: '/planejamento',
  },
]

export function TourOverlay() {
  const { isActive, step, endTour, nextStep, prevStep } = useTourStore()
  const { user, profile, updateProfileContext, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const prevStepRef = useRef(step)

  const tourSteps = useMemo(() => {
    return allTourSteps.filter((s) => {
      if (s.target === 'sidebar-item-Usuários' && role !== 'admin') return false
      return true
    })
  }, [role])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isActive) return
    const currentStep = tourSteps[step]
    if (!currentStep) {
      handleEnd()
      return
    }

    if (location.pathname !== currentStep.path) {
      setIsReady(false)
      setTimeout(() => navigate(currentStep.path), 300)
    } else {
      setIsReady(true)
    }
  }, [isActive, step, location.pathname, navigate, tourSteps])

  useEffect(() => {
    if (!isActive || isMobile || !isReady) return
    const currentStep = tourSteps[step]
    if (!currentStep) return

    if (prevStepRef.current !== step) {
      setTargetRect(null)
      prevStepRef.current = step
    }

    const updatePosition = () => {
      if (currentStep.target === 'tour-end-modal') {
        setTargetRect(null)
        return
      }

      const el = document.getElementById(currentStep.target)
      if (el) {
        const rect = el.getBoundingClientRect()
        setTargetRect((prev) => {
          if (
            !prev ||
            Math.abs(prev.top - rect.top) > 5 ||
            Math.abs(prev.left - rect.left) > 5
          ) {
            if (!prev) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            return rect
          }
          return prev
        })
      } else {
        setTargetRect(null)
      }
    }

    updatePosition()
    const interval = setInterval(updatePosition, 100)
    return () => clearInterval(interval)
  }, [isActive, step, isMobile, isReady, tourSteps])

  useEffect(() => {
    if (!localStorage.getItem('fluc_tour_completed')) {
      useTourStore.getState().startTour()
    }
  }, [])

  if (!isActive) return null

  const currentStep = tourSteps[step]
  if (!currentStep) return null

  const handleEnd = async () => {
    endTour()
    if (user && profile && !profile.onboarding_completed) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
      if (updateProfileContext) {
        updateProfileContext({ onboarding_completed: true })
      }
    }
  }

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      nextStep()
    } else {
      handleEnd()
    }
  }

  if (currentStep.target === 'tour-end-modal') {
    return (
      <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 pointer-events-auto transition-opacity duration-300"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md pointer-events-auto z-[102] animate-fade-in-up text-center mx-4">
          <h3 className="font-bold text-2xl text-slate-900 mb-4">
            {currentStep.title}
          </h3>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {currentStep.content}
          </p>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                handleEnd()
                navigate('/payments')
              }}
              className="w-full bg-primary hover:bg-primary/90 text-md h-12"
            >
              Ir para Nova Transação
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
