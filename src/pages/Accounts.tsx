import { useEffect, useState } from 'react'
import { accountService } from '@/services/accountService'
import { Conta } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PlusCircle, Wallet, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Conta[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'corrente',
    saldo_inicial: 0,
    data_saldo_inicial: format(new Date(), 'yyyy-MM-dd'),
    is_active: true,
  })

  const fetchAccounts = async () => {
    try {
      const data = await accountService.getAccounts()
      setAccounts(data)
    } catch (error) {
      toast.error('Erro ao buscar contas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleOpenDialog = (account?: Conta) => {
    if (account) {
      setEditingId(account.id)
      setFormData({
        nome: account.nome,
        tipo: account.tipo,
        saldo_inicial: account.saldo_inicial,
        data_saldo_inicial: account.data_saldo_inicial,
        is_active: account.is_active,
      })
    } else {
      setEditingId(null)
      setFormData({
        nome: '',
        tipo: 'corrente',
        saldo_inicial: 0,
        data_saldo_inicial: format(new Date(), 'yyyy-MM-dd'),
        is_active: true,
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.nome) {
        toast.error('O nome da conta é obrigatório')
        return
      }

      if (editingId) {
        await accountService.updateAccount(editingId, formData)
        toast.success('Conta atualizada com sucesso')
      } else {
        await accountService.createAccount(formData)
        toast.success('Conta criada com sucesso')
      }
      setDialogOpen(false)
      fetchAccounts()
    } catch (error) {
      toast.error('Erro ao salvar conta')
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Deseja realmente excluir esta conta? Isso pode afetar transações atreladas.',
      )
    )
      return
    try {
      await accountService.deleteAccount(id)
      toast.success('Conta excluída')
      fetchAccounts()
    } catch (error) {
      toast.error('Erro ao excluir conta')
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Contas Bancárias
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gerencie suas contas e saldos iniciais.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="w-4 h-4 mr-2" /> Nova Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p>Carregando...</p>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 mb-2">Nenhuma conta encontrada.</p>
            <Button variant="outline" onClick={() => handleOpenDialog()}>
              Criar primeira conta
            </Button>
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className={`p-5 rounded-xl border bg-white shadow-sm flex flex-col gap-4 ${!acc.is_active && 'opacity-60 grayscale'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {acc.nome}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">{acc.tipo}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenDialog(acc)}
                    className="text-gray-400 hover:text-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Saldo Atual</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(acc.saldo_atual || 0)}
                  </p>
                </div>
                {!acc.is_active && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                    Inativa
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Conta' : 'Nova Conta'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Conta</label>
              <Input
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Nubank, Itaú..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={formData.tipo}
                onValueChange={(val) => setFormData({ ...formData, tipo: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                  <SelectItem value="aplicacao">Aplicação</SelectItem>
                  <SelectItem value="caixa">Caixa (Dinheiro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Saldo Inicial (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.saldo_inicial}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saldo_inicial: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data do Saldo</label>
                <Input
                  type="date"
                  value={formData.data_saldo_inicial}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      data_saldo_inicial: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <label className="text-sm font-medium">Conta Ativa</label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, is_active: val })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
