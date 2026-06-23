import { useEffect, useState } from 'react'
import { Wallet, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type FinancialCustomer = {
  profile_id: string
  organization_id: string
  full_name: string | null
  email: string | null
  telefone: string | null
  cnpj_ou_cpf: string | null
  created_at: string | null
  plan: string | null
  plan_status: string | null
  metodo_pagamento: string | null
  current_period_end: string | null
  last_sign_in_at: string | null
}

export default function AdminFinancial() {
  const [customers, setCustomers] = useState<FinancialCustomer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<
    FinancialCustomer[]
  >([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

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
        (c.full_name && c.full_name.toLowerCase().includes(lowerSearch)) ||
        (c.email && c.email.toLowerCase().includes(lowerSearch)) ||
        (c.cnpj_ou_cpf && c.cnpj_ou_cpf.toLowerCase().includes(lowerSearch)),
    )
    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc(
        'get_admin_financial_customers',
      )

      if (error) throw error

      setCustomers(data as FinancialCustomer[])
    } catch (error: any) {
      toast.error('Erro ao carregar dados financeiros')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Ativo
          </Badge>
        )
      case 'trial':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Trial
          </Badge>
        )
      case 'past_due':
        return (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-700 hover:bg-red-100"
          >
            Atrasado
          </Badge>
        )
      case 'canceled':
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-700 hover:bg-gray-100"
          >
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status || 'Desconhecido'}</Badge>
    }
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" />
          Gestão Financeira
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitoramento de assinaturas e dados financeiros de clientes da
          plataforma Fluc.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Assinantes</CardTitle>
            <CardDescription>
              Acompanhe o status, perfis e informações de faturamento de todos
              os usuários.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou documento..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nome / E-mail</th>
                    <th className="px-6 py-4 font-medium">
                      Telefone / Documento
                    </th>
                    <th className="px-6 py-4 font-medium text-center">
                      Data de Cadastro
                    </th>
                    <th className="px-6 py-4 font-medium text-center">
                      Tipo de Plano
                    </th>
                    <th className="px-6 py-4 font-medium text-center">
                      Status do Plano
                    </th>
                    <th className="px-6 py-4 font-medium text-center">
                      Forma de Pagamento
                    </th>
                    <th className="px-6 py-4 font-medium text-center">
                      Data de Vencimento
                    </th>
                    <th className="px-6 py-4 font-medium text-center">
                      Último Acesso
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.profile_id}
                      className="hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 whitespace-nowrap">
                            {customer.full_name || 'Sem nome'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {customer.email || 'Sem email'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-700 whitespace-nowrap">
                            {customer.telefone || '-'}
                          </span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {customer.cnpj_ou_cpf || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500 whitespace-nowrap">
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString(
                              'pt-BR',
                            )
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-900 whitespace-nowrap">
                        {customer.plan ? (
                          <span className="capitalize">{customer.plan}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {getStatusBadge(customer.plan_status)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500 whitespace-nowrap">
                        {customer.metodo_pagamento ? (
                          <span className="capitalize">
                            {customer.metodo_pagamento.replace('_', ' ')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500 whitespace-nowrap">
                        {customer.current_period_end
                          ? new Date(
                              customer.current_period_end,
                            ).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500 whitespace-nowrap">
                        {customer.last_sign_in_at
                          ? new Date(
                              customer.last_sign_in_at,
                            ).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Nenhum cliente encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
