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
  Edit,
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
  const [editId, setEditId] = useState<string | null>(null)
  const [scopeModalOpen, setScopeModalOpen] = useState(false)

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
    if (editId) {
      setScopeModalOpen(true)
      return
    }
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

  const executeEdit = async (scope: string) => {
    if (!user || !currentWorkspace || !editId) return
    setScopeModalOpen(false)
    setIsLoading(true)
    try {
      if (scope === 'só esta') {
        await supabase.from('transactions').insert({
          user_id: user.id,
          organization_id: currentWorkspace.id,
          description: formData.description,
          amount: Number(formData.amount),
          category: formData.category,
          type: 'Despesa',
          payment_method: 'Outros',
          date: formData.next_date,
          recurring_transaction_id: editId,
          status: 'pago',
        })
      } else {
        await supabase
          .from('recurring_transactions')
          .update({
            description: formData.description,
            amount: Number(formData.amount),
            category: formData.category,
            frequency: formData.frequency,
            next_date: formData.next_date,
          })
          .eq('id', editId)

        if (scope === 'toda a série') {
          await supabase
            .from('transactions')
            .update({
              description: formData.description,
              amount: Number(formData.amount),
              category: formData.category,
            })
            .eq('recurring_transaction_id', editId)
        } else {
          await supabase
            .from('transactions')
            .update({
              description: formData.description,
              amount: Number(formData.amount),
              category: formData.category,
            })
            .eq('recurring_transaction_id', editId)
            .gte('date', formData.next_date)
        }
      }

      toast.success('Recorrência atualizada!')
      setIsOpen(false)
      fetchRecurring()
      setEditId(null)
      setFormData({
        description: '',
        amount: '',
        category: '',
        frequency: 'monthly',
        next_date: format(new Date(), 'yyyy-MM-dd'),
      })
    } catch (err) {
      toast.error('Erro ao atualizar recorrência')
    } finally {
      setIsLoading(false)
    }
  }

  const openEdit = (r: any) => {
    setEditId(r.id)
    setFormData({
      description: r.description || '',
      amount: r.amount?.toString() || '0',
      category: r.category || '',
      frequency: r.frequency || 'monthly',
      next_date: r.next_date || format(new Date(), 'yyyy-MM-dd'),
    })
    setIsOpen(true)
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

  const expenseCategories = (categories || []).filter(
    (c) => c.tipo === 'Despesa' || c.tipo === 'expense',
  )

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
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl hidden sm:flex">
            <RepeatIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RepeatIcon className="w-5 h-5 text-primary sm:hidden" />
              <h2 className="text-lg font-bold text-gray-900">
                Gastos Fixos & Assinaturas
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Adicione e acompanhe despesas que se repetem automaticamente.
            </p>
          </div>
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(val) => {
            setIsOpen(val)
            if (!val) setEditId(null)
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="rounded-full gap-2 w-full sm:w-auto"
              onClick={() => {
                setEditId(null)
                setFormData({
                  description: '',
                  amount: '',
                  category: '',
                  frequency: 'monthly',
                  next_date: format(new Date(), 'yyyy-MM-dd'),
                })
              }}
            >
              <Plus className="w-4 h-4" /> Novo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editId
                  ? 'Editar Gasto Recorrente'
                  : 'Adicionar Gasto Recorrente'}
              </DialogTitle>
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
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          {recurring.length === 0 ? (
            <div className="p-10 text-center">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Descrição</th>
                    <th className="px-6 py-4 font-medium">Categoria</th>
                    <th className="px-6 py-4 font-medium">Frequência</th>
                    <th className="px-6 py-4 font-medium">Próxima Data</th>
                    <th className="px-6 py-4 font-medium text-right">Valor</th>
                    <th className="px-6 py-4 font-medium text-center w-[80px]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recurring.map((r) => {
                    const categoryName =
                      (categories || []).find((c) => c.id === r.category)
                        ?.nome || 'Desconhecida'
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {r.description}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {frequencyLabel(r.frequency)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {r.next_date
                            ? format(
                                new Date(r.next_date),
                                "dd 'de' MMM, yyyy",
                                {
                                  locale: ptBR,
                                },
                              )
                            : 'Data não definida'}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-red-600 whitespace-nowrap">
                          - R${' '}
                          {Number(r.amount || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(r)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(r.id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Dialog open={scopeModalOpen} onOpenChange={setScopeModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar transação recorrente</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-700">
            Como deseja aplicar esta alteração na recorrência?
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => executeEdit('só esta')}
            >
              só esta
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => executeEdit('esta e as futuras')}
            >
              esta e as futuras
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => executeEdit('toda a série')}
            >
              toda a série
            </Button>
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setScopeModalOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
