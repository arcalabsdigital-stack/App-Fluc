import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Apenas administradores podem gerenciar convites')
    }

    const body = await req.json()
    const { action, email, fullName, role, password, userId } = body

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (action === 'delete') {
      if (!userId) throw new Error('ID do usuário não fornecido')

      if (!profile.organization_id)
        throw new Error('Organização não encontrada')

      const { error: deleteError } = await supabaseAdmin
        .from('user_workspaces')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', profile.organization_id)

      if (deleteError)
        throw new Error(
          `Erro ao excluir usuário do workspace: ${deleteError.message}`,
        )

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'resend') {
      if (!userId) throw new Error('ID do usuário não fornecido')

      const { data: targetUser, error: getUserError } =
        await supabaseAdmin.auth.admin.getUserById(userId)
      if (getUserError || !targetUser?.user)
        throw new Error('Usuário não encontrado')

      const tempPassword = targetUser.user.user_metadata?.temp_password
      if (!tempPassword)
        throw new Error(
          'Não foi possível encontrar a senha inicial para reenvio. O usuário pode já ter alterado a senha.',
        )

      const res = await fetch(`${supabaseUrl}/functions/v1/welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          email: targetUser.user.email,
          name:
            targetUser.user.user_metadata?.full_name || targetUser.user.email,
          password: tempPassword,
        }),
      })

      if (!res.ok) throw new Error('Erro ao disparar o e-mail de boas-vindas')

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Default action: invite
    if (!profile.organization_id) {
      throw new Error('Organização do administrador não encontrada')
    }

    if (userId) {
      // User already exists, just link them
      const { error: linkError } = await supabaseAdmin
        .from('user_workspaces')
        .upsert({
          user_id: userId,
          organization_id: profile.organization_id,
          role: role,
          is_active: true, // Auto-activate link
        })

      if (linkError)
        throw new Error(
          `Erro ao vincular usuário existente: ${linkError.message}`,
        )

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            email,
            name: fullName,
            // no password since user already exists
          }),
        })
        if (!res.ok)
          console.error('Failed to send welcome email for existing user')
      } catch (e) {
        console.error('Exception sending welcome email:', e)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Convite enviado',
          convite_id: userId,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      // New user
      if (!password) {
        throw new Error('A senha inicial é obrigatória para novos usuários')
      }

      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            organization_id: profile.organization_id,
            role: role,
            must_change_password: true,
            temp_password: password,
          },
        })

      if (createError) throw createError

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          full_name: fullName,
          organization_id: profile.organization_id,
          role: role,
          is_active: true,
          must_change_password: true,
        })

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        throw new Error(
          `Erro ao criar perfil do usuário: ${profileError.message}`,
        )
      }

      const { error: wsError } = await supabaseAdmin
        .from('user_workspaces')
        .upsert({
          user_id: newUser.user.id,
          organization_id: profile.organization_id,
          role: role,
          is_active: true,
        })

      if (wsError) console.error('Erro ao registrar user_workspace', wsError)

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            email,
            name: fullName,
            password,
          }),
        })

        if (!res.ok) {
          console.error('Failed to send welcome email via edge function')
        }
      } catch (e) {
        console.error('Exception sending welcome email:', e)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Convite enviado',
          convite_id: newUser.user.id,
          user: newUser.user,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
  } catch (error: any) {
    let errorMessage = error.message || 'Erro desconhecido'
    if (
      errorMessage.includes('User already registered') ||
      errorMessage.includes('already exists')
    ) {
      errorMessage = 'Este e-mail já está cadastrado.'
    }

    // Retorna status 400 para que o frontend lide corretamente e identifique a mensagem de erro
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
