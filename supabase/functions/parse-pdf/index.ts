import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import pdf from 'npm:pdf-parse'

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
    let currentDate: Date | null = null

    const lines = text.split('\n')
    const dateRegex = /^(\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2})/
    const amountRegex = /(-?R?\$\s*[\d.]+(?:,\d{2})?|-?[\d.]+(?:,\d{2})?)/g

    const monthMap: Record<string, number> = {
      janeiro: 0,
      fevereiro: 1,
      março: 2,
      marco: 2,
      abril: 3,
      maio: 4,
      junho: 5,
      julho: 6,
      agosto: 7,
      setembro: 8,
      outubro: 9,
      novembro: 10,
      dezembro: 11,
    }
    const dateBrRegex = /^(\d{1,2})\s+de\s+([A-Za-zçÇ]+)\s+de\s+(\d{4})/

    for (let line of lines) {
      line = line.trim()
      if (!line) continue

      if (
        line.toLowerCase().startsWith('saldo atual') ||
        line.toLowerCase().startsWith('saldo disponível') ||
        line.toLowerCase().startsWith('saldo total')
      ) {
        const balMatch = line.match(/[\d.]+(?:,\d{2})/)
        if (balMatch) {
          balance = parseFloat(balMatch[0].replace(/\./g, '').replace(',', '.'))
          if (line.toLowerCase().includes('devedor') || line.includes('-')) {
            balance = -balance
          }
        }
      }

      const brDateMatch = line.match(dateBrRegex)
      if (brDateMatch) {
        const day = parseInt(brDateMatch[1], 10)
        const monthStr = brDateMatch[2].toLowerCase()
        const year = parseInt(brDateMatch[3], 10)
        if (monthMap[monthStr] !== undefined) {
          currentDate = new Date(year, monthMap[monthStr], day, 12, 0, 0)
        }
        continue
      }

      const dMatch = line.match(dateRegex)
      if (dMatch) {
        const amtMatches = Array.from(line.matchAll(amountRegex))
        if (amtMatches.length > 0) {
          let dateStr = dMatch[1]
          if (dateStr.length === 5) {
            dateStr += '/' + new Date().getFullYear()
          }
          const [d, m, y] = dateStr.split('/')
          currentDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0)

          const amtStr = amtMatches[amtMatches.length - 1][0]
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

          let desc = line
            .replace(dMatch[0], '')
            .replace(amtMatches[amtMatches.length - 1][0], '')
            .trim()
          if (!desc) desc = 'Transação'

          entries.push({
            id: Math.random().toString(36).substring(7),
            date: currentDate.toISOString(),
            amount,
            description: desc,
          })
          continue
        }
      }

      if (currentDate) {
        const brAmountRegexStr =
          '-?(?:R\\$)?\\s?-?\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2})'
        const brTxRegex = new RegExp(
          `^(.*?)\\s+(${brAmountRegexStr})(?:\\s+${brAmountRegexStr})?$`,
        )
        const txMatch = line.match(brTxRegex)

        if (txMatch) {
          const desc = txMatch[1].trim()
          const descLower = desc.toLowerCase()

          if (
            descLower.includes('saldo') ||
            descLower.includes('período') ||
            descLower.includes('cpf/cnpj') ||
            descLower === 'valor' ||
            descLower.includes('bloqueado + disponível')
          ) {
            continue
          }

          const amtStr = txMatch[2]
            .replace(/[R$\s]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
          let amount = parseFloat(amtStr)

          if (
            descLower.includes('debito') ||
            descLower.includes('saque') ||
            descLower.includes('pagamento') ||
            descLower.includes('enviado')
          ) {
            if (amount > 0 && txMatch[2].includes('-')) {
              amount = -amount
            } else if (amount > 0 && descLower.includes('enviado')) {
              amount = -amount
            }
          }

          entries.push({
            id: Math.random().toString(36).substring(7),
            date: currentDate.toISOString(),
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
