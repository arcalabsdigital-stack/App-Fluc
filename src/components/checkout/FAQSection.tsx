import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Posso cancelar a qualquer momento?',
    answer:
      'Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas de cancelamento. O acesso permanece ativo até o final do período já pago.',
  },
  {
    question: 'Como funciona o período de teste?',
    answer:
      'Oferecemos um período de teste gratuito para você conhecer todas as funcionalidades do Fluc. Durante esse período, você tem acesso a todos os recursos do plano escolhido sem custo algum.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer:
      'Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança da indústria. Seus dados financeiros são armazenados com os mesmos padrões de segurança usados por bancos.',
  },
]

export function FAQSection() {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-white text-center mb-6">
        Perguntas Frequentes
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="border-white/10"
          >
            <AccordionTrigger className="text-white hover:no-underline hover:text-white/80 text-left font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-white/70 leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
