import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const { event, payment } = body

    if (!payment || !payment.customer) {
      return new Response('No payment data', { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Achar subscription baseada no asaas_customer_id ou simulado
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, organization_id')
      .eq('asaas_customer_id', payment.customer)
      .single()

    if (!sub) {
      return new Response('Subscription not found', { status: 200 })
    }

    // Automatic Reward Application Logic
    if (event === 'PAYMENT_CREATED' && payment.subscription) {
      const { data: reward } = await supabase
        .from('pending_rewards')
        .select('*')
        .eq('organization_id', sub.organization_id)
        .eq('is_applied', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (reward) {
        let discountVal = 0
        if (reward.discount_type === 'PERCENTAGE') {
          discountVal = payment.value * (reward.discount_value / 100)
        } else {
          discountVal = reward.discount_value
        }

        const newTotal = Math.max(0, payment.value - discountVal)

        const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
        if (ASAAS_API_KEY) {
          await fetch(`https://api.asaas.com/v3/payments/${payment.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              access_token: ASAAS_API_KEY,
            },
            body: JSON.stringify({ value: newTotal }),
          })

          await supabase
            .from('pending_rewards')
            .update({ is_applied: true })
            .eq('id', reward.id)
        }
      }
    }

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .eq('id', sub.id)

      const { data: existingHist } = await supabase
        .from('billing_history')
        .select('id')
        .eq('asaas_payment_id', payment.id)
        .single()

      if (existingHist) {
        await supabase
          .from('billing_history')
          .update({
            status: 'paid',
            payment_date: new Date().toISOString(),
            amount: payment.value,
          })
          .eq('id', existingHist.id)
      } else {
        await supabase.from('billing_history').insert({
          organization_id: sub.organization_id,
          subscription_id: sub.id,
          amount: payment.value,
          status: 'paid',
          payment_date: new Date().toISOString(),
          asaas_payment_id: payment.id,
          invoice_url: payment.invoiceUrl || '',
        })
      }
    } else if (event === 'PAYMENT_OVERDUE') {
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('id', sub.id)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response('Webhook Error', { status: 500 })
  }
})
