import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } })
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const reqBody = await req.json()
    const { plan, organization_id, period, coupon } = reqBody
    if (!plan || !organization_id) throw new Error('Missing plan or organization_id')

    const { data: userWs } = await supabaseClient
      .from('user_workspaces')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()

    if (!userWs || userWs.role !== 'admin') throw new Error('Apenas administradores podem realizar essa ação')

    const { data: org } = await supabaseAdmin.from('organizations').select('*').eq('id', organization_id).single()
    const { data: sub } = await supabaseAdmin.from('subscriptions').select('*').eq('organization_id', organization_id).single()
    
    let { data: planData } = await supabaseAdmin.from('plans').select('*').eq('name', plan).single()

    if (!planData) {
      const normalizedPlan = plan.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      const { data: allPlans } = await supabaseAdmin.from('plans').select('*')
      planData = (allPlans || []).find(p => p.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalizedPlan)
    }

    if (!org || !sub || !planData) throw new Error('Organization, Subscription or Plan not found')

    let discountValue = 0
    let couponData = null

    const cycle = period === 'anual' ? 'YEARLY' : 'MONTHLY'
    const planPrice = cycle === 'YEARLY' ? (planData.price_anual || planData.price * 10) : planData.price

    if (coupon) {
      const { data: dbCoupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', coupon.toUpperCase().trim())
        .eq('is_active', true)
        .single()
      
      if (dbCoupon) {
        if (dbCoupon.valid_until && new Date(dbCoupon.valid_until) < new Date()) {
          throw new Error('Cupom expirado')
        }
        if (dbCoupon.usage_limit && dbCoupon.times_used >= dbCoupon.usage_limit) {
          throw new Error('Limite de uso do cupom excedido')
        }
        if (dbCoupon.discount_type === 'PERCENTAGE' && period === 'anual') {
          throw new Error('Este cupom é válido apenas para a modalidade mensal')
        }
        
        couponData = dbCoupon
        if (dbCoupon.discount_type === 'PERCENTAGE') {
          discountValue = planPrice * (dbCoupon.discount_value / 100)
        } else {
          discountValue = dbCoupon.discount_value
        }
      } else {
        throw new Error('Cupom inválido ou não encontrado')
      }
    }

    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') || 'dummy_for_testing'
    const isDummyAsaas = ASAAS_API_KEY === 'dummy_for_testing'

    let asaasCustomerId = sub.asaas_customer_id

    if (!isDummyAsaas && !asaasCustomerId) {
      const customerRes = await fetch('https://api.asaas.com/v3/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
        body: JSON.stringify({
          name: org.corporate_name || org.name,
          email: user.email,
          cpfCnpj: org.cnpj || undefined
        })
      })

      if (!customerRes.ok) {
        const err = await customerRes.text()
        throw new Error(`Failed to create Asaas customer: ${err}`)
      }

      const customerData = await customerRes.json()
      asaasCustomerId = customerData.id

      await supabaseAdmin.from('subscriptions').upsert({
        id: sub.id,
        organization_id: organization_id,
        asaas_customer_id: asaasCustomerId
      }, { onConflict: 'organization_id' })
    }

    let invoiceUrl = ''
    let paymentId = null
    let asaasSubscriptionId = null

    if (couponData) {
      const discountedPrice = Math.max(0, planPrice - discountValue)
      
      if (!isDummyAsaas && discountedPrice >= 5) {
        const paymentPayload = {
          customer: asaasCustomerId,
          billingType: 'UNDEFINED',
          value: discountedPrice,
          dueDate: new Date().toISOString().split('T')[0],
          description: `Pagamento (Desconto Cupom) ${planData.name} - ${org.name}`
        }

        const paymentRes = await fetch('https://api.asaas.com/v3/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
          body: JSON.stringify(paymentPayload)
        })

        if (!paymentRes.ok) {
          const err = await paymentRes.text()
          throw new Error(`Failed to create discounted payment: ${err}`)
        }
        
        const paymentRespData = await paymentRes.json()
        invoiceUrl = paymentRespData.invoiceUrl
        paymentId = paymentRespData.id
      } else if (isDummyAsaas && discountedPrice >= 5) {
        invoiceUrl = 'https://api.asaas.com/i/dummy_invoice_' + Date.now()
        paymentId = 'pay_dummy_' + Date.now()
      }

      const nextDate = new Date()
      if (cycle === 'YEARLY') {
        nextDate.setFullYear(nextDate.getFullYear() + 1)
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1)
      }

      if (!isDummyAsaas) {
        const subscriptionPayload: any = {
          customer: asaasCustomerId,
          billingType: 'UNDEFINED',
          value: planPrice,
          nextDueDate: nextDate.toISOString().split('T')[0],
          cycle: cycle,
          description: `Assinatura ${planData.name} - ${org.name}`
        }
        
        if (planData.asaas_plan_id) subscriptionPayload.plan = planData.asaas_plan_id

        const subscriptionRes = await fetch('https://api.asaas.com/v3/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
          body: JSON.stringify(subscriptionPayload)
        })
        const subscriptionData = await subscriptionRes.json()
        asaasSubscriptionId = subscriptionData.id
      } else {
        asaasSubscriptionId = 'sub_dummy_' + Date.now()
      }

      await supabaseAdmin.from('coupon_redemptions').insert({
        coupon_id: couponData.id,
        user_id: user.id,
        organization_id: organization_id,
        payment_id: paymentId
      })
      
      await supabaseAdmin.from('coupons').update({
        times_used: couponData.times_used + 1
      }).eq('id', couponData.id)

      if (discountedPrice < 5) {
        await supabaseAdmin.from('subscriptions').upsert({
          id: sub.id,
          organization_id: organization_id,
          asaas_customer_id: asaasCustomerId,
          asaas_subscription_id: asaasSubscriptionId,
          plan: planData.name,
          status: 'active',
          current_period_end: nextDate.toISOString()
        }, { onConflict: 'organization_id' })

        await supabaseAdmin.from('billing_history').insert({
          organization_id: organization_id,
          subscription_id: sub.id,
          amount: discountedPrice,
          status: 'paid',
          payment_date: new Date().toISOString(),
          cupom_desconto: couponData.code,
          desconto_valor: discountValue
        })

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      if (!isDummyAsaas) {
        const subscriptionPayload: any = {
          customer: asaasCustomerId,
          billingType: 'UNDEFINED',
          value: planPrice,
          nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cycle: cycle,
          description: `Assinatura ${planData.name} - ${org.name}`
        }

        if (planData.asaas_plan_id) subscriptionPayload.plan = planData.asaas_plan_id

        const subscriptionRes = await fetch('https://api.asaas.com/v3/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
          body: JSON.stringify(subscriptionPayload)
        })

        if (!subscriptionRes.ok) {
          const err = await subscriptionRes.text()
          throw new Error(`Failed to create Asaas subscription: ${err}`)
        }

        const subscriptionData = await subscriptionRes.json()
        asaasSubscriptionId = subscriptionData.id

        const paymentsRes = await fetch(`https://api.asaas.com/v3/payments?subscription=${subscriptionData.id}`, {
          method: 'GET',
          headers: { 'access_token': ASAAS_API_KEY }
        })
        
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json()
          if (paymentsData.data && paymentsData.data.length > 0) {
            invoiceUrl = paymentsData.data[0].invoiceUrl
            paymentId = paymentsData.data[0].id
          }
        }
      } else {
        invoiceUrl = 'https://api.asaas.com/i/dummy_invoice_' + Date.now()
        paymentId = 'pay_dummy_' + Date.now()
        asaasSubscriptionId = 'sub_dummy_' + Date.now()
      }
    }

    await supabaseAdmin.from('subscriptions').upsert({
      id: sub.id,
      organization_id: organization_id,
      asaas_customer_id: asaasCustomerId,
      asaas_subscription_id: asaasSubscriptionId,
      plan: planData.name,
      status: 'pending'
    }, { onConflict: 'organization_id' })

    await supabaseAdmin.from('billing_history').insert({
      organization_id: organization_id,
      subscription_id: sub.id,
      amount: couponData ? Math.max(0, planPrice - discountValue) : planPrice,
      status: 'pending',
      asaas_payment_id: paymentId,
      invoice_url: invoiceUrl,
      ...(couponData && {
        cupom_desconto: couponData.code,
        desconto_valor: discountValue
      })
    })

    return new Response(JSON.stringify({ invoiceUrl: invoiceUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Error in create-checkout:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
