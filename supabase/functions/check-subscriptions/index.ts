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
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error: trialError } = await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('status', 'trial')
      .lt('trial_end', new Date().toISOString())

    if (trialError) console.error('Error updating trials:', trialError)

    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString())

    if (subError) console.error('Error updating subs:', subError)

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error checking subscriptions:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
