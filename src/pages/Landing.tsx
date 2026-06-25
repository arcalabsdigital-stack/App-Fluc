import { useAuth } from '@/hooks/use-auth'
import { Navigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Activity,
  CalendarDays,
  Landmark,
  ArrowRightLeft,
  TrendingUp,
  Repeat,
  ArrowRight,
  BarChart3,
} from 'lucide-react'

export default function Landing() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Fluc Gestão Financeira
            </span>
          </div>
          <nav>
            <Button asChild variant="default">
              <Link to="/login">Entrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-4 text-center container mx-auto max-w-5xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Fluc Gestão Financeira
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium mb-6 max-w-3xl mx-auto">
            A plataforma completa para gerir as finanças e descobrir o valor do
            seu negócio.
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-4xl mx-auto leading-relaxed">
            O Fluc é um software de gestão financeira e valuation que reúne, em
            um só lugar, o controle das finanças do seu negócio. Planeje,
            registre e analise suas receitas e despesas, acompanhe a saúde
            financeira em tempo real e tome decisões com base em dados — de
            forma simples e automática.
          </p>
          <div className="flex justify-center">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <Link to="/login">
                Acessar o Fluc
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-foreground">
                O QUE O FLUC FAZ
              </h2>
              <p className="text-muted-foreground text-lg">
                Seis pilares essenciais para o controle total da sua empresa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Diagnóstico Financeiro
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cruza o Realizado vs. Planejado e gera um score de saúde
                  financeira do seu negócio.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Planejamento Mensal
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Um assistente guiado projeta receitas e despesas, com
                  replicação inteligente entre os meses.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Landmark className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Gestão Bancária</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Controle centralizado de contas (corrente, poupança e outras)
                  com saldos atualizados em tempo real.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <ArrowRightLeft className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Transações e Conciliação
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Registro de entradas e saídas, filtros avançados e conciliação
                  bancária em um painel robusto.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Valuation e Análise
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Calcula o valor do negócio por Fluxo de Caixa Descontado (FCD)
                  e gera DREs detalhados.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Repeat className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Orçamentos e Recorrências
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Defina tetos de gastos por categoria e gerencie assinaturas e
                  despesas recorrentes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 text-center container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-foreground">
            Comece a organizar as finanças do seu negócio
          </h2>
          <Button
            asChild
            size="lg"
            className="h-14 px-10 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Link to="/login">Entrar</Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10 bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <div className="bg-primary/10 text-primary p-1 rounded">
              <BarChart3 className="h-4 w-4" />
            </div>
            Fluc Gestão Financeira
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              to="/privacidade"
              className="hover:text-foreground transition-colors font-medium"
            >
              Política de Privacidade
            </Link>
            <Link
              to="/termos"
              className="hover:text-foreground transition-colors font-medium"
            >
              Termos de Uso
            </Link>
          </div>
          <div className="text-center md:text-right">
            &copy; {new Date().getFullYear()} Fluc. Todos os direitos
            reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
