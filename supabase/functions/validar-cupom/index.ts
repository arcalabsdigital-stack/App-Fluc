import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ erro: 'Não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ erro: 'Não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const { cupom, plano, periodo } = body

    if (!cupom || typeof cupom !== 'string' || !cupom.trim()) {
      return new Response(JSON.stringify({ valido: false, erro: 'Cupom inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const cleanCupom = cupom.replace(/\s+/g, '').toUpperCase()

    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') || 'dummy'

    const fetchAsaas = async (retries = 3, backoff = 2000): Promise<Response> => {
      try {
        const response = await fetch('https://sandbox.asaas.com/api/v3/coupons/validate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ASAAS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: cleanCupom,
            planId: plano,
            billingCycle: periodo === 'anual' ? 'YEARLY' : 'MONTHLY'
          })
        })
        
        if (response.status >= 500 && retries > 0) {
          await new Promise(res => setTimeout(res, backoff))
          return fetchAsaas(retries - 1, backoff * 2)
        }
        return response
      } catch (err) {
        if (retries > 0) {
          await new Promise(res => setTimeout(res, backoff))
          return fetchAsaas(retries - 1, backoff * 2)
        }
        throw err
      }
    }

    if (ASAAS_API_KEY === 'dummy') {
      await new Promise(res => setTimeout(res, 500))
      
      if (cleanCupom === 'INVALIDO') {
        return new Response(JSON.stringify({ valido: false, erro: 'Cupom não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (cleanCupom === 'EXPIRADO') {
        return new Response(JSON.stringify({ valido: false, erro: 'Cupom expirado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (cleanCupom === 'ERRO503') {
        return new Response(JSON.stringify({ valido: false, erro: 'Serviço temporariamente indisponível' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      const price = plano === 'Fluxo' ? 49.9 : plano === 'Lucro' ? 89.9 : 199.9
      const total = periodo === 'anual' ? price * 10 : price
      const discountVal = 10.0
      
      return new Response(JSON.stringify({
        valido: true,
        desconto_valor: discountVal,
        desconto_percentual: Math.round((discountVal / total) * 100),
        novo_total: total - discountVal
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const response = await fetchAsaas()

    if (response.status === 404) {
      return new Response(JSON.stringify({ valido: false, erro: 'Cupom não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (response.status === 400) {
      return new Response(JSON.stringify({ valido: false, erro: 'Cupom inválido ou expirado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (response.status === 503) {
      return new Response(JSON.stringify({ valido: false, erro: 'Serviço temporariamente indisponível' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error('Asaas API Error:', errText)
      throw new Error('Falha na comunicação com gateway de pagamento')
    }

    const data = await response.json()
    return new Response(JSON.stringify({
      valido: true,
      desconto_valor: data.discountValue || 0,
      desconto_percentual: data.discountPercentage || 0,
      novo_total: data.newTotal || 0
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('Erro na edge function validar-cupom:', error)
    return new Response(JSON.stringify({ valido: false, erro: 'Erro interno ao validar cupom. Tente novamente mais tarde.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
