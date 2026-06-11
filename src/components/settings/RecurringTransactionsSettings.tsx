import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Trash2, RepeatIcon } from 'lucide-react'
import useTransactionStore from '@/stores/useTransactionStore'
import { format } from 'date-fns'

export function RecurringTransactionsSettings() {
  const { user } = useAuth()
  const { categories } = useTransactionStore()
  const [recurring, setRecurring] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    frequency: 'monthly',
    next_date: format(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    if (user) fetchRecurring()
  }, [user])

  const fetchRecurring = async () => {
    const { data } = await supabase
      .from('recurring_transactions')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setRecurring(data)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsLoading(true)
    try {
      const { error } = await supabase.from('recurring_transactions').insert({
        user_id: user.id,
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        type: 'Despesa',
        payment_method: 'Boleto',
        frequency: formData.frequency,
        start_date: formData.next_date,
        next_date: formData.next_date,
      })
      if (error) throw error
      toast.success('Despesa recorrente adicionada!')
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

  const expenseCategories = (categories || []).filter(
    (c) => c.tipo === 'Despesa' || c.tipo === 'expense',
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <RepeatIcon className="h-5 w-5 text-primary" /> Gastos Fixos &
            Assinaturas
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie despesas que se repetem automaticamente.
          </p>
        </div>
        <Button
          className="gap-2 rounded-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Plus className="w-4 h-4" /> Novo Gasto
        </Button>
      </div>

      {isOpen && (
        <form
          onSubmit={handleSave}
          className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6 space-y-4 animate-fade-in-down"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="bg-white"
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
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Categoria
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
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
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Frequência
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
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
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Gasto Fixo'}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Próxima Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recurring.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Nenhum gasto recorrente configurado.
                </TableCell>
              </TableRow>
            ) : (
              recurring.map((r) => {
                const categoryName =
                  (categories || []).find((c) => c.id === r.category)?.nome ||
                  'Desconhecida'
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-gray-900">
                      {r.description}
                    </TableCell>
                    <TableCell>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {categoryName}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500 capitalize">
                      {r.frequency === 'monthly'
                        ? 'Mensal'
                        : r.frequency === 'weekly'
                          ? 'Semanal'
                          : 'Anual'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {r.next_date
                        ? format(new Date(r.next_date), 'dd/MM/yyyy')
                        : 'Data não definida'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      R${' '}
                      {Number(r.amount || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(r.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
