import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    const todayStr = new Date().toISOString().split('T')[0]

    // 1. Trial Upgrade Reminders
    const { data: trials } = await supabaseAdmin
      .from('subscriptions')
      .select('organization_id, trial_end')
      .eq('status', 'trial')

    if (trials && trials.length > 0) {
      for (const trial of trials) {
        const { data: admins } = await supabaseAdmin
          .from('user_workspaces')
          .select('user_id')
          .eq('organization_id', trial.organization_id)
          .eq('role', 'admin')

        if (admins) {
          for (const admin of admins) {
            const { data: existing } = await supabaseAdmin
              .from('notifications')
              .select('id')
              .eq('user_id', admin.user_id)
              .eq('organization_id', trial.organization_id)
              .like('title', 'Período de Teste%')
              .gte('created_at', todayStr)
              .limit(1)

            if (!existing || existing.length === 0) {
              let trialRemaining = 0
              if (trial.trial_end) {
                const end = new Date(trial.trial_end)
                const now = new Date()
                trialRemaining = Math.max(
                  0,
                  Math.ceil(
                    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                  ),
                )
              }

              let message = `Seu período de teste está ativo. Aproveite para assinar um plano e continuar usando todos os recursos!`
              if (trialRemaining > 0) {
                message = `Seu período de teste termina em ${trialRemaining} dias. Assine um plano agora para não perder o acesso.`
              }

              await supabaseAdmin.from('notifications').insert({
                organization_id: trial.organization_id,
                user_id: admin.user_id,
                title: 'Período de Teste',
                message,
                is_read: false,
              })
            }
          }
        }
      }
    }

    // 2. Due Date Alerts (recurring transactions due in 3 days)
    const in3Days = new Date()
    in3Days.setDate(in3Days.getDate() + 3)
    const dueStr = in3Days.toISOString().split('T')[0]

    const { data: recurrings } = await supabaseAdmin
      .from('recurring_transactions')
      .select('*')
      .eq('next_date', dueStr)

    if (recurrings && recurrings.length > 0) {
      for (const rec of recurrings) {
        const { data: existing } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('user_id', rec.user_id)
          .eq('organization_id', rec.organization_id)
          .eq('title', 'Vencimento Próximo')
          .like('message', `%${rec.description}%`)
          .gte('created_at', todayStr)
          .limit(1)

        if (!existing || existing.length === 0) {
          await supabaseAdmin.from('notifications').insert({
            organization_id: rec.organization_id,
            user_id: rec.user_id,
            title: 'Vencimento Próximo',
            message: `Sua transação "${rec.description}" de R$ ${rec.amount} vence em 3 dias.`,
            is_read: false,
          })
        }
      }
    }

    // 3. Transactions Due Date Alerts (due in 3 days, status != pago)
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('date', dueStr)
      .neq('status', 'pago')

    if (transactions && transactions.length > 0) {
      for (const t of transactions) {
        const { data: existing } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('user_id', t.user_id)
          .eq('organization_id', t.organization_id)
          .eq('title', 'Transação Pendente')
          .like('message', `%${t.description}%`)
          .gte('created_at', todayStr)
          .limit(1)

        if (!existing || existing.length === 0) {
          await supabaseAdmin.from('notifications').insert({
            organization_id: t.organization_id,
            user_id: t.user_id,
            title: 'Transação Pendente',
            message: `A transação "${t.description}" de R$ ${t.amount} vence em 3 dias e ainda não foi paga.`,
            is_read: false,
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Error in generate-notifications:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
