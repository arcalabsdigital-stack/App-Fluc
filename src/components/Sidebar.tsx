import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  LifeBuoy,
  Settings,
  LogOut,
  Users,
  History,
  TrendingUp,
  Target,
  PlayCircle,
  Tag,
  ShieldCheck,
  RepeatIcon,
  Folder,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { useTourStore } from '@/stores/useTourStore'

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  isActive,
  badge,
  onClick,
  id,
}: {
  icon: any
  label: string
  to?: string
  isActive?: boolean
  badge?: string
  onClick?: () => void
  id?: string
}) => {
  const className = cn(
    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-white hover:shadow-sm w-full text-left',
    isActive
      ? 'text-primary font-semibold bg-white shadow-sm'
      : 'text-gray-500',
  )

  const content = (
    <>
      <Icon
        className={cn(
          'w-5 h-5',
          isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary',
        )}
      />
      <span className="flex-1">{label}</span>
      {badge && (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-500 hover:bg-red-200 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
        >
          {badge}
        </Badge>
      )}
    </>
  )

  if (to) {
    return (
      <Link id={id} to={to} onClick={onClick} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button id={id} onClick={onClick} className={className}>
      {content}
    </button>
  )
}

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const location = useLocation()
  const pathname = location.pathname
  const {
    signOut,
    role,
    currentWorkspace,
    loading: authLoading,
    reloadProfile,
    profile,
    user,
  } = useAuth()
  const navigate = useNavigate()

  const [workspaceName, setWorkspaceName] = useState('Carregando...')
  const [isTimeout, setIsTimeout] = useState(false)

  useEffect(() => {
    if (
      currentWorkspace?.name &&
      currentWorkspace.name !== 'Minha Organização'
    ) {
      setWorkspaceName(currentWorkspace.name)
      setIsTimeout(false)
    } else if (profile?.razao_social_ou_nome || profile?.full_name) {
      setWorkspaceName(profile.razao_social_ou_nome || profile.full_name)
      setIsTimeout(false)
    } else if (!authLoading) {
      setWorkspaceName('Meu Workspace')
    }
  }, [currentWorkspace, profile, authLoading])

  useEffect(() => {
    let timeoutId: any
    const displayName = profile?.razao_social_ou_nome || profile?.full_name
    if (!displayName && !currentWorkspace?.name && authLoading) {
      timeoutId = setTimeout(() => {
        setIsTimeout(true)
        setWorkspaceName('Workspace não encontrado')
      }, 5000)
    }
    return () => clearTimeout(timeoutId)
  }, [currentWorkspace, profile, authLoading])

  const handleRetryWorkspace = () => {
    setIsTimeout(false)
    setWorkspaceName('Carregando...')
    reloadProfile()
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Você saiu com sucesso')
      navigate('/login')
    } catch (error) {
      toast.error('Erro ao sair')
    }
  }

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'colaborador':
        return 'Colaborador'
      case 'visitante':
        return 'Visitante'
      default:
        return ''
    }
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen w-[280px] bg-[#F8F9FB] border-r border-gray-100 p-6 flex flex-col z-40 hidden md:flex',
        className,
      )}
    >
      {/* Brand & Workspace */}
      <div className="flex flex-col mb-10 px-2 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-xl font-display">
            F
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            Fluc
          </span>
        </div>
        {isTimeout ? (
          <div className="px-2 mt-2 bg-white/50 rounded-lg py-3 border border-red-100 flex flex-col gap-2">
            <span className="text-xs font-semibold text-red-500 text-center">
              {workspaceName}
            </span>
            <button
              onClick={handleRetryWorkspace}
              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 py-1.5 px-2 rounded-md font-medium transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <div className="px-1 mt-2 bg-white/50 rounded-lg py-2 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Workspace
            </span>
            <span className="text-sm font-semibold text-gray-800 truncate block">
              {workspaceName}
            </span>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
        <div>
          <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu
          </div>
          <div className="space-y-1">
            <SidebarItem
              id="sidebar-item-Início"
              icon={LayoutDashboard}
              label="Início"
              to="/"
              isActive={pathname === '/'}
              onClick={onNavigate}
            />
            <SidebarItem
              id="sidebar-item-Diagnostico"
              icon={Activity}
              label="Meu Diagnóstico"
              to="/diagnostico"
              isActive={pathname === '/diagnostico'}
              onClick={onNavigate}
            />
            <SidebarItem
              id="sidebar-item-Contas"
              icon={Wallet}
              label="Contas Bancárias"
              to="/accounts"
              isActive={pathname === '/accounts'}
              onClick={onNavigate}
            />
            <SidebarItem
              id="sidebar-item-Conciliacao"
              icon={ShieldCheck}
              label="Conciliação"
              to="/payments?tab=reconciliation"
              isActive={
                pathname === '/payments' &&
                location.search.includes('tab=reconciliation')
              }
              onClick={onNavigate}
            />
            <SidebarItem
              id="sidebar-item-Orçamentos"
              icon={Target}
              label="Orçamentos"
              to="/budgets"
              isActive={pathname === '/budgets'}
              onClick={onNavigate}
            />
            <SidebarItem
              id="sidebar-item-Recorrentes"
              icon={RepeatIcon}
              label="Gastos Recorrentes"
              to="/recurring"
              isActive={pathname === '/recurring'}
              onClick={onNavigate}
            />
            <SidebarItem
              id="sidebar-item-Categorias"
              icon={Folder}
              label="Categorias"
              to="/categories"
              isActive={pathname === '/categories'}
              onClick={onNavigate}
            />
            <SidebarItem
              id="sidebar-item-Transações"
              icon={Tag}
              label="Transações"
              to="/payments"
              isActive={
                pathname === '/payments' &&
                !location.search.includes('tab=reconciliation')
              }
              onClick={onNavigate}
            />
            {role === 'admin' && (
              <SidebarItem
                id="sidebar-item-Usuários"
                icon={Users}
                label="Gerenciar Usuários"
                to="/users"
                isActive={pathname === '/users'}
                onClick={onNavigate}
              />
            )}
            <SidebarItem
              id="sidebar-item-Histórico"
              icon={History}
              label="Histórico"
              to="/history"
              isActive={pathname === '/history'}
              onClick={onNavigate}
            />
            <SidebarItem
              id="sidebar-item-DRE-Valuation"
              icon={TrendingUp}
              label="DRE/Valuation"
              to="/valuation"
              isActive={pathname === '/valuation'}
              onClick={onNavigate}
            />
          </div>
        </div>

        {user?.email &&
          ['marciomorais2722@gmail.com', 'arcalabs.digital@gmail.com'].includes(
            user.email,
          ) && (
            <div>
              <div className="px-4 mb-2 text-xs font-semibold text-blue-500 uppercase tracking-wider">
                Painel Fluc
              </div>
              <div className="space-y-1 mb-6">
                <SidebarItem
                  icon={Tag}
                  label="Gestão de Cupons"
                  to="/admin/coupons"
                  isActive={pathname === '/admin/coupons'}
                  onClick={onNavigate}
                />
                <SidebarItem
                  icon={ShieldCheck}
                  label="Gerenciar Staff"
                  to="/admin/staff"
                  isActive={pathname === '/admin/staff'}
                  onClick={onNavigate}
                />
              </div>
            </div>
          )}

        <div>
          <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Suporte
          </div>
          <div className="space-y-1">
            <SidebarItem
              icon={LifeBuoy}
              label="Ajuda"
              to="/help"
              isActive={pathname === '/help'}
              onClick={onNavigate}
            />
            <SidebarItem
              icon={Settings}
              label="Configurações"
              to="/settings"
              isActive={pathname === '/settings'}
              onClick={onNavigate}
            />
            <SidebarItem
              id="sidebar-item-Como-Funciona"
              icon={PlayCircle}
              label="Como Funciona"
              onClick={() => {
                if (onNavigate) onNavigate()
                useTourStore.getState().startTour()
              }}
            />
          </div>
        </div>
      </div>

      {/* Role Indicator & Logout */}
      <div className="mt-auto space-y-2">
        {role && role !== 'visitante' && (
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
              Acesso Atual
            </span>
            <span className="text-sm font-bold text-gray-900">
              {getRoleLabel()}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
