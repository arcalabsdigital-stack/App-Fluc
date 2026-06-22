import { useEffect, useState } from 'react'
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Building2,
  Tag,
  Play,
  Pause,
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type DashboardStats = {
  total_workspaces: number
  new_workspaces: number
  total_transactions: number
  cold_clients: number
}

type Customer = {
  organization_id: string
  workspace_name: string
  owner_name: string | null
  owner_email: string | null
  coupon_code: string | null
  transaction_volume: number
  last_activity: string | null
  is_active: boolean
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers(customers)
      return
    }
    const lowerSearch = searchTerm.toLowerCase()
    const filtered = customers.filter(
      (c) =>
        (c.workspace_name &&
          c.workspace_name.toLowerCase().includes(lowerSearch)) ||
        (c.owner_name && c.owner_name.toLowerCase().includes(lowerSearch)) ||
        (c.owner_email && c.owner_email.toLowerCase().includes(lowerSearch)),
    )
    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, customersRes] = await Promise.all([
        supabase.rpc('get_admin_dashboard_stats'),
        supabase.rpc('get_admin_customers'),
      ])

      if (statsRes.error) throw statsRes.error
      if (customersRes.error) throw customersRes.error

      setStats(statsRes.data as DashboardStats)
      setCustomers(customersRes.data as Customer[])
    } catch (error: any) {
      toast.error('Erro ao carregar dados do dashboard')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (orgId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_organization_status', {
        p_org_id: orgId,
        p_is_active: !currentStatus,
      })
      if (error) throw error
      toast.success(
        `Workspace ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
      )
      loadData()
    } catch (error: any) {
      toast.error('Erro ao alterar status do workspace')
      console.error(error)
    }
  }

  const handleApplyCoupon = async () => {
    if (!selectedOrg || !couponCode.trim()) {
      toast.error('Informe o código do cupom')
      return
    }

    setApplyingCoupon(true)
    try {
      const { data, error } = await supabase.rpc(
        'apply_coupon_to_organization',
        {
          p_org_id: selectedOrg,
          p_coupon_code: couponCode.trim().toUpperCase(),
        },
      )

      if (error) throw error

      const result = data as any
      if (result && !result.success) {
        throw new Error(result.error || 'Erro desconhecido')
      }

      toast.success('Cupom aplicado com sucesso!')
      setIsCouponDialogOpen(false)
      setCouponCode('')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aplicar cupom')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const openCouponDialog = (orgId: string) => {
    setSelectedOrg(orgId)
    setIsCouponDialogOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Dashboard Administrativo
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Visão estratégica e gestão de clientes da plataforma Fluc.
        </p>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total de Workspaces
                  </CardTitle>
                  <Building2 className="w-4 h-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.total_workspaces}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Novos (30 dias)
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    +{stats.new_workspaces}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total de Transações
                  </CardTitle>
                  <Activity className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.total_transactions}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Risco de Churn (Inativos)
                  </CardTitle>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.cold_clients}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Sem atividade nos últimos 15 dias
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader className="pb-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Diretório de Clientes</CardTitle>
                <CardDescription>
                  Gerencie todos os workspaces, aplique cupons e acompanhe o
                  engajamento.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4 font-medium">Workspace</th>
                      <th className="px-6 py-4 font-medium">Responsável</th>
                      <th className="px-6 py-4 font-medium">Cupom</th>
                      <th className="px-6 py-4 font-medium text-center">
                        Transações
                      </th>
                      <th className="px-6 py-4 font-medium">
                        Última Atividade
                      </th>
                      <th className="px-6 py-4 font-medium text-center">
                        Status
                      </th>
                      <th className="px-6 py-4 font-medium text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.organization_id}
                        className="hover:bg-gray-50/50"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {customer.workspace_name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              {customer.owner_name || 'Desconhecido'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {customer.owner_email || 'Sem email'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {customer.coupon_code ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {customer.coupon_code}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {customer.transaction_volume}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {customer.last_activity
                            ? new Date(
                                customer.last_activity,
                              ).toLocaleDateString('pt-BR')
                            : 'Nunca'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {customer.is_active ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-700 hover:bg-red-100"
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Inativo
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  openCouponDialog(customer.organization_id)
                                }
                                className="cursor-pointer"
                              >
                                <Tag className="mr-2 h-4 w-4" />
                                <span>Aplicar Cupom</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStatus(
                                    customer.organization_id,
                                    customer.is_active,
                                  )
                                }
                                className="cursor-pointer"
                              >
                                {customer.is_active ? (
                                  <>
                                    <Pause className="mr-2 h-4 w-4 text-red-500" />
                                    <span className="text-red-500">
                                      Desativar Workspace
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4 text-green-500" />
                                    <span className="text-green-500">
                                      Ativar Workspace
                                    </span>
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Nenhum cliente encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Cupom</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código do Cupom</Label>
              <Input
                placeholder="Ex: FLUC50"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="uppercase"
              />
              <p className="text-xs text-gray-500">
                O cupom deve estar cadastrado e ativo no sistema.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCouponDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleApplyCoupon} disabled={applyingCoupon}>
              {applyingCoupon ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
