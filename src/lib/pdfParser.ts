import * as pdfjsLib from 'pdfjs-dist'

// Setup worker dynamically using the correct version from the CDN
const version = pdfjsLib.version || '3.11.174'
const isV4 = version.startsWith('4')
const ext = isV4 ? 'mjs' : 'js'
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.${ext}`

export interface BankStatementEntry {
  id: string
  date: Date
  amount: number
  description: string
}

export interface ParsedStatement {
  entries: BankStatementEntry[]
  balance?: number
}

export async function parseBancoInterPDF(
  arrayBuffer: ArrayBuffer,
): Promise<ParsedStatement> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  const entries: BankStatementEntry[] = []
  let balance: number | undefined

  const ptBRMonths: Record<string, number> = {
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

  let currentDate: Date | null = null

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    const rows = new Map<number, any[]>()

    for (const item of textContent.items) {
      if ('str' in item && 'transform' in item && item.str.trim() !== '') {
        const y = Math.round(item.transform[5])
        let foundY = y
        for (const existingY of rows.keys()) {
          if (Math.abs(existingY - y) <= 4) {
            foundY = existingY
            break
          }
        }

        if (!rows.has(foundY)) {
          rows.set(foundY, [])
        }
        rows.get(foundY)!.push(item)
      }
    }

    const sortedY = Array.from(rows.keys()).sort((a, b) => b - a)

    for (const y of sortedY) {
      const rowItems = rows.get(y)!
      rowItems.sort((a, b) => a.transform[4] - b.transform[4])

      let lineStr = ''
      for (let i = 0; i < rowItems.length; i++) {
        const item = rowItems[i]
        lineStr += item.str
        if (i < rowItems.length - 1) {
          const nextItem = rowItems[i + 1]
          const dist = nextItem.transform[4] - (item.transform[4] + item.width)
          if (dist > 3) {
            lineStr += ' '
          }
        }
      }

      lineStr = lineStr.replace(/\s+/g, ' ').trim()

      const dateHeaderMatch = lineStr.match(
        /^(\d{1,2})\s+de\s+([a-zA-ZçÇ]+)(?:\s+de\s+(\d{4}))?/i,
      )
      if (dateHeaderMatch) {
        const day = parseInt(dateHeaderMatch[1], 10)
        const monthStr = dateHeaderMatch[2].toLowerCase()
        const month = ptBRMonths[monthStr] ?? 0
        const year = dateHeaderMatch[3]
          ? parseInt(dateHeaderMatch[3], 10)
          : new Date().getFullYear()
        currentDate = new Date(year, month, day, 12, 0, 0)
        continue
      }

      const legacyMatch = lineStr.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/)
      let processingLine = lineStr
      if (legacyMatch) {
        const dateStr = legacyMatch[1]
        processingLine = legacyMatch[2]

        const [day, month, year] = dateStr.split('/')
        currentDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          12,
          0,
          0,
        )
      }

      if (currentDate && processingLine) {
        const upperRest = processingLine.toUpperCase()
        if (
          upperRest.includes('SALDO ANTERIOR') ||
          upperRest.includes('SALDO DO DIA') ||
          upperRest.includes('SALDO FINAL') ||
          upperRest.includes('SALDO BLOQUEADO') ||
          upperRest.includes('SOMA DAS ENTRADAS') ||
          upperRest.includes('SOMA DAS SAÍDAS') ||
          upperRest.includes('SALDO EM CONTA') ||
          upperRest.includes('TOTAL') ||
          processingLine.trim() === ''
        ) {
          continue
        }

        const specificCurrencyRegex = /(-?R\$)\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi
        const specificMatches = [
          ...processingLine.matchAll(specificCurrencyRegex),
        ]

        let amountStr = ''
        let isNegative = false
        let matchedFullStr = ''

        if (specificMatches.length >= 1) {
          matchedFullStr = specificMatches[0][0]
          isNegative = specificMatches[0][1].includes('-')
          amountStr = specificMatches[0][2]

          if (specificMatches.length >= 2) {
            const balStr = specificMatches[specificMatches.length - 1][2]
              .replace(/\./g, '')
              .replace(',', '.')
            const parsedBal = parseFloat(balStr)
            if (!isNaN(parsedBal)) balance = parsedBal
          }
        } else {
          const genericCurrencyRegex =
            /(?:-\s*)?\b\d{1,3}(?:\.\d{3})*,\d{2}(?!\d)/g
          const currencies = processingLine.match(genericCurrencyRegex)

          if (currencies && currencies.length >= 1) {
            if (currencies.length >= 2) {
              amountStr = currencies[currencies.length - 2]
              const balStr = currencies[currencies.length - 1]
                .replace(/\s/g, '')
                .replace(/\./g, '')
                .replace(',', '.')
              const parsedBal = parseFloat(balStr)
              if (!isNaN(parsedBal)) balance = parsedBal
            } else {
              amountStr = currencies[0]
            }
            matchedFullStr = amountStr
            isNegative = amountStr.includes('-')
          }
        }

        if (amountStr) {
          const descEndIdx = processingLine.indexOf(matchedFullStr)
          let desc = processingLine
          if (descEndIdx > 0) {
            desc = processingLine.substring(0, descEndIdx).trim()
          } else {
            desc = processingLine.replace(matchedFullStr, '').trim()
          }

          const cleanAmountStr = amountStr
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.')

          let amount = parseFloat(cleanAmountStr)
          if (isNegative) {
            amount = -Math.abs(amount)
          } else {
            amount = Math.abs(amount)
          }

          if (desc && desc !== '-' && desc !== 'R$') {
            entries.push({
              id: Math.random().toString(36).substring(7),
              date: new Date(currentDate.getTime()),
              description: desc || 'Transação',
              amount,
            })
          }
        }
      }
    }
  }

  if (entries.length === 0) {
    throw new Error('Nenhuma transação válida encontrada no PDF.')
  }

  return {
    entries: entries.sort((a, b) => a.date.getTime() - b.date.getTime()),
    balance,
  }
}
