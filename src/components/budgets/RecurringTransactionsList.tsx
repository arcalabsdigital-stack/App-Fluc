import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  RepeatIcon,
  Calendar,
  Tag,
  CreditCard,
  Loader2,
} from 'lucide-react'
import useTransactionStore from '@/stores/useTransactionStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function RecurringTransactionsList() {
  const { user, currentWorkspace } = useAuth()
  const { categories } = useTransactionStore()
  const [recurring, setRecurring] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    frequency: 'monthly',
    next_date: format(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    if (user && currentWorkspace) {
      fetchRecurring()
    }
  }, [user, currentWorkspace])

  const fetchRecurring = async () => {
    if (!currentWorkspace) return
    setIsFetching(true)
    const { data } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('organization_id', currentWorkspace.id)
      .order('created_at', { ascending: false })
    if (data) setRecurring(data)
    setIsFetching(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !currentWorkspace) return
    setIsLoading(true)
    try {
      const { error } = await supabase.from('recurring_transactions').insert({
        user_id: user.id,
        organization_id: currentWorkspace.id,
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        type: 'Despesa',
        payment_method: 'Outros',
        frequency: formData.frequency,
        start_date: formData.next_date,
        next_date: formData.next_date,
      })
      if (error) throw error
      toast.success('Gasto recorrente adicionado!')
      setIsOpen(false)
      fetchRecurring()
      setFormData({
        description: '',
        amount: '',
        category: '',
        frequency: 'monthly',
        next_date: format(new Date(), 'yyyy-MM-dd'),
      })
    } catch (err) {
      toast.error('Erro ao adicionar recorrência')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('recurring_transactions').delete().eq('id', id)
      toast.success('Removido com sucesso')
      fetchRecurring()
    } catch (err) {
      toast.error('Erro ao remover')
    }
  }

  const expenseCategories = categories.filter((c) => c.tipo === 'Despesa')

  const frequencyLabel = (freq: string) => {
    switch (freq) {
      case 'monthly':
        return 'Mensal'
      case 'weekly':
        return 'Semanal'
      case 'yearly':
        return 'Anual'
      default:
        return freq
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-6 rounded-3xl border shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Meus Gastos Fixos</h2>
          <p className="text-sm text-gray-500">
            Adicione e acompanhe despesas que se repetem automaticamente.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Novo Gasto Fixo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Gasto Recorrente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  placeholder="Ex: Aluguel"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Valor (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Categoria
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Próxima Data
                </label>
                <Input
                  type="date"
                  value={formData.next_date}
                  onChange={(e) =>
                    setFormData({ ...formData, next_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Frequência
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  required
                >
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isFetching ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recurring.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <RepeatIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Nenhum gasto fixo
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Adicione suas assinaturas, contas de luz, internet e outros
                gastos recorrentes para acompanhamento automático.
              </p>
            </div>
          ) : (
            recurring.map((r) => {
              const categoryName =
                categories.find((c) => c.id === r.category)?.nome ||
                'Desconhecida'
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full"
                >
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="p-3 bg-primary/5 text-primary rounded-xl shrink-0 hidden sm:flex">
                      <RepeatIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-gray-900 text-base truncate"
                        title={r.description}
                      >
                        {r.description}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium truncate max-w-[120px]">
                            {categoryName}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                          {frequencyLabel(r.frequency)}
                        </span>
                        <span className="hidden sm:inline text-gray-300">
                          •
                        </span>
                        <span className="flex items-center gap-1.5 text-primary/90 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          Próx:{' '}
                          {format(new Date(r.next_date), "dd 'de' MMMM", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                    <div className="text-lg font-bold text-gray-900 whitespace-nowrap">
                      R${' '}
                      {r.amount.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(r.id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-9 w-9 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
