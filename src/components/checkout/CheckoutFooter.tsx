import { Link } from 'react-router-dom'

export function CheckoutFooter() {
  return (
    <footer className="border-t border-slate-200 py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs">
            F
          </div>
          <span className="font-medium text-slate-900">Fluc</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            to="/termos"
            className="hover:text-slate-900 transition-colors font-medium"
          >
            Termos de Uso
          </Link>
          <Link
            to="/privacidade"
            className="hover:text-slate-900 transition-colors font-medium"
          >
            Política de Privacidade
          </Link>
          <a
            href="mailto:suporte@fluc.com.br"
            className="hover:text-slate-900 transition-colors font-medium"
          >
            suporte@fluc.com.br
          </a>
        </div>
        <div className="text-center md:text-right text-slate-500">
          &copy; {new Date().getFullYear()} Fluc. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
