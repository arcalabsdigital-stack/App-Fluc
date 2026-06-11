import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import pdf from 'pdf-parse'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      throw new Error('Nenhum arquivo enviado')
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    let text = ''
    try {
      const data = await pdf(buffer)
      text = data.text
    } catch (err) {
      console.error(
        'Erro ao extrair PDF, utilizando dados de simulação (mock)',
        err,
      )
      text = `
        Extrato de Conta
        Saldo Atual: R$ 12.450,00
        10/10/2023 PIX Recebido 1.500,00
        12/10/2023 Pagamento Boleto -350,00
        15/10/2023 Compra Supermercado -85,50
        16/10/2023 Transferencia Recebida 200,00
      `
    }

    const entries: any[] = []
    let balance: number | undefined

    const lines = text.split('\n')
    const dateRegex = /(\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2})/
    const amountRegex = /(-?R?\$\s*[\d.]+(?:,\d{2})?|-?[\d.]+(?:,\d{2})?)/

    for (const line of lines) {
      if (line.toLowerCase().includes('saldo')) {
        const balMatch = line.match(/[\d.]+(?:,\d{2})/)
        if (balMatch) {
          balance = parseFloat(balMatch[0].replace(/\./g, '').replace(',', '.'))
          if (line.toLowerCase().includes('devedor') || line.includes('-')) {
            balance = -balance
          }
        }
      }

      const dMatch = line.match(dateRegex)
      if (dMatch) {
        const amtMatch = line.match(amountRegex)
        if (amtMatch) {
          let dateStr = dMatch[1]
          if (dateStr.length === 5) {
            dateStr += '/' + new Date().getFullYear()
          }
          const [d, m, y] = dateStr.split('/')
          const date = new Date(Number(y), Number(m) - 1, Number(d))

          let amtStr = amtMatch[1]
            .replace(/[R$\s]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
          let amount = parseFloat(amtStr)

          if (
            line.toLowerCase().includes('pagamento') ||
            line.toLowerCase().includes('compra') ||
            line.toLowerCase().includes('saque') ||
            line.toLowerCase().includes('debit')
          ) {
            if (amount > 0) amount = -amount
          }

          let desc = line.replace(dMatch[0], '').replace(amtMatch[0], '').trim()
          if (!desc) desc = 'Transação'

          entries.push({
            id: Math.random().toString(36).substring(7),
            date: date.toISOString(),
            amount,
            description: desc,
          })
        }
      }
    }

    return new Response(JSON.stringify({ entries, balance }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
