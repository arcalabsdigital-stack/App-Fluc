import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function BillingSettings() {
  const { currentWorkspace, subscription, session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadHistory()
    }
  }, [currentWorkspace])

  const loadHistory = async () => {
    const { data } = await supabase
      .from('billing_history')
      .select('*')
      .eq('organization_id', currentWorkspace!.id)
      .order('created_at', { ascending: false })

    if (data) setHistory(data)
  }

  const handleCheckout = () => {
    navigate('/checkout')
  }

  const isExpired =
    subscription?.status === 'canceled' ||
    subscription?.status === 'past_due' ||
    (subscription?.status === 'trial' &&
      new Date(subscription.trial_end) < new Date())

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-sm border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-white pb-4 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="w-5 h-5 text-primary" />
            Detalhes da Assinatura
          </CardTitle>
          <CardDescription>
            Gerencie seu plano e histórico de pagamentos do workspace{' '}
            <strong>{currentWorkspace?.name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-gray-100 rounded-xl bg-gray-50/50 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Plano Atual
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">
                  {subscription?.plan || 'Fluxo'}
                </span>
                <Badge
                  variant={isExpired ? 'destructive' : 'default'}
                  className={
                    !isExpired
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : ''
                  }
                >
                  {subscription?.status === 'trial'
                    ? 'Período de Teste'
                    : subscription?.status === 'active'
                      ? 'Ativo'
                      : 'Vencido'}
                </Badge>
              </div>
              {subscription?.status === 'trial' && (
                <p className="text-sm text-gray-500 mt-2">
                  Seu período de teste termina em{' '}
                  <span className="font-medium text-gray-700">
                    {new Date(subscription.trial_end).toLocaleDateString(
                      'pt-BR',
                    )}
                  </span>
                </p>
              )}
              {subscription?.status === 'active' &&
                subscription.current_period_end && (
                  <p className="text-sm text-gray-500 mt-2">
                    Próxima renovação:{' '}
                    <span className="font-medium text-gray-700">
                      {new Date(
                        subscription.current_period_end,
                      ).toLocaleDateString('pt-BR')}
                    </span>
                  </p>
                )}
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              <Button
                onClick={handleCheckout}
                className="w-full shadow-sm"
                variant={isExpired ? 'default' : 'outline'}
              >
                {isExpired ? 'Pagar Agora' : 'Fazer Upgrade / Renovar'}
              </Button>
            </div>
          </div>

          {isExpired && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900">
                  Sua assinatura está inativa
                </h4>
                <p className="text-sm mt-1 text-red-700">
                  O acesso às funcionalidades do sistema está restrito. Por
                  favor, regularize sua situação para continuar usando o Fluc.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              Histórico de Pagamentos
            </h3>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          item.status === 'paid' ? 'default' : 'secondary'
                        }
                        className={
                          item.status === 'paid'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : ''
                        }
                      >
                        {item.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                      {item.invoice_url && (
                        <a
                          href={item.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:text-primary/80"
                          title="Ver Fatura"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-10 border rounded-xl border-dashed border-gray-200 bg-gray-50/30">
                <p className="text-gray-500 text-sm">
                  Nenhum pagamento registrado neste workspace ainda.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
