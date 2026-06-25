import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-12 shadow-sm">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Política de Privacidade do Fluc
            </h1>
          </div>

          <div className="space-y-8 text-base text-gray-700 leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. Identificação do Controlador
              </h2>
              <p>
                O Controlador de dados é 54.947.121 MARCIO DE OLIVEIRA MORAIS. O
                contato do Encarregado de Proteção de Dados (DPO) pode ser feito
                através do e-mail suporte@fluc.com.br.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. Dados Coletados e Bases Legais
              </h2>
              <p>
                Coletamos dados de cadastro, informações financeiras, dados de
                pagamento, dados de navegação e comunicações. O tratamento
                desses dados possui bases legais na LGPD, como cumprimento de
                contrato, obrigação legal, exercício regular de direitos e
                legítimo interesse.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. Finalidades do Tratamento
              </h2>
              <p>
                Os dados são utilizados para a prestação do serviço contratado,
                melhoria da plataforma, segurança, processamento de faturamento
                e pagamentos, suporte ao usuário e cumprimento de obrigações
                legais.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Compartilhamento de Dados
              </h2>
              <p>
                Os dados poderão ser compartilhados apenas quando necessário,
                sob rígidas condições de segurança e confidencialidade, com
                parceiros estratégicos de tecnologia e operação, incluindo
                Stripe, Mercado Pago, AWS, Skip Cloud e Supabase.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Segurança dos Dados
              </h2>
              <p>
                Adotamos medidas rígidas de segurança da informação, como
                criptografia (TLS/SSL para trânsito e AES-256 para repouso),
                para proteger seus dados contra acessos não autorizados.
                Possuímos política de notificação de incidentes de segurança.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Retenção e Exclusão
              </h2>
              <p>
                Seus dados pessoais são armazenados pelo tempo necessário para
                atingir as finalidades do serviço ou obrigações legais. O
                usuário pode, a qualquer momento, solicitar a exclusão de seus
                dados, que será atendida salvo obrigações de retenção legal.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. Direitos do Titular
              </h2>
              <p>
                De acordo com o Art. 18 da LGPD, você possui direitos como
                confirmação da existência de tratamento, acesso, correção,
                anonimização, portabilidade, eliminação e revogação de
                consentimento, que podem ser exercidos via solicitação por
                e-mail.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. Cookies
              </h2>
              <p>
                Utilizamos cookies essenciais para o funcionamento da
                plataforma, bem como cookies de performance e funcionais para
                proporcionar uma melhor experiência de navegação e uso das
                ferramentas.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                9. Alterações
              </h2>
              <p>
                Esta Política de Privacidade poderá ser alterada a qualquer
                momento. Modificações significativas serão notificadas aos
                usuários com antecedência mínima de 15 dias, garantindo a
                transparência no tratamento dos seus dados.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                10. Contato
              </h2>
              <p>
                Para dúvidas ou solicitações sobre seus dados, entre em contato
                via e-mail (suporte@fluc.com.br). Em caso de disputas não
                resolvidas, o titular também tem o direito de acionar a
                Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
