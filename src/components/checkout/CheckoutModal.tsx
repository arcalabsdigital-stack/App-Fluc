import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, X, XCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useCoupon } from '@/hooks/use-coupon'

interface PlanData {
  id: string
  name: string
  priceMensal: number
  priceAnual: number
  features: string[]
}

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: PlanData | null
  billingPeriod: 'mensal' | 'anual'
  orgId: string | null
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value,
  )

export function CheckoutModal({
  open,
  onOpenChange,
  plan,
  billingPeriod,
  orgId,
}: CheckoutModalProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const {
    coupon,
    setCoupon,
    debouncedCoupon,
    isValidating,
    result: couponResult,
    clear: clearCoupon,
    retry: retryCoupon,
  } = useCoupon(plan?.name ?? null, billingPeriod)

  const price =
    billingPeriod === 'anual'
      ? (plan?.priceAnual ?? 0)
      : (plan?.priceMensal ?? 0)

  const handleCheckout = async () => {
    if (!plan || !orgId) return
    setIsProcessing(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout',
        {
          body: {
            plan: plan.name,
            organization_id: orgId,
            period: billingPeriod,
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

  const handleOpenChange = (open: boolean) => {
    if (!open) clearCoupon()
    onOpenChange(open)
  }

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        <div className="p-6 bg-slate-50 space-y-6">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900">
                Plano {plan.name}
              </span>
              <span className="font-bold">{formatCurrency(price)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-500">
              <span>Período de faturamento</span>
              <span className="capitalize font-medium">
                {billingPeriod === 'anual' ? 'Anual' : 'Mensal'}
              </span>
            </div>
          </div>
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
                  onClick={clearCoupon}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="h-6">
              {isValidating && (
                <div className="flex items-center text-sm text-slate-500 animate-fade-in">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validando
                  cupom...
                </div>
              )}
              {!isValidating && couponResult && (
                <div className="animate-fade-in-down">
                  {couponResult.valido ? (
                    <div className="flex items-center text-sm text-green-600 font-medium">
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Cupom
                      aplicado! Desconto de{' '}
                      {formatCurrency(couponResult.desconto_valor || 0)}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-red-500 font-medium">
                      <XCircle className="h-4 w-4 mr-1.5" />
                      <span>{couponResult.erro}</span>
                      <button
                        onClick={retryCoupon}
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
          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <span className="text-lg font-semibold text-slate-900">
              Total a pagar
            </span>
            <div className="text-right">
              {couponResult?.valido && couponResult.novo_total !== undefined ? (
                <div className="flex flex-col items-end">
                  <span className="text-sm text-slate-400 line-through">
                    {formatCurrency(price)}
                  </span>
                  <span className="text-2xl font-bold text-green-600 animate-fade-in">
                    {formatCurrency(couponResult.novo_total)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-slate-900">
                  {formatCurrency(price)}
                </span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 bg-slate-50 flex flex-col sm:flex-row gap-3 sm:space-x-3">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto h-11 bg-white"
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCheckout}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white h-11 transition-all"
            disabled={
              isProcessing ||
              isValidating ||
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
  )
}
