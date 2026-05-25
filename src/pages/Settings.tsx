import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Camera,
  Loader2,
  Save,
  User,
  Lock,
  Mail,
  RepeatIcon,
  AlertTriangle,
  CreditCard,
} from 'lucide-react'
import { BillingSettings } from '@/components/settings/BillingSettings'

const Settings = () => {
  const { user, profile, updateProfileContext } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name)
    }
  }, [profile])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    try {
      setIsUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const avatarUrl = data.publicUrl

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      updateProfileContext({ avatar_url: avatarUrl })
      toast.success('Foto de perfil atualizada com sucesso!')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Erro ao fazer upload da imagem')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (password && password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    const requirePasswordChange = profile?.must_change_password

    if (requirePasswordChange && !password) {
      toast.error('Você precisa definir uma nova senha para continuar.')
      return
    }

    try {
      setIsSaving(true)

      // Update name in profiles
      if (fullName !== profile?.full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', user.id)

        if (profileError) throw profileError
        updateProfileContext({ full_name: fullName })
      }

      // Update name in auth metadata
      if (fullName !== user.user_metadata?.full_name) {
        await supabase.auth.updateUser({
          data: { full_name: fullName },
        })
      }

      // Update password
      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password,
          data: { temp_password: null, must_change_password: false }, // Clear temporary password and update metadata
        })

        if (passwordError) throw passwordError

        if (requirePasswordChange) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ must_change_password: false })
            .eq('id', user.id)

          if (profileError) throw profileError
          updateProfileContext({ must_change_password: false })

          toast.success('Senha atualizada e perfil salvo com sucesso!')
          navigate('/', { replace: true })
          return
        }

        setPassword('')
        setConfirmPassword('')
        toast.success('Senha atualizada com sucesso!')
      } else {
        toast.success('Perfil salvo com sucesso!')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Erro ao salvar o perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const userInitials = (profile?.full_name || user?.email || 'U')
    .substring(0, 2)
    .toUpperCase()
  const avatarUrl = profile?.avatar_url

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Configurações de Perfil
        </h1>
        <p className="text-gray-500 mt-1">
          Gerencie suas informações pessoais e segurança da conta.
        </p>
      </div>

      <Tabs
        defaultValue={searchParams.get('tab') || 'profile'}
        className="w-full"
      >
        <TabsList className="mb-6 bg-white border border-gray-100 h-14 p-1 shadow-sm rounded-xl overflow-x-auto overflow-y-hidden flex-nowrap justify-start">
          <TabsTrigger
            value="profile"
            className="h-full rounded-lg px-6 data-[state=active]:bg-gray-50 whitespace-nowrap"
          >
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="h-full rounded-lg px-6 data-[state=active]:bg-gray-50 whitespace-nowrap"
            disabled={profile?.must_change_password}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Assinatura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-fade-in">
          {profile?.must_change_password && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-2xl mb-6 animate-fade-in-down">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5" />
                Ação Necessária: Defina sua nova senha
              </h3>
              <p className="mt-2 text-amber-700">
                Como este é seu primeiro acesso, por motivos de segurança, você
                precisa definir uma nova senha definitiva antes de poder
                utilizar o sistema e navegar por outras telas.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8">
              <form onSubmit={handleSaveProfile} className="space-y-8">
                {' '}
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-gray-100">
                  <div
                    className="relative group cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage
                        src={avatarUrl || undefined}
                        alt={profile?.full_name || ''}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">
                      Foto de Perfil
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Clique na imagem para alterar. Recomendado formato
                      quadrado, máx. 2MB.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Personal Info Section */}
                  <div className="space-y-5">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Informações Pessoais
                    </h3>

                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="pl-9 bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        O email não pode ser alterado por aqui.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="fullName"
                        className="text-sm font-medium text-gray-700"
                      >
                        Nome Completo
                      </label>
                      <Input
                        id="fullName"
                        placeholder="Seu nome"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={profile?.must_change_password}
                      />{' '}
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="space-y-5">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Segurança
                    </h3>

                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Nova Senha
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={
                          profile?.must_change_password
                            ? 'Digite sua nova senha'
                            : 'Deixe em branco para não alterar'
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={profile?.must_change_password}
                      />{' '}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-gray-700"
                      >
                        Confirmar Nova Senha
                      </label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirme a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={!password}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="min-w-[140px] shadow-sm rounded-full"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="animate-fade-in">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Settings
