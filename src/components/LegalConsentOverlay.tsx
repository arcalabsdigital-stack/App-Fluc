import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const CURRENT_TERMS_VERSION = '1.0'
const CURRENT_PRIVACY_VERSION = '1.0'

export function LegalConsentOverlay() {
  const { user, profile, updateProfileContext } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<'terms' | 'privacy' | null>(null)

  const [scrollProgress, setScrollProgress] = useState(0)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [docCheckboxChecked, setDocCheckboxChecked] = useState(false)

  useEffect(() => {
    if (profile && user) {
      const needsTerms =
        !profile.terms_accepted_at ||
        profile.terms_version !== CURRENT_TERMS_VERSION
      const needsPrivacy =
        !profile.privacy_accepted_at ||
        profile.privacy_version !== CURRENT_PRIVACY_VERSION
      if (needsTerms || needsPrivacy) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }
  }, [profile, user])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollHeight = target.scrollHeight - target.clientHeight

    if (scrollHeight <= 0) {
      setScrollProgress(100)
      setHasScrolledToBottom(true)
      return
    }

    const progress = Math.min(
      100,
      Math.max(0, (target.scrollTop / scrollHeight) * 100),
    )
    setScrollProgress(Math.round(progress))

    // Allow a 10px margin of error for scrolling to bottom
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      setHasScrolledToBottom(true)
      setScrollProgress(100)
    }
  }

  const openDoc = (doc: 'terms' | 'privacy') => {
    setViewingDoc(doc)
    setScrollProgress(0)
    setHasScrolledToBottom(false)
    setDocCheckboxChecked(false)
  }

  const confirmDoc = () => {
    if (viewingDoc === 'terms') setTermsAccepted(true)
    if (viewingDoc === 'privacy') setPrivacyAccepted(true)
    setViewingDoc(null)
  }

  const handleFinalAccept = async () => {
    if (!user || !profile || !termsAccepted || !privacyAccepted) return
    setLoading(true)

    try {
      const now = new Date().toISOString()
      const updates = {
        terms_accepted_at: now,
        terms_version: CURRENT_TERMS_VERSION,
        privacy_accepted_at: now,
        privacy_version: CURRENT_PRIVACY_VERSION,
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      updateProfileContext(updates)
      setIsOpen(false)
    } catch (err) {
      console.error('Failed to accept terms', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-background gap-0 [&>button]:hidden sm:rounded-2xl z-[9999]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {viewingDoc ? (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="p-4 sm:p-6 border-b bg-muted/30">
              <h2 className="text-lg sm:text-xl font-bold">
                {viewingDoc === 'terms'
                  ? 'Termos de Uso'
                  : 'Política de Privacidade'}
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-200 ease-out"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground w-12 text-right">
                  {scrollProgress}%
                </span>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 sm:p-8 text-sm text-foreground/80 space-y-4"
              onScroll={handleScroll}
            >
              {viewingDoc === 'terms' ? <TermsText /> : <PrivacyText />}
            </div>

            <div className="p-4 sm:p-6 border-t bg-muted/30">
              <div className="flex items-center space-x-3 mb-4">
                <Checkbox
                  id="accept-doc"
                  checked={docCheckboxChecked}
                  onCheckedChange={(c) => setDocCheckboxChecked(!!c)}
                  disabled={!hasScrolledToBottom}
                  className="w-5 h-5"
                />
                <label
                  htmlFor="accept-doc"
                  className={cn(
                    'text-sm sm:text-base font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none',
                    !hasScrolledToBottom && 'text-muted-foreground',
                  )}
                >
                  Li e concordo com os{' '}
                  {viewingDoc === 'terms'
                    ? 'Termos de Uso'
                    : 'Política de Privacidade'}
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setViewingDoc(null)}>
                  Voltar
                </Button>
                <Button disabled={!docCheckboxChecked} onClick={confirmDoc}>
                  Confirmar Leitura
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="p-6 sm:p-10 text-center border-b bg-muted/10">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-balance">
                Bem-vindo ao Fluc! Antes de começar, precisamos da sua
                autorização
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Para usar o Fluc, você precisa ler e aceitar ambos os documentos
                para acessar a plataforma.
              </p>
            </div>

            <div className="flex-1 p-6 sm:p-10 bg-background overflow-y-auto flex items-center">
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-8 w-full max-w-3xl mx-auto">
                {/* Termos de Uso Card */}
                <div
                  className={cn(
                    'group relative border-2 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md',
                    termsAccepted
                      ? 'border-green-500 bg-green-50/30 dark:bg-green-950/20'
                      : 'border-border bg-card hover:border-primary/50',
                  )}
                  onClick={() => openDoc('terms')}
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div
                      className={cn(
                        'p-4 rounded-full transition-colors duration-300',
                        termsAccepted
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-primary/10 group-hover:bg-primary/20',
                      )}
                    >
                      <FileText
                        className={cn(
                          'w-8 h-8',
                          termsAccepted
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-primary',
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Termos de Uso</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-snug">
                        Regras e condições para utilização da plataforma
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 font-medium bg-background/50 px-4 py-1.5 rounded-full border">
                      {termsAccepted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-500">
                            Status: Aceito
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-amber-600 dark:text-amber-500">
                            Status: Pendente
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Política de Privacidade Card */}
                <div
                  className={cn(
                    'group relative border-2 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md',
                    privacyAccepted
                      ? 'border-green-500 bg-green-50/30 dark:bg-green-950/20'
                      : 'border-border bg-card hover:border-primary/50',
                  )}
                  onClick={() => openDoc('privacy')}
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div
                      className={cn(
                        'p-4 rounded-full transition-colors duration-300',
                        privacyAccepted
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-primary/10 group-hover:bg-primary/20',
                      )}
                    >
                      <Shield
                        className={cn(
                          'w-8 h-8',
                          privacyAccepted
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-primary',
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        Política de Privacidade
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-snug">
                        Como tratamos e protegemos seus dados
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 font-medium bg-background/50 px-4 py-1.5 rounded-full border">
                      {privacyAccepted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-500">
                            Status: Aceito
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-amber-600 dark:text-amber-500">
                            Status: Pendente
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 border-t bg-muted/5 flex flex-col items-center gap-6">
              <Button
                size="lg"
                className="w-full max-w-md text-base h-14 rounded-xl shadow-lg transition-all"
                disabled={!termsAccepted || !privacyAccepted || loading}
                onClick={handleFinalAccept}
              >
                {loading ? 'Salvando...' : 'Continuar para o Fluc'}
              </Button>

              <div className="text-center text-xs text-muted-foreground max-w-2xl space-y-1.5 leading-relaxed">
                <p>
                  54.947.121 MARCIO DE OLIVEIRA MORAIS, CNPJ 54.947.121/0001-74
                </p>
                <p>
                  Rua Angelina Gaeta, 63, Taboão, São Bernardo do Campo, SP, CEP
                  09663-050
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-border/50">
                  <p>
                    Dúvidas? Envie um e-mail para{' '}
                    <a
                      href="mailto:suporte@fluc.com.br"
                      className="text-primary hover:underline font-medium"
                    >
                      suporte@fluc.com.br
                    </a>
                  </p>
                  <span className="text-border hidden sm:inline">•</span>
                  <a
                    href="mailto:suporte@fluc.com.br"
                    className="text-primary hover:underline font-medium flex items-center gap-1.5"
                  >
                    Preciso de ajuda? Fale conosco{' '}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TermsText() {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <h3 className="text-xl font-bold mb-6 text-foreground">
        TERMOS E CONDIÇÕES GERAIS DE USO
      </h3>

      <div className="space-y-6">
        <section>
          <h4 className="font-bold text-base mb-2">1. OBJETO</h4>
          <p className="leading-relaxed">
            Este documento estabelece as condições para a utilização do Fluc
            ("Plataforma"), um software de gestão financeira disponibilizado na
            modalidade SaaS (Software as a Service). Ao utilizar a Plataforma, o
            usuário ("Você") concorda com estes termos na sua totalidade. Caso
            não concorde com qualquer disposição aqui presente, o uso da
            plataforma deverá ser interrompido imediatamente.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">2. SERVIÇOS OFERECIDOS</h4>
          <p className="leading-relaxed mb-2">
            2.1 O Fluc fornece ferramentas avançadas para organização e
            planejamento financeiro, incluindo mas não se limitando a
            categorização de despesas, conciliação bancária, controle de
            orçamento, projeção de fluxo de caixa, gestão de contas a
            pagar/receber e emissão de relatórios gerenciais.
          </p>
          <p className="leading-relaxed mb-2">
            2.2 A Plataforma não atua como instituição financeira, corretora de
            valores, gestora de patrimônio ou consultoria de investimentos. As
            análises, gráficos e projeções gerados pela ferramenta têm caráter
            meramente informativo e de apoio à tomada de decisão.
          </p>
          <p className="leading-relaxed">
            2.3 O Fluc não garante resultados financeiros positivos, isenção de
            falhas ou precisão absoluta nas projeções, uma vez que estas
            dependem inteiramente da qualidade, tempestividade e veracidade dos
            dados inseridos pelo próprio usuário.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            3. CADASTRO E RESPONSABILIDADES DO USUÁRIO
          </h4>
          <p className="leading-relaxed mb-2">
            3.1 O usuário compromete-se a fornecer informações verídicas,
            completas e atualizadas durante o processo de cadastro.
          </p>
          <p className="leading-relaxed mb-2">
            3.2 É de responsabilidade exclusiva do usuário manter o sigilo
            absoluto de suas senhas e credenciais de acesso, não devendo
            compartilhá-las com terceiros. O Fluc não se responsabiliza por
            acessos indevidos resultantes do mau uso ou exposição da senha pelo
            usuário.
          </p>
          <p className="leading-relaxed mb-2">
            3.3 O usuário deverá notificar imediatamente o Fluc sobre qualquer
            suspeita de uso não autorizado de sua conta.
          </p>
          <p className="leading-relaxed">
            3.4 É expressamente proibido o uso da Plataforma para fins ilícitos,
            engenharia reversa, tentativa de violação de segurança (hacking), ou
            inserção de dados nocivos (vírus, malwares, spywares).
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            4. ASSINATURAS, PLANOS E COBRANÇAS
          </h4>
          <p className="leading-relaxed mb-2">
            4.1 O uso de funcionalidades premium ou planos específicos requer o
            pagamento da assinatura correspondente, cujo valor, periodicidade
            (mensal ou anual) e método de pagamento serão claramente informados
            no momento da contratação e checkout.
          </p>
          <p className="leading-relaxed mb-2">
            4.2 O Fluc reserva-se o direito de reajustar os valores das
            assinaturas, mediante comunicação prévia de no mínimo 30 (trinta)
            dias. Caso o usuário não concorde com o novo valor, poderá cancelar
            a assinatura antes da renovação.
          </p>
          <p className="leading-relaxed">
            4.3 Em caso de inadimplência, os serviços associados ao plano
            contratado poderão ser temporariamente suspensos, restringindo o
            acesso apenas ao modo de leitura ou plano gratuito (se aplicável),
            até a devida regularização financeira.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            5. DISPONIBILIDADE E NÍVEL DE SERVIÇO (SLA)
          </h4>
          <p className="leading-relaxed mb-2">
            5.1 A Plataforma estará disponível preferencialmente 24 horas por
            dia, 7 dias por semana. No entanto, o Fluc não garante
            disponibilidade ininterrupta.
          </p>
          <p className="leading-relaxed mb-2">
            5.2 Serão realizadas manutenções preventivas e atualizações de
            sistema periodicamente. O Fluc se compromete a realizar tais paradas
            programadas preferencialmente em horários de menor tráfego
            (madrugadas e finais de semana) e, sempre que possível, notificará
            os usuários com antecedência.
          </p>
          <p className="leading-relaxed">
            5.3 O Fluc não se responsabiliza por indisponibilidades causadas por
            casos fortuitos ou força maior, falhas em provedores de internet,
            operadoras de nuvem, ou fatores fora do controle razoável da
            empresa.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            6. PROPRIEDADE INTELECTUAL
          </h4>
          <p className="leading-relaxed mb-2">
            6.1 Todos os direitos autorais, marcas, patentes, códigos-fonte,
            algoritmos, designs, interfaces, textos e demais elementos
            associados à Plataforma pertencem exclusiva e integralmente ao Fluc
            ou aos seus respectivos licenciadores.
          </p>
          <p className="leading-relaxed">
            6.2 A contratação dos serviços não confere ao usuário qualquer
            direito de propriedade sobre o software, tratando-se apenas de uma
            licença de uso temporária, revogável, não exclusiva e
            intransferível.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            7. CANCELAMENTO E RESCISÃO
          </h4>
          <p className="leading-relaxed mb-2">
            7.1 O usuário pode solicitar o cancelamento de sua assinatura a
            qualquer momento através do painel de configurações da plataforma. O
            cancelamento interromperá a renovação automática, permitindo o uso
            até o final do período já pago.
          </p>
          <p className="leading-relaxed mb-2">
            7.2 Não haverá reembolso de valores já pagos por períodos
            parcialmente utilizados, salvo em casos previstos na legislação de
            defesa do consumidor aplicável (como o direito de arrependimento em
            até 7 dias da contratação inicial).
          </p>
          <p className="leading-relaxed">
            7.3 O Fluc poderá suspender ou encerrar imediatamente a conta de
            usuários que violem qualquer cláusula destes Termos de Uso, sem
            necessidade de aviso prévio ou direito a reembolso.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            8. LIMITAÇÃO DE RESPONSABILIDADE
          </h4>
          <p className="leading-relaxed mb-2">
            8.1 O Fluc empenha seus melhores esforços para manter o software
            livre de falhas, mas não garante que as operações serão totalmente
            livres de erros técnicos ou operacionais.
          </p>
          <p className="leading-relaxed">
            8.2 Em nenhuma hipótese o Fluc, seus diretores, funcionários ou
            parceiros serão responsabilizados por lucros cessantes, perdas
            financeiras, danos indiretos, incidentais ou consequenciais
            decorrentes do uso ou da impossibilidade de uso da Plataforma.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            9. FORO E LEGISLAÇÃO APLICÁVEL
          </h4>
          <p className="leading-relaxed">
            9.1 Estes Termos de Uso são regidos pelas leis da República
            Federativa do Brasil. Fica eleito o foro da Comarca de São Bernardo
            do Campo - SP, com renúncia expressa a qualquer outro, por mais
            privilegiado que seja, para dirimir quaisquer dúvidas, questões ou
            litígios oriundos deste instrumento.
          </p>
        </section>
      </div>

      {/* Spacer paragraphs to simulate a long document and enforce deep scrolling */}
      <div className="mt-12 space-y-6 opacity-80">
        <p className="text-sm">
          Para garantir que os usuários compreendam integralmente a extensão dos
          nossos serviços, reforçamos que a inserção sistemática de dados é
          fundamental para a precisão dos relatórios. O algoritmo de conciliação
          bancária atua com base nos extratos fornecidos, seja por meio de
          importação manual (arquivos OFX) ou inserção unitária.
        </p>
        <p className="text-sm">
          Ao aceitar estes termos, você autoriza o recebimento de e-mails
          transacionais e avisos importantes do sistema, que são considerados
          essenciais para o funcionamento da plataforma e não caracterizam SPAM.
        </p>
        <p className="text-sm">
          Ocasionalmente, o Fluc poderá lançar novas funcionalidades ou
          atualizações em versão "Beta". A utilização dessas funcionalidades é
          opcional e estará sujeita a instabilidades, sendo fornecida "no estado
          em que se encontra" ("as is").
        </p>
        <p className="text-sm text-transparent select-none" aria-hidden="true">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p className="text-sm text-transparent select-none" aria-hidden="true">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p className="text-sm text-transparent select-none" aria-hidden="true">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </div>

      <p className="mt-12 mb-4 text-center text-muted-foreground italic bg-muted/50 py-3 rounded-lg border">
        Fim do documento. Prossiga com o aceite abaixo.
      </p>
    </div>
  )
}

function PrivacyText() {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <h3 className="text-xl font-bold mb-6 text-foreground">
        POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS
      </h3>

      <div className="space-y-6">
        <section>
          <h4 className="font-bold text-base mb-2">
            1. COMPROMISSO COM A PRIVACIDADE
          </h4>
          <p className="leading-relaxed">
            O Fluc leva a sua privacidade a sério. Esta política detalha de
            forma transparente como coletamos, usamos, armazenamos,
            compartilhamos e protegemos seus dados pessoais e financeiros, em
            estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº
            13.709/2018 - LGPD) e demais normas aplicáveis no Brasil.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">2. DADOS COLETADOS</h4>
          <p className="leading-relaxed mb-2">
            O Fluc coleta os seguintes tipos de informações:
          </p>
          <p className="leading-relaxed mb-2">
            <strong>2.1 Dados Cadastrais e de Identificação:</strong> Nome
            completo, endereço de e-mail, telefone, CPF ou CNPJ, razão social
            (quando aplicável), necessários para a criação da conta,
            autenticação e emissão de notas fiscais.
          </p>
          <p className="leading-relaxed mb-2">
            <strong>2.2 Dados Financeiros e de Uso:</strong> Lançamentos de
            receitas e despesas, valores, saldos, contas bancárias cadastradas,
            metadados de transações e outros dados inseridos diretamente por
            você na plataforma para a finalidade da gestão financeira.
          </p>
          <p className="leading-relaxed mb-2">
            <strong>2.3 Dados de Navegação e Dispositivo:</strong> Endereço IP,
            tipo e versão de navegador, sistema operacional, páginas acessadas,
            horários de acesso e dados de interação com a plataforma, coletados
            automaticamente para fins de auditoria, segurança e melhoria de
            experiência.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            3. FINALIDADE DO TRATAMENTO
          </h4>
          <p className="leading-relaxed mb-2">
            Seus dados são tratados exclusivamente para as seguintes
            finalidades:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2 mb-2">
            <li>
              Prestação do serviço principal de gestão e organização financeira
              (execução de contrato);
            </li>
            <li>
              Processamento de pagamentos de assinaturas e faturamento
              (obrigação legal e execução de contrato);
            </li>
            <li>
              Envio de comunicações transacionais, alertas do sistema e suporte
              técnico;
            </li>
            <li>
              Prevenção a fraudes e garantia da segurança das suas informações;
            </li>
            <li>
              Análise estatística agregada (e anonimizada) para aprimoramento
              dos algoritmos e novas features.
            </li>
          </ul>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            4. COMPARTILHAMENTO DE DADOS
          </h4>
          <p className="leading-relaxed mb-2">
            4.1 <strong>O Fluc NÃO vende, aluga ou comercializa</strong> seus
            dados pessoais ou financeiros a terceiros sob nenhuma hipótese.
          </p>
          <p className="leading-relaxed mb-2">
            4.2 O compartilhamento de dados ocorre de forma estritamente
            restrita e limitada a parceiros e fornecedores essenciais à operação
            da plataforma, tais como:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2 mb-2">
            <li>
              Provedores de infraestrutura de nuvem (Cloud Computing) para
              hospedagem do banco de dados (ex: Supabase, AWS);
            </li>
            <li>
              Gateways de pagamento (ex: Asaas) para processamento seguro de
              transações de assinatura;
            </li>
            <li>Ferramentas de disparo de e-mails transacionais.</li>
          </ul>
          <p className="leading-relaxed">
            4.3 Todos os fornecedores são submetidos a rigorosas avaliações e
            obrigam-se contratualmente a adotar medidas de segurança compatíveis
            com a LGPD e com as políticas do Fluc.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            5. SEGURANÇA E ARMAZENAMENTO
          </h4>
          <p className="leading-relaxed mb-2">
            5.1 A plataforma emprega tecnologias e padrões de mercado voltados à
            segurança da informação, incluindo criptografia de dados em trânsito
            (HTTPS/TLS) e criptografia em repouso nos bancos de dados.
          </p>
          <p className="leading-relaxed mb-2">
            5.2 Implementamos controles rigorosos de acesso lógico, autenticação
            robusta e monitoramento contínuo para mitigar riscos de acessos não
            autorizados, vazamentos ou alterações indevidas.
          </p>
          <p className="leading-relaxed">
            5.3 Os dados são armazenados por tempo indeterminado enquanto a
            conta estiver ativa. Após o cancelamento, os dados poderão ser
            retidos apenas pelo prazo exigido por obrigações legais ou
            regulatórias (ex: registros fiscais).
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            6. SEUS DIREITOS COMO TITULAR (LGPD)
          </h4>
          <p className="leading-relaxed mb-2">
            Em conformidade com o Art. 18 da LGPD, você possui o direito de
            solicitar a qualquer momento, mediante requisição formal:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2 mb-2">
            <li>Confirmação da existência de tratamento de dados;</li>
            <li>
              Acesso aos dados e obtenção de uma cópia em formato legível;
            </li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>
              Anonimização, bloqueio ou eliminação de dados desnecessários ou
              excessivos;
            </li>
            <li>
              Portabilidade dos dados a outro fornecedor de serviço, mediante
              requisição expressa;
            </li>
            <li>
              Revogação do consentimento (quando aplicável), ciente de que isso
              poderá inviabilizar o uso do sistema.
            </li>
          </ul>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            7. USO DE COOKIES E TECNOLOGIAS SIMILARES
          </h4>
          <p className="leading-relaxed mb-2">
            7.1 O Fluc utiliza cookies estritamente necessários para
            autenticação de usuários, manutenção da sessão (login) e segurança
            do ambiente.
          </p>
          <p className="leading-relaxed">
            7.2 Podemos utilizar cookies analíticos primários para compreender o
            comportamento de navegação agregado. O usuário pode, a qualquer
            momento, configurar seu navegador para bloquear esses cookies,
            sabendo que algumas funcionalidades essenciais poderão ser afetadas.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-base mb-2">
            8. CONTATO DO DPO (ENCARREGADO DE DADOS)
          </h4>
          <p className="leading-relaxed">
            8.1 Para exercer seus direitos, relatar incidentes ou tirar dúvidas
            exclusivas sobre o tratamento dos seus dados, entre em contato
            diretamente com o nosso Encarregado de Proteção de Dados (DPO)
            através do e-mail oficial de suporte:{' '}
            <strong>suporte@fluc.com.br</strong>.
          </p>
        </section>
      </div>

      {/* Spacer paragraphs to simulate a long document and enforce deep scrolling */}
      <div className="mt-12 space-y-6 opacity-80">
        <p className="text-sm">
          Reservamo-nos o direito de alterar esta Política de Privacidade a
          qualquer momento para refletir melhorias no sistema ou mudanças na
          legislação aplicável. Toda alteração significativa será comunicada
          ativamente aos usuários através do e-mail cadastrado ou por avisos
          destacados dentro da própria plataforma.
        </p>
        <p className="text-sm text-transparent select-none" aria-hidden="true">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p className="text-sm text-transparent select-none" aria-hidden="true">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p className="text-sm text-transparent select-none" aria-hidden="true">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </div>

      <p className="mt-12 mb-4 text-center text-muted-foreground italic bg-muted/50 py-3 rounded-lg border">
        Fim do documento. Prossiga com o aceite abaixo.
      </p>
    </div>
  )
}
