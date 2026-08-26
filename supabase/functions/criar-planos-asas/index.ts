import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    if (!ASAAS_API_KEY) {
      throw new Error('A chave da API (ASAAS_API_KEY) não está configurada nos segredos.')
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
        name: 'Mensal',
        description: 'Plano mensal completo',
        amount: 49.90,
        interval: 'MONTHLY',
      },
      {
        name: 'Anual',
        description: 'Plano anual com 2 meses grátis',
        amount: 358.80,
        interval: 'YEARLY',
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
      Mensal: {
        transactions_limit: 'unlimited',
        categories_limit: 'unlimited',
        users_limit: 1,
        support: 'email',
      },
      Anual: {
        transactions_limit: 'unlimited',
        categories_limit: 'unlimited',
        users_limit: 'unlimited',
        dre: 'completo',
        valuation: true,
        support: 'priority',
      },
    }

    const updatePromises = asaasResponses.map((asaasPlan: any, index) => {
      const planName = plansPayloads[index].name
      const planAmount = plansPayloads[index].amount
      const isAnnual = plansPayloads[index].interval === 'YEARLY'

      return supabaseAdmin
        .from('plans')
        .upsert(
          {
            name: planName,
            asaas_plan_id: asaasPlan.id,
            price: isAnnual ? planAmount / 12 : planAmount,
            price_mensal: isAnnual ? planAmount / 12 : planAmount,
            price_anual: isAnnual ? planAmount : null,
            features: featuresMap[planName],
            billing_period: isAnnual ? 'anual' : 'mensal',
          },
          { onConflict: 'name' }
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
      }
    )
  } catch (error: any) {
    console.error('Erro na Edge Function criar-planos-asas:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
