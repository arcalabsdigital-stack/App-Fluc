import { useEffect, useState } from 'react'
import { Plus, Trash2, Tag, Percent, DollarSign, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

type Coupon = {
  id: string
  code: string
  discount_type: 'PERCENTAGE' | 'FIXED'
  discount_value: number
  valid_until: string | null
  usage_limit: number | null
  times_used: number
  is_active: boolean
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: '',
    valid_until: '',
    usage_limit: '',
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      toast.error('Erro ao carregar cupons')
    } else {
      setCoupons(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      valid_until: formData.valid_until
        ? new Date(formData.valid_until).toISOString()
        : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
    }

    const { error } = await supabase.from('coupons').insert(payload)

    setLoading(false)
    if (error) {
      toast.error(error.message || 'Erro ao criar cupom')
    } else {
      toast.success('Cupom criado com sucesso!')
      setIsOpen(false)
      loadCoupons()
      setFormData({
        code: '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        valid_until: '',
        usage_limit: '',
      })
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !currentStatus })
      .eq('id', id)
    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      toast.success('Status atualizado')
      loadCoupons()
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este cupom?')) return
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao deletar')
    } else {
      toast.success('Cupom deletado')
      loadCoupons()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            Gestão de Cupons
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Crie e gerencie cupons promocionais para a plataforma Fluc.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Cupom</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Código do Cupom</Label>
                <Input
                  required
                  placeholder="Ex: FLUC50"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(val) =>
                      setFormData({ ...formData, discount_type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">
                        Porcentagem (%)
                      </SelectItem>
                      <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="Ex: 10"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Validade (Opcional)</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite de Uso (Opcional)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 100"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Cupom'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle>Cupons Ativos</CardTitle>
          <CardDescription>
            Visualize o histórico e limite de uso de cada cupom.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Código</th>
                  <th className="px-6 py-4 font-medium">Desconto</th>
                  <th className="px-6 py-4 font-medium">Usos</th>
                  <th className="px-6 py-4 font-medium">Validade</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        {coupon.discount_type === 'PERCENTAGE' ? (
                          <Percent className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <DollarSign className="w-3.5 h-3.5 text-green-500" />
                        )}
                        <span className="font-semibold">
                          {coupon.discount_value}
                          {coupon.discount_type === 'PERCENTAGE' ? '%' : ' R$'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span>
                          {coupon.times_used}{' '}
                          {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {coupon.valid_until
                        ? new Date(coupon.valid_until).toLocaleDateString(
                            'pt-BR',
                          )
                        : 'Sem validade'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={() =>
                          toggleStatus(coupon.id, coupon.is_active)
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteCoupon(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Nenhum cupom cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
