import { useEffect, useState } from 'react'
import { ShieldCheck, Search, Shield, User as UserIcon } from 'lucide-react'
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
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

type AdminUser = {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

export default function AdminStaff() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { user: currentUser } = useAuth()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_all_users_for_admin')

    if (error) {
      toast.error('Erro ao carregar usuários: ' + error.message)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const toggleSuperAdmin = async (userId: string, currentRole: string) => {
    if (userId === currentUser?.id) {
      toast.error('Você não pode alterar seu próprio nível de acesso.')
      return
    }

    const newRole = currentRole === 'super_admin' ? 'admin' : 'super_admin'

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast.error('Erro ao atualizar permissões')
    } else {
      toast.success('Permissões atualizadas com sucesso')
      loadUsers()
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Gerenciar Staff Fluc
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administre quem tem acesso ao painel de controle e configurações
            globais.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Todos os usuários cadastrados na plataforma e seus níveis de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Usuário</th>
                  <th className="px-6 py-4 font-medium">E-mail</th>
                  <th className="px-6 py-4 font-medium">Nível de Acesso</th>
                  <th className="px-6 py-4 font-medium">Data de Cadastro</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Carregando usuários...
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {u.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {u.full_name || 'Sem nome'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        {u.role === 'super_admin' ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-gray-500 gap-1"
                          >
                            <UserIcon className="w-3 h-3" />
                            {u.role}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.id !== currentUser?.id && (
                          <Button
                            variant={
                              u.role === 'super_admin' ? 'outline' : 'default'
                            }
                            size="sm"
                            onClick={() => toggleSuperAdmin(u.id, u.role)}
                            className={
                              u.role === 'super_admin'
                                ? 'text-red-500 hover:text-red-600'
                                : ''
                            }
                          >
                            {u.role === 'super_admin'
                              ? 'Remover Admin'
                              : 'Tornar Admin'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Nenhum usuário encontrado.
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
