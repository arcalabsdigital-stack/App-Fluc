import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowRight } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastLoginMethod, setLastLoginMethod] = useState<string | null>(null)
  const { signIn, signInWithGoogle, user } = useAuth()

  useEffect(() => {
    const method = localStorage.getItem('lastLoginMethod')
    if (method) {
      setLastLoginMethod(method)
    }
  }, [])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        throw error
      }
      localStorage.setItem('lastLoginMethod', 'email')
    } catch (error: any) {
      toast.error(
        error.message || 'Erro ao fazer login. Verifique suas credenciais.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      localStorage.setItem('lastLoginMethod', 'google')
      const { error } = await signInWithGoogle()
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login com Google.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border overflow-hidden animate-fade-in-up">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold text-xl">
                F
              </div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                Fluc
              </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
            <p className="text-gray-500 mt-2">
              Acesse sua conta para acessar o Fluc
            </p>
          </div>

          <div className="mb-6 relative">
            {lastLoginMethod === 'google' && (
              <Badge
                variant="secondary"
                className="absolute -top-3 right-4 bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-sm text-[10px] px-2 py-0.5 z-10 pointer-events-none"
              >
                Último acesso
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 relative"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 mr-2"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Entre usando sua conta Google
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OU</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="#"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="relative mt-2">
              {lastLoginMethod === 'email' && (
                <Badge
                  variant="secondary"
                  className="absolute -top-3 right-4 bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-sm text-[10px] px-2 py-0.5 z-10 pointer-events-none"
                >
                  Último acesso
                </Badge>
              )}
              <Button
                type="submit"
                className="w-full relative"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Não tem uma conta?{' '}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Cadastre-se grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
