import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useTourStore } from '@/stores/useTourStore'
import { FileText, Shield, ArrowLeft } from 'lucide-react'

export const CURRENT_TERMS_VERSION = '1.0'

export function ConsentModal() {
  const { profile, user, updateProfileContext } = useAuth()
  const [open, setOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'main' | 'terms' | 'privacy'>('main')

  const startTour = useTourStore((state: any) => state.startTour)

  useEffect(() => {
    if (profile && user) {
      const needsConsent =
        !profile.terms_accepted_at ||
        !profile.privacy_accepted_at ||
        profile.terms_version !== CURRENT_TERMS_VERSION ||
        profile.privacy_version !== CURRENT_TERMS_VERSION

      if (needsConsent) {
        setOpen(true)
      } else {
        setOpen(false)
      }
    }
  }, [profile, user])

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

    updateProfileContext(updates)
    setOpen(false)
    setLoading(false)

    if (!profile.onboarding_completed) {
      startTour?.()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {view === 'main' && (
          <>
            <div className="p-6 border-b text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bem-vindo ao Fluc! Antes de começar, precisamos da sua
                autorização.
              </h2>
              <p className="text-gray-600 text-sm">
                Para usar o Fluc, você precisa ler e aceitar nossos Termos de
                Uso e Política de Privacidade. Seus dados financeiros são
                protegidos e você tem controle total sobre eles.
              </p>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-gray-50 flex flex-col gap-4">
              <button
                onClick={() => setView('terms')}
                className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:border-primary transition-colors text-left"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    📄 Termos de Uso
                  </h3>
                  <p className="text-sm text-gray-500">
                    Regras e condições para utilização da plataforma
                  </p>
                </div>
              </button>

              <button
                onClick={() => setView('privacy')}
                className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:border-primary transition-colors text-left"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    🔒 Política de Privacidade
                  </h3>
                  <p className="text-sm text-gray-500">
                    Como tratamos e protegemos seus dados
                  </p>
                </div>
              </button>

              <div className="mt-4 flex flex-col gap-3">
                <label className="flex items-start gap-3 cursor-pointer p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={(checked) =>
                      setTermsAccepted(checked as boolean)
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm font-medium text-gray-800">
                    ✓ Li e concordo com os Termos de Uso
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                  <Checkbox
                    checked={privacyAccepted}
                    onCheckedChange={(checked) =>
                      setPrivacyAccepted(checked as boolean)
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm font-medium text-gray-800">
                    ✓ Li e concordo com a Política de Privacidade
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t bg-white flex flex-col gap-4">
              <Button
                onClick={handleSubmit}
                disabled={!termsAccepted || !privacyAccepted || loading}
                className="w-full text-base h-12"
              >
                {loading ? 'Processando...' : 'Continuar para o Fluc'}
              </Button>
              <div className="text-center">
                <a
                  href="mailto:suporte@fluc.com.br"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Preciso de ajuda? Fale conosco
                </a>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t text-xs text-center text-gray-500 flex flex-col gap-1">
              <p>Dúvidas? Envie um e-mail para suporte@fluc.com.br</p>
              <p>
                54.947.121 MARCIO DE OLIVEIRA MORAIS, CNPJ 54.947.121/0001-74
              </p>
              <p>
                Rua Angelina Gaeta, 63, Taboão, São Bernardo do Campo, SP, CEP
                09663-050
              </p>
            </div>
          </>
        )}

        {view === 'terms' && (
          <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView('main')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-bold">Termos de Uso</h2>
            </div>
            <ScrollArea className="flex-1 p-6 text-sm text-gray-700 bg-gray-50/50">
              <div className="prose prose-sm max-w-none pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  1. Aceitação dos Termos
                </h3>
                <p className="mb-4">
                  Ao acessar e usar o Fluc, você concorda em cumprir estes
                  termos e condições na íntegra. Caso discorde de alguma parte,
                  pedimos que não utilize a plataforma.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2. Uso da Plataforma
                </h3>
                <p className="mb-4">
                  Você é responsável por manter a confidencialidade de sua conta
                  e senha. O Fluc é uma plataforma de gestão financeira
                  desenhada para ajudar você e sua empresa a organizar finanças.
                  Não somos uma instituição financeira, mas sim uma ferramenta
                  de controle gerencial.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  3. Assinaturas e Pagamentos
                </h3>
                <p className="mb-4">
                  O uso contínuo das ferramentas premium do Fluc exige uma
                  assinatura ativa. O não pagamento pode resultar na suspensão
                  do acesso às funcionalidades avançadas, preservando, no
                  entanto, seus dados por um período de carência.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  4. Propriedade Intelectual
                </h3>
                <p className="mb-4">
                  Todos os direitos de propriedade intelectual relacionados à
                  plataforma Fluc pertencem aos seus desenvolvedores e titulares
                  legais, não sendo permitida cópia ou engenharia reversa de
                  suas funções.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  5. Limitação de Responsabilidade
                </h3>
                <p className="mb-4">
                  O Fluc não se responsabiliza por perdas financeiras
                  decorrentes de decisões tomadas com base nos relatórios
                  gerados. Os dados são fornecidos "como estão", e a precisão
                  depende das entradas do usuário.
                </p>
              </div>
            </ScrollArea>
          </div>
        )}

        {view === 'privacy' && (
          <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView('main')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-bold">Política de Privacidade</h2>
            </div>
            <ScrollArea className="flex-1 p-6 text-sm text-gray-700 bg-gray-50/50">
              <div className="prose prose-sm max-w-none pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  1. Coleta de Dados
                </h3>
                <p className="mb-4">
                  Coletamos informações que você fornece diretamente, como nome,
                  email, dados financeiros lançados na plataforma e informações
                  de perfil da organização, necessárias para a operação do
                  sistema.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2. Uso das Informações
                </h3>
                <p className="mb-4">
                  Utilizamos seus dados exclusivamente para fornecer e melhorar
                  nossos serviços, calcular indicadores financeiros e
                  personalizar sua experiência na plataforma Fluc.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  3. Compartilhamento e Terceiros
                </h3>
                <p className="mb-4">
                  Não vendemos ou compartilhamos seus dados financeiros com
                  terceiros, exceto quando estritamente exigido por lei ou para
                  processar pagamentos através de parceiros seguros e
                  homologados (ex: gateways de pagamento).
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  4. Segurança dos Dados
                </h3>
                <p className="mb-4">
                  Implementamos medidas de segurança rígidas e padrões de
                  criptografia para proteger suas informações contra acesso não
                  autorizado, alterações ou destruição. Seus dados estão
                  hospedados em servidores de alta confiabilidade.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  5. Seus Direitos
                </h3>
                <p className="mb-4">
                  Você tem o direito de solicitar a exclusão de sua conta e de
                  todos os dados associados a qualquer momento. Para isso, basta
                  entrar em contato com o suporte através dos canais oficiais.
                </p>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
