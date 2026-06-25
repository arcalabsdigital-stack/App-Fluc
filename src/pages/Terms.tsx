import { Link } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'

export default function Terms() {
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
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Termos de Uso do Fluc
            </h1>
          </div>

          <div className="space-y-8 text-base text-gray-700 leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. Disposições Gerais
              </h2>
              <p>
                Este documento estabelece as condições de uso do Fluc. A
                plataforma é operada por 54.947.121 MARCIO DE OLIVEIRA MORAIS,
                pessoa jurídica de direito privado, inscrita no CNPJ
                54.947.121/0001-74, com sede na Rua Angelina Gaeta, 63, Taboão,
                São Bernardo do Campo, SP.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. Condição de Uso e Cadastro
              </h2>
              <p>
                Para utilizar a plataforma, o usuário deve realizar um cadastro
                fornecendo informações verdadeiras, atualizadas e completas. O
                usuário é inteiramente responsável por manter a
                confidencialidade de sua senha e por todas as atividades
                realizadas em sua conta.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. Serviços Oferecidos
              </h2>
              <p>
                O Fluc oferece funcionalidades de gestão financeira, tais como
                controle de receitas e despesas, projeção de fluxo de caixa,
                planejamento financeiro, conciliação bancária, DRE, valuation e
                gestão de orçamentos.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Modelo de Assinatura e Pagamento
              </h2>
              <p>
                O acesso a certas funcionalidades é concedido mediante modelo de
                assinatura e cobrança recorrente, processado por gateways de
                pagamento parceiros, como Stripe e Mercado Pago. O usuário pode
                alterar seu plano a qualquer momento de acordo com as regras
                estabelecidas na plataforma, estando ciente de que as renovações
                ocorrem automaticamente.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Cancelamento e Rescisão
              </h2>
              <p>
                O usuário pode solicitar o cancelamento da sua assinatura a
                qualquer momento. A conta pode ser suspensa ou cancelada pelo
                Fluc em casos de inadimplência, violação destes termos ou
                atividades fraudulentas.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Direitos Autorais e Propriedade Intelectual
              </h2>
              <p>
                Todos os direitos de propriedade intelectual relativos à
                plataforma, incluindo códigos, design, marcas e documentações,
                pertencem exclusivamente ao Fluc. É concedida ao usuário apenas
                uma licença de uso limitada, não exclusiva e intransferível.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. Limitação de Responsabilidade
              </h2>
              <p>
                O Fluc não se responsabiliza por falhas de conexão à internet,
                problemas em serviços de terceiros (como os gateways de
                pagamento) ou por quaisquer decisões financeiras ou de negócios
                tomadas pelos usuários com base nas informações fornecidas pela
                plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. Disposições Finais
              </h2>
              <p>
                Estes Termos de Uso são regidos e interpretados de acordo com as
                leis do Brasil (legislação brasileira). Fica eleito o foro da
                comarca de São Bernardo do Campo, Estado de São Paulo, para a
                resolução de quaisquer conflitos decorrentes deste documento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
