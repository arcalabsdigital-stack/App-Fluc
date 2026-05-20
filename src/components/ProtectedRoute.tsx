import { useAuth } from '@/hooks/use-auth'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const ProtectedRoute = () => {
  const { session, loading, profile, subscription, role } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (subscription) {
      const isExpired =
        subscription.status === 'canceled' ||
        subscription.status === 'past_due' ||
        (subscription.status === 'trial' &&
          new Date(subscription.trial_end) < new Date())

      if (isExpired && location.pathname !== '/settings') {
        toast.error(
          'Seu plano está inativo. Regularize sua situação para continuar.',
        )
      }
    }
  }, [subscription, location.pathname])

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8F9FB] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-500 font-medium">
          Preparando seu ambiente...
        </p>
      </div>
    )
  }

  if (session && !profile) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8F9FB] space-y-4 px-4 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Erro ao carregar perfil
        </h2>
        <p className="text-sm text-gray-500 max-w-md">
          Não foi possível carregar as informações da sua conta. Isso pode
          ocorrer se o cadastro ainda estiver sendo processado.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const needsOnboarding = profile && role === 'admin' && !profile.cnpj_ou_cpf

  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (!needsOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }

  const isSuperAdmin =
    session?.user?.email &&
    ['marciomorais2722@gmail.com', 'arcalabs.digital@gmail.com'].includes(
      session.user.email,
    )

  if (location.pathname.startsWith('/admin') && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  if (
    profile?.must_change_password &&
    location.pathname !== '/settings' &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/settings" replace />
  }

  if (subscription) {
    const isExpired =
      subscription.status === 'canceled' ||
      subscription.status === 'past_due' ||
      (subscription.status === 'trial' &&
        new Date(subscription.trial_end) < new Date())
    if (isExpired && location.pathname !== '/settings') {
      return <Navigate to="/settings?tab=billing" replace />
    }
  }

  return <Outlet />
}
