import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useTourStore } from '@/stores/useTourStore'
import { FileText, Shield } from 'lucide-react'

export const CURRENT_TERMS_VERSION = '1.0'

export function ConsentModal() {
  const { profile, user, updateProfileContext } = useAuth()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const [termsProgress, setTermsProgress] = useState(0)
  const [privacyProgress, setPrivacyProgress] = useState(0)

  const [loading, setLoading] = useState(false)

  const termsRef = useRef<HTMLDivElement>(null)
  const privacyRef = useRef<HTMLDivElement>(null)

  const startTour = useTourStore((state: any) => state.startTour)

  useEffect(() => {
    const checkScrolls = () => {
      if (termsRef.current) {
        const maxScroll =
          termsRef.current.scrollHeight - termsRef.current.clientHeight
        if (maxScroll <= 5) setTermsProgress(100)
      }
      if (privacyRef.current) {
        const maxScroll =
          privacyRef.current.scrollHeight - privacyRef.current.clientHeight
        if (maxScroll <= 5) setPrivacyProgress(100)
      }
    }
    const timeoutId = setTimeout(checkScrolls, 100)
    window.addEventListener('resize', checkScrolls)
    return () => {
      window.removeEventListener('resize', checkScrolls)
      clearTimeout(timeoutId)
    }
  }, [])

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const maxScroll = target.scrollHeight - target.clientHeight
    if (maxScroll <= 5 || target.scrollTop >= maxScroll - 2) {
      setTermsProgress(100)
    } else {
      setTermsProgress(
        Math.min(
          100,
          Math.max(0, Math.round((target.scrollTop / maxScroll) * 100)),
        ),
      )
    }
  }

  const handlePrivacyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const maxScroll = target.scrollHeight - target.clientHeight
    if (maxScroll <= 5 || target.scrollTop >= maxScroll - 2) {
      setPrivacyProgress(100)
    } else {
      setPrivacyProgress(
        Math.min(
          100,
          Math.max(0, Math.round((target.scrollTop / maxScroll) * 100)),
        ),
      )
    }
  }

  const handleSubmit = async () => {
    if (!user || !profile) return
    setLoading(true)

    const { data: orgId } = await supabase.rpc('get_current_user_org_id')
    const finalOrgId = orgId || profile.organization_id

    if (!finalOrgId) {
      toast.error('Organização não identificada.')
      setLoading(false)
      return
    }

    const now = new Date().toISOString()
    const updates = {
      terms_accepted_at: now,
      terms_version: CURRENT_TERMS_VERSION,
      privacy_accepted_at: now,
      privacy_version: CURRENT_TERMS_VERSION,
      onboarding_completed: true,
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      toast.error('Erro ao salvar suas preferências. Tente novamente.')
      setLoading(false)
      return
    }

    await supabase.from('audit_logs').insert({
      organization_id: finalOrgId,
      user_id: user.id,
      action: 'UPDATE',
      entity_type: 'USER',
      entity_name: profile.full_name || 'Usuário',
      details: {
        action: 'scroll-to-agree',
        event: 'Consentimento de Termos e Privacidade',
        terms_version: CURRENT_TERMS_VERSION,
        privacy_version: CURRENT_TERMS_VERSION,
        timestamp: now,
      },
    })

    if (typeof updateProfileContext === 'function') {
      updateProfileContext(updates)
    }
    setLoading(false)

    if (!profile.onboarding_completed) {
      startTour?.()
    }
  }

  return (
    <div className="min-h-screen w-full bg-white overflow-y-auto">
      <div className="max-w-3xl mx-auto py-12 px-4 flex flex-col gap-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Bem-vindo ao Fluc! Antes de começar, precisamos da sua autorização.
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Para usar o Fluc, você precisa ler e aceitar nossos Termos de Uso e
            Política de Privacidade. Seus dados financeiros são protegidos e
            você tem controle total sobre eles.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() =>
                document
                  .getElementById('terms-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="text-primary hover:underline font-medium text-sm transition-all"
            >
              Ir para Termos de Uso
            </button>
            <span className="text-gray-300 hidden md:inline">•</span>
            <button
              onClick={() =>
                document
                  .getElementById('privacy-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="text-primary hover:underline font-medium text-sm transition-all"
            >
              Ir para Política de Privacidade
            </button>
          </div>
        </div>

        {/* Terms Section */}
        <div
          id="terms-section"
          className="bg-gray-50 border border-gray-200 rounded-2xl p-4 md:p-8 flex flex-col gap-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Termo de Uso do Fluc
            </h2>
          </div>

          <div className="relative border border-gray-200 rounded-xl bg-white overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-bl-xl border-b border-l border-primary/20 z-10 transition-colors">
              {termsProgress}% lido
            </div>
            <div
              ref={termsRef}
              onScroll={handleTermsScroll}
              className="h-[300px] md:h-[40vh] overflow-y-auto p-6 md:p-8 text-sm md:text-base text-gray-700 leading-relaxed scroll-smooth"
            >
              <div className="max-w-none space-y-6 pb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    === TERMO DE USO DO FLUC ===
                  </h3>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    1. Disposições Gerais
                  </h3>
                  <p className="mb-2">
                    Este documento estabelece as condições de uso do Fluc. A
                    plataforma é operada por 54.947.121 MARCIO DE OLIVEIRA
                    MORAIS, pessoa jurídica de direito privado, inscrita no CNPJ
                    54.947.121/0001-74, com sede na Rua Angelina Gaeta, 63,
                    Taboão, São Bernardo do Campo, SP.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    2. Condição de Uso e Cadastro
                  </h3>
                  <p className="mb-2">
                    Para utilizar a plataforma, o usuário deve realizar um
                    cadastro fornecendo informações verdadeiras, atualizadas e
                    completas. O usuário é inteiramente responsável por manter a
                    confidencialidade de sua senha e por todas as atividades
                    realizadas em sua conta.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    3. Serviços Oferecidos
                  </h3>
                  <p className="mb-2">
                    O Fluc oferece funcionalidades de gestão financeira, tais
                    como controle de receitas e despesas, projeção de fluxo de
                    caixa, planejamento financeiro, conciliação bancária, DRE,
                    valuation e gestão de orçamentos.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    4. Modelo de Assinatura e Pagamento
                  </h3>
                  <p className="mb-2">
                    O acesso a certas funcionalidades é concedido mediante
                    modelo de assinatura e cobrança recorrente, processado por
                    gateways de pagamento parceiros, como Stripe e Mercado Pago.
                    O usuário pode alterar seu plano a qualquer momento de
                    acordo com as regras estabelecidas na plataforma, estando
                    ciente de que as renovações ocorrem automaticamente.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    5. Cancelamento e Rescisão
                  </h3>
                  <p className="mb-2">
                    O usuário pode solicitar o cancelamento da sua assinatura a
                    qualquer momento. A conta pode ser suspensa ou cancelada
                    pelo Fluc em casos de inadimplência, violação destes termos
                    ou atividades fraudulentas.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    6. Direitos Autorais e Propriedade Intelectual
                  </h3>
                  <p className="mb-2">
                    Todos os direitos de propriedade intelectual relativos à
                    plataforma, incluindo códigos, design, marcas e
                    documentações, pertencem exclusivamente ao Fluc. É concedida
                    ao usuário apenas uma licença de uso limitada, não exclusiva
                    e intransferível.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    7. Limitação de Responsabilidade
                  </h3>
                  <p className="mb-2">
                    O Fluc não se responsabiliza por falhas de conexão à
                    internet, problemas em serviços de terceiros (como os
                    gateways de pagamento) ou por quaisquer decisões financeiras
                    ou de negócios tomadas pelos usuários com base nas
                    informações fornecidas pela plataforma.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    8. Disposições Finais
                  </h3>
                  <p>
                    Estes Termos de Uso são regidos e interpretados de acordo
                    com as leis do Brasil (legislação brasileira). Fica eleito o
                    foro da comarca de São Bernardo do Campo, Estado de São
                    Paulo, para a resolução de quaisquer conflitos decorrentes
                    deste documento.
                  </p>
                </div>
                {/* Spacer to ensure scrollability */}
                <div className="h-12 w-full"></div>
              </div>
            </div>
          </div>

          <label
            className={`flex items-start gap-4 p-5 border rounded-xl transition-all duration-300 ${termsProgress === 100 ? 'bg-white border-primary/30 cursor-pointer hover:bg-primary/5 hover:border-primary/50 shadow-sm' : 'bg-gray-100/50 border-gray-200 opacity-70 cursor-not-allowed'}`}
          >
            <Checkbox
              checked={termsAccepted}
              onCheckedChange={(c) =>
                termsProgress === 100 && setTermsAccepted(!!c)
              }
              disabled={termsProgress < 100}
              className="mt-1 h-5 w-5"
            />
            <span
              className={`text-base font-medium ${termsProgress === 100 ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Li e aceito os Termos de Uso
            </span>
          </label>
        </div>

        {/* Privacy Section */}
        <div
          id="privacy-section"
          className="bg-gray-50 border border-gray-200 rounded-2xl p-4 md:p-8 flex flex-col gap-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Política de Privacidade do Fluc
            </h2>
          </div>

          <div className="relative border border-gray-200 rounded-xl bg-white overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-bl-xl border-b border-l border-primary/20 z-10 transition-colors">
              {privacyProgress}% lido
            </div>
            <div
              ref={privacyRef}
              onScroll={handlePrivacyScroll}
              className="h-[300px] md:h-[40vh] overflow-y-auto p-6 md:p-8 text-sm md:text-base text-gray-700 leading-relaxed scroll-smooth"
            >
              <div className="max-w-none space-y-6 pb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    === POLÍTICA DE PRIVACIDADE DO FLUC ===
                  </h3>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    1. Identificação do Controlador
                  </h3>
                  <p className="mb-2">
                    O Controlador de dados é 54.947.121 MARCIO DE OLIVEIRA
                    MORAIS. O contato do Encarregado de Proteção de Dados (DPO)
                    pode ser feito através do e-mail suporte@fluc.com.br.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    2. Dados Coletados e Bases Legais
                  </h3>
                  <p className="mb-2">
                    Coletamos dados de cadastro, informações financeiras, dados
                    de pagamento, dados de navegação e comunicações. O
                    tratamento desses dados possui bases legais na LGPD, como
                    cumprimento de contrato, obrigação legal, exercício regular
                    de direitos e legítimo interesse.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    3. Finalidades do Tratamento
                  </h3>
                  <p className="mb-2">
                    Os dados são utilizados para a prestação do serviço
                    contratado, melhoria da plataforma, segurança, processamento
                    de faturamento e pagamentos, suporte ao usuário e
                    cumprimento de obrigações legais.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    4. Compartilhamento de Dados
                  </h3>
                  <p className="mb-2">
                    Os dados poderão ser compartilhados apenas quando
                    necessário, sob rígidas condições de segurança e
                    confidencialidade, com parceiros estratégicos de tecnologia
                    e operação, incluindo Stripe, Mercado Pago, AWS, Skip Cloud
                    e Supabase.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    5. Segurança dos Dados
                  </h3>
                  <p className="mb-2">
                    Adotamos medidas rígidas de segurança da informação, como
                    criptografia (TLS/SSL para trânsito e AES-256 para repouso),
                    para proteger seus dados contra acessos não autorizados.
                    Possuímos política de notificação de incidentes de
                    segurança.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    6. Retenção e Exclusão
                  </h3>
                  <p className="mb-2">
                    Seus dados pessoais são armazenados pelo tempo necessário
                    para atingir as finalidades do serviço ou obrigações legais.
                    O usuário pode, a qualquer momento, solicitar a exclusão de
                    seus dados, que será atendida salvo obrigações de retenção
                    legal.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    7. Direitos do Titular
                  </h3>
                  <p className="mb-2">
                    De acordo com o Art. 18 da LGPD, você possui direitos como
                    confirmação da existência de tratamento, acesso, correção,
                    anonimização, portabilidade, eliminação e revogação de
                    consentimento, que podem ser exercidos via solicitação por
                    e-mail.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    8. Cookies
                  </h3>
                  <p className="mb-2">
                    Utilizamos cookies essenciais para o funcionamento da
                    plataforma, bem como cookies de performance e funcionais
                    para proporcionar uma melhor experiência de navegação e uso
                    das ferramentas.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    9. Alterações
                  </h3>
                  <p className="mb-2">
                    Esta Política de Privacidade poderá ser alterada a qualquer
                    momento. Modificações significativas serão notificadas aos
                    usuários com antecedência mínima de 15 dias, garantindo a
                    transparência no tratamento dos seus dados.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    10. Contato
                  </h3>
                  <p>
                    Para dúvidas ou solicitações sobre seus dados, entre em
                    contato via e-mail (suporte@fluc.com.br). Em caso de
                    disputas não resolvidas, o titular também tem o direito de
                    acionar a Autoridade Nacional de Proteção de Dados (ANPD).
                  </p>
                </div>
                {/* Spacer to ensure scrollability */}
                <div className="h-12 w-full"></div>
              </div>
            </div>
          </div>

          <label
            className={`flex items-start gap-4 p-5 border rounded-xl transition-all duration-300 ${privacyProgress === 100 ? 'bg-white border-primary/30 cursor-pointer hover:bg-primary/5 hover:border-primary/50 shadow-sm' : 'bg-gray-100/50 border-gray-200 opacity-70 cursor-not-allowed'}`}
          >
            <Checkbox
              checked={privacyAccepted}
              onCheckedChange={(c) =>
                privacyProgress === 100 && setPrivacyAccepted(!!c)
              }
              disabled={privacyProgress < 100}
              className="mt-1 h-5 w-5"
            />
            <span
              className={`text-base font-medium ${privacyProgress === 100 ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Li e aceito a Política de Privacidade
            </span>
          </label>
        </div>

        {/* Submit and Footer */}
        <div className="flex flex-col items-center gap-8 mt-6">
          <Button
            size="lg"
            className="w-full max-w-md text-lg h-16 rounded-xl font-bold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:shadow-none disabled:transform-none"
            disabled={!termsAccepted || !privacyAccepted || loading}
            onClick={handleSubmit}
          >
            {loading ? 'Processando...' : 'Continuar para o Fluc'}
          </Button>

          <div className="text-center w-full pt-10 border-t border-gray-200 flex flex-col gap-6">
            <a
              href="mailto:suporte@fluc.com.br"
              className="inline-block text-base text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
            >
              Preciso de ajuda? Fale conosco
            </a>
            <div className="text-xs text-gray-500 flex flex-col gap-2 max-w-2xl mx-auto">
              <p className="font-medium">
                Dúvidas? Envie um e-mail para{' '}
                <a
                  href="mailto:suporte@fluc.com.br"
                  className="hover:underline"
                >
                  suporte@fluc.com.br
                </a>
              </p>
              <p>
                54.947.121 MARCIO DE OLIVEIRA MORAIS, CNPJ 54.947.121/0001-74,
                Rua Angelina Gaeta, 63, Taboão, São Bernardo do Campo, SP, CEP
                09663-050
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
