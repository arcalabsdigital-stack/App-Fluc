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
  const [open, setOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const [termsProgress, setTermsProgress] = useState(0)
  const [privacyProgress, setPrivacyProgress] = useState(0)

  const [loading, setLoading] = useState(false)

  const termsRef = useRef<HTMLDivElement>(null)
  const privacyRef = useRef<HTMLDivElement>(null)

  const startTour = useTourStore((state: any) => state.startTour)

  useEffect(() => {
    if (profile && user) {
      const needsConsent =
        !profile.terms_accepted_at ||
        !profile.privacy_accepted_at ||
        profile.terms_version !== CURRENT_TERMS_VERSION ||
        profile.privacy_version !== CURRENT_TERMS_VERSION

      setOpen(needsConsent)
    }
  }, [profile, user])

  useEffect(() => {
    if (open) {
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
      setTimeout(checkScrolls, 100)
      window.addEventListener('resize', checkScrolls)
      return () => window.removeEventListener('resize', checkScrolls)
    }
  }, [open])

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

    const now = new Date().toISOString()
    const updates = {
      terms_accepted_at: now,
      terms_version: CURRENT_TERMS_VERSION,
      privacy_accepted_at: now,
      privacy_version: CURRENT_TERMS_VERSION,
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

    if (typeof updateProfileContext === 'function') {
      updateProfileContext(updates)
    }
    setOpen(false)
    setLoading(false)

    if (!profile.onboarding_completed) {
      startTour?.()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto">
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
            <h2 className="text-2xl font-bold text-gray-900">Termos de Uso</h2>
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
                    1. Aceitação dos Termos
                  </h3>
                  <p>
                    Ao acessar e usar o Fluc, você concorda em cumprir estes
                    termos e condições na íntegra. Caso discorde de alguma
                    parte, pedimos que não utilize a plataforma. Nossa
                    ferramenta evolui constantemente, podendo os termos sofrer
                    atualizações.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    2. Uso da Plataforma
                  </h3>
                  <p>
                    Você é responsável por manter a confidencialidade de sua
                    conta e senha. O Fluc é uma plataforma de gestão financeira
                    desenhada para ajudar você e sua empresa a organizar
                    finanças. Não somos uma instituição financeira, mas sim uma
                    ferramenta de controle gerencial.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    3. Assinaturas e Pagamentos
                  </h3>
                  <p>
                    O uso contínuo das ferramentas premium do Fluc exige uma
                    assinatura ativa. O não pagamento pode resultar na suspensão
                    do acesso às funcionalidades avançadas, preservando, no
                    entanto, seus dados por um período de carência especificado
                    em contrato.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    4. Propriedade Intelectual
                  </h3>
                  <p>
                    Todos os direitos de propriedade intelectual relacionados à
                    plataforma Fluc pertencem aos seus desenvolvedores e
                    titulares legais, não sendo permitida cópia ou engenharia
                    reversa de suas funções. O conteúdo gerado por você é de sua
                    propriedade.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    5. Limitação de Responsabilidade
                  </h3>
                  <p>
                    O Fluc não se responsabiliza por perdas financeiras
                    decorrentes de decisões tomadas com base nos relatórios
                    gerados. Os dados são fornecidos "como estão", e a precisão
                    depende das entradas do usuário e conciliações feitas.
                  </p>
                </div>
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
              Política de Privacidade
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
                    1. Coleta de Dados
                  </h3>
                  <p>
                    Coletamos informações que você fornece diretamente, como
                    nome, email, dados financeiros lançados na plataforma e
                    informações de perfil da organização, estritamente
                    necessárias para a operação do sistema e prestação de
                    serviço.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    2. Uso das Informações
                  </h3>
                  <p>
                    Utilizamos seus dados exclusivamente para fornecer e
                    melhorar nossos serviços, calcular indicadores financeiros e
                    personalizar sua experiência na plataforma Fluc. Não
                    acessamos seus saldos bancários sem sua autorização
                    explícita.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    3. Compartilhamento e Terceiros
                  </h3>
                  <p>
                    Não vendemos ou compartilhamos seus dados financeiros com
                    terceiros, exceto quando estritamente exigido por lei ou
                    para processar pagamentos através de parceiros seguros e
                    homologados (ex: gateways de pagamento e emissão de notas
                    fiscais).
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    4. Segurança dos Dados
                  </h3>
                  <p>
                    Implementamos medidas de segurança rígidas e padrões de
                    criptografia para proteger suas informações contra acesso
                    não autorizado, alterações ou destruição. Seus dados estão
                    hospedados em servidores de alta disponibilidade e
                    confiabilidade.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    5. Seus Direitos
                  </h3>
                  <p>
                    Você tem o direito de solicitar a exclusão de sua conta e de
                    todos os dados associados a qualquer momento. Além de poder
                    exportar suas informações. Para isso, basta acessar as
                    configurações ou entrar em contato com o suporte através dos
                    canais oficiais.
                  </p>
                </div>
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
