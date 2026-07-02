import { ShieldCheck } from 'lucide-react'

export function GuaranteeSection() {
  return (
    <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto py-8">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
        <ShieldCheck className="h-8 w-8 text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-white">
        7 dias de garantia incondicional
      </h3>
      <p className="text-white/70 leading-relaxed max-w-lg">
        Satisfação garantida ou seu dinheiro de volta em 7 dias. Sem perguntas,
        sem burocracia. Experimente o Fluc sem riscos.
      </p>
    </div>
  )
}
