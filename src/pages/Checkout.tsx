import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Check, Loader2, X, XCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const plans = [
  {
    id: 'Fluxo',
    name: 'Fluxo',
    description: 'Para quem está começando',
    priceMensal: 49.9,
    priceAnual: 499.0,
    features: [
      'Até 100 transações/mês',
      'Categorias básicas',
      '1 usuário',
      'Suporte por e-mail',
    ],
    popular: false,
  },
  {
    id: 'Lucro',
    name: 'Lucro',
    description: 'Ideal para pequenas empresas',
    priceMensal: 89.9,
    priceAnual: 899.0,
    features: [
      'Transações ilimitadas',
      'Categorias personalizadas',
      'Até 3 usuários',
      'DRE simplificado',
      'Suporte via WhatsApp',
    ],
    popular: true,
  },
  {
    id: 'Patrimônio',
    name: 'Patrimônio',
    description: 'Para empresas em crescimento',
    priceMensal: 199.9,
    priceAnual: 1999.0,
    features: [
      'Tudo do plano Lucro',
      'Usuários ilimitados',
      'DRE completo',
      'Valuation',
      'Suporte dedicado VIP',
    ],
    popular: false,
  },
]

export default function Checkout() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isAnual, setIsAnual] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[0] | null>(
    null,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [coupon, setCoupon] = useState('')
  const [debouncedCoupon, setDebouncedCoupon] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [couponResult, setCouponResult] = useState<{
    valido: boolean
    desconto_valor?: number
    novo_total?: number
    erro?: string
  } | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setOrgId(data.organization_id)
        })
    }
  }, [user])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCoupon(coupon)
    }, 500)
    return () => clearTimeout(handler)
  }, [coupon])

  useEffect(() => {
    async function validateCoupon() {
      if (!debouncedCoupon.trim()) {
        setCouponResult(null)
        setIsValidatingCoupon(false)
        return
      }

      if (!selectedPlan) return

      setIsValidatingCoupon(true)
      setCouponResult(null)

      try {
        const { data, error } = await supabase.functions.invoke(
          'validar-cupom',
          {
            body: {
              cupom: debouncedCoupon,
              plano: selectedPlan.id,
              periodo: isAnual ? 'anual' : 'mensal',
            },
          },
        )

        if (error) throw error

        if (data.valido) {
          setCouponResult({
            valido: true,
            desconto_valor: data.desconto_valor,
            novo_total: data.novo_total,
          })
        } else {
          setCouponResult({
            valido: false,
            erro: data.erro || 'Cupom inválido',
          })
        }
      } catch (err: any) {
        setCouponResult({
          valido: false,
          erro: 'Erro ao validar cupom. Tente novamente.',
        })
      } finally {
        setIsValidatingCoupon(false)
      }
    }

    validateCoupon()
  }, [debouncedCoupon, selectedPlan, isAnual])

  const handleSelectPlan = (plan: (typeof plans)[0]) => {
    setSelectedPlan(plan)
    setIsModalOpen(true)
    setCoupon('')
    setCouponResult(null)
  }

  const handleProcessCheckout = async () => {
    if (!selectedPlan || !orgId) return

    setIsProcessing(true)

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout',
        {
          body: {
            plan: selectedPlan.id,
            organization_id: orgId,
            period: isAnual ? 'anual' : 'mensal',
            coupon: couponResult?.valido ? debouncedCoupon : undefined,
          },
        },
      )

      if (error) throw error

      if (data?.invoiceUrl) {
        window.location.href = data.invoiceUrl
      } else if (data?.success) {
        toast({
          title: 'Sucesso!',
          description: 'Plano ativado com sucesso! Redirecionando...',
        })
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      } else {
        toast({
          title: 'Sucesso!',
          description: 'Redirecionando para o pagamento...',
        })
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao processar',
        description: err.message || 'Ocorreu um erro ao gerar o checkout.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetryCoupon = () => {
    setDebouncedCoupon('')
    setTimeout(() => setDebouncedCoupon(coupon), 50)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-2">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              F
            </div>
            <span className="text-2xl font-bold tracking-tight">Fluc</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Escolha seu plano
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Selecione a melhor opção para o seu workspace e comece a transformar
            sua gestão financeira.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center items-center space-x-4">
          <Label
            htmlFor="billing-period"
            className={cn(
              'text-base cursor-pointer',
              !isAnual ? 'font-bold text-slate-900' : 'text-slate-500',
            )}
          >
            Mensal
          </Label>
          <Switch
            id="billing-period"
            checked={isAnual}
            onCheckedChange={setIsAnual}
            className="data-[state=checked]:bg-slate-900"
          />
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="billing-period"
              className={cn(
                'text-base cursor-pointer',
                isAnual ? 'font-bold text-slate-900' : 'text-slate-500',
              )}
            >
              Anual
            </Label>
            {isAnual && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-100 border-none transition-all duration-300 animate-fade-in-down"
              >
                Economize 16,67%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const price = isAnual ? plan.priceAnual : plan.priceMensal
            const monthlyEquivalent = isAnual
              ? plan.priceAnual / 12
              : plan.priceMensal

            return (
              <Card
                key={plan.id}
                className={cn(
                  'flex flex-col min-h-[400px] relative transition-all duration-300 hover:shadow-lg',
                  plan.popular
                    ? 'border-2 border-slate-900 shadow-md md:scale-105 z-10'
                    : 'border-slate-200',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-slate-900 text-white hover:bg-slate-800 uppercase tracking-wide text-xs font-bold py-1 px-3">
                      Mais popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-sm h-10">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-baseline text-4xl font-extrabold transition-all">
                      {formatCurrency(price)}
                      <span className="text-xl font-medium text-slate-500 ml-1">
                        /{isAnual ? 'ano' : 'mês'}
                      </span>
                    </div>
                    <div className="h-5">
                      {isAnual && (
                        <p className="text-sm text-slate-500 font-medium animate-fade-in">
                          Equivalente a {formatCurrency(monthlyEquivalent)}/mês
                        </p>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={cn(
                      'w-full h-11 text-base font-semibold transition-colors',
                      plan.popular
                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                        : 'bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50',
                    )}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Assinar agora
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-xl gap-0 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
            <DialogTitle className="text-2xl font-bold">
              Confirme seu pedido
            </DialogTitle>
            <DialogDescription>
              Revise os detalhes do seu plano antes de prosseguir para o
              pagamento.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="p-6 bg-slate-50 space-y-6">
              {/* Resumo do Pedido */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">
                    Plano {selectedPlan.name}
                  </span>
                  <span className="font-bold">
                    {formatCurrency(
                      isAnual
                        ? selectedPlan.priceAnual
                        : selectedPlan.priceMensal,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-500">
                  <span>Período de faturamento</span>
                  <span className="capitalize font-medium">
                    {isAnual ? 'Anual' : 'Mensal'}
                  </span>
                </div>
              </div>

              {/* Cupom */}
              <div className="space-y-3">
                <Label
                  htmlFor="coupon"
                  className="text-sm font-medium text-slate-700"
                >
                  Tem um cupom? Digite aqui
                </Label>
                <div className="relative">
                  <Input
                    id="coupon"
                    placeholder="Ex: FLUC10"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="pr-10 h-11 uppercase bg-white border-slate-300 focus-visible:ring-slate-400"
                    autoComplete="off"
                  />
                  {coupon && (
                    <button
                      onClick={() => {
                        setCoupon('')
                        setCouponResult(null)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Status do Cupom */}
                <div className="h-6">
                  {isValidatingCoupon && (
                    <div className="flex items-center text-sm text-slate-500 animate-fade-in">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando cupom...
                    </div>
                  )}

                  {!isValidatingCoupon && couponResult && (
                    <div className="animate-fade-in-down">
                      {couponResult.valido ? (
                        <div className="flex items-center text-sm text-green-600 font-medium">
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Cupom aplicado! Desconto de{' '}
                          {formatCurrency(couponResult.desconto_valor || 0)}
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-red-500 font-medium">
                          <XCircle className="h-4 w-4 mr-1.5" />
                          <span>{couponResult.erro}</span>
                          <button
                            onClick={handleRetryCoupon}
                            className="ml-2 text-xs underline hover:text-red-700 font-semibold"
                          >
                            Tentar novamente
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-lg font-semibold text-slate-900">
                  Total a pagar
                </span>
                <div className="text-right">
                  {couponResult?.valido &&
                  couponResult.novo_total !== undefined ? (
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(
                          isAnual
                            ? selectedPlan.priceAnual
                            : selectedPlan.priceMensal,
                        )}
                      </span>
                      <span className="text-2xl font-bold text-green-600 animate-fade-in">
                        {formatCurrency(couponResult.novo_total)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-slate-900">
                      {formatCurrency(
                        isAnual
                          ? selectedPlan.priceAnual
                          : selectedPlan.priceMensal,
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-6 pt-0 bg-slate-50 flex flex-col sm:flex-row gap-3 sm:space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto h-11 bg-white"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessCheckout}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white h-11 transition-all"
              disabled={
                isProcessing ||
                !selectedPlan ||
                isValidatingCoupon ||
                (!!coupon.trim() && couponResult?.valido === false)
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Prosseguir para pagamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
