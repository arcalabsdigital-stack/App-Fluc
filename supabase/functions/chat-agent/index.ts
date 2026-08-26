import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL') ?? ''
const N8N_WEBHOOK_SECRET = Deno.env.get('N8N_WEBHOOK_SECRET') ?? ''
const TIMEOUT_MS = 60_000

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_SECRET) {
      console.error('N8N_WEBHOOK_URL ou N8N_WEBHOOK_SECRET não configurados')
      return json({ error: 'Serviço indisponível no momento.' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autenticado.' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return json({ error: 'Não autenticado.' }, 401)
    }

    const body = await req.json().catch(() => null)
    const message = body?.message

    if (typeof message !== 'string' || message.trim().length === 0) {
      return json({ error: 'Mensagem obrigatória.' }, 400)
    }
    if (message.length > 4000) {
      return json({ error: 'Mensagem muito longa.' }, 400)
    }

    const payload = {
      message: message.trim(),
      user_id: user.id,
      timestamp: new Date().toISOString(),
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    let n8nResponse: Response
    try {
      n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Jwt': authHeader,
          'X-Webhook-Secret': N8N_WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if (!n8nResponse.ok) {
      console.error(
        'n8n respondeu',
        n8nResponse.status,
        await n8nResponse.text(),
      )
      return json({ error: 'Não consegui falar com o assistente agora.' }, 502)
    }

    const contentType = n8nResponse.headers.get('content-type') ?? ''
    const responseData = contentType.includes('application/json')
      ? await n8nResponse.json()
      : { response: await n8nResponse.text() }

    return json(responseData)
  } catch (error) {
    console.error('Erro em chat-agent:', error)
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    return json(
      {
        error: aborted
          ? 'O assistente demorou demais para responder.'
          : 'Erro interno.',
      },
      aborted ? 504 : 500,
    )
  }
})
