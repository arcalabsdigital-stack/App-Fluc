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
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    if (!ASAAS_API_KEY) {
      throw new Error(
        'A chave da API (ASAAS_API_KEY) não está configurada nos segredos.',
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Cabeçalho de Autorização ausente.')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) throw new Error('Não autorizado.')

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Apenas administradores podem realizar essa ação.')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const plansPayloads = [
      {
        name: 'Fluxo',
        description: 'Ideal para começar',
        amount: 49.9,
        interval: 'MENSAL',
      },
      {
        name: 'Lucro',
        description: 'Mais popular',
        amount: 89.9,
        interval: 'MENSAL',
      },
      {
        name: 'Patrimônio',
        description: 'Para empresas em crescimento',
        amount: 199.9,
        interval: 'MENSAL',
      },
    ]

    const apiUrl = 'https://api.asaas.com/v3/plans'

    const asaasRequests = plansPayloads.map(async (plan) => {
      if (ASAAS_API_KEY === 'dummy_for_testing' || ASAAS_API_KEY === 'dummy') {
        return {
          ...plan,
          id: `plan_${plan.name.toLowerCase()}_${Date.now()}`,
        }
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify(plan),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Erro de Validação da API Asaas: ${err}`)
      }

      return res.json()
    })

    const asaasResponses = await Promise.all(asaasRequests)

    const featuresMap: Record<string, any> = {
      Fluxo: { transactions_limit: 100, categories_limit: 5, users_limit: 1 },
      Lucro: {
        transactions_limit: 'unlimited',
        categories_limit: 'unlimited',
        users_limit: 3,
        dre: 'simplificado',
      },
      Patrimônio: {
        users_limit: 'unlimited',
        dre: 'completo',
        valuation: true,
        support: 'VIP',
      },
    }

    const updatePromises = asaasResponses.map((asaasPlan: any, index) => {
      const planName = plansPayloads[index].name
      return supabaseAdmin.from('plans').upsert(
        {
          name: planName,
          asaas_plan_id: asaasPlan.id,
          price: plansPayloads[index].amount,
          features: featuresMap[planName],
          billing_period:
            plansPayloads[index].interval === 'MENSAL' ? 'mensal' : 'anual',
        },
        { onConflict: 'name' },
      )
    })

    await Promise.all(updatePromises)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Planos sincronizados com sucesso!',
        plans: asaasResponses.map((p: any) => ({ name: p.name, id: p.id })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Erro na Edge Function criar-planos-asas:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
