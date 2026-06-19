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

export function parseOFX(content: string): ParsedStatement {
  const entries: BankStatementEntry[] = []

  let balance: number | undefined
  const balMatch = /<BALAMT>([^\s<]+)/.exec(content)
  if (balMatch) {
    balance = parseFloat(balMatch[1].replace(',', '.'))
  }
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
  let match

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const trn = match[1]

    // Extract TRNAMT
    const amtMatch = /<TRNAMT>([^\s<]+)/.exec(trn)
    const amount = amtMatch ? parseFloat(amtMatch[1]) : 0

    // Extract DTPOSTED
    const dtMatch = /<DTPOSTED>([0-9]{8})/.exec(trn)
    let date = new Date()
    if (dtMatch) {
      const dStr = dtMatch[1]
      date = new Date(
        parseInt(dStr.substring(0, 4)),
        parseInt(dStr.substring(4, 6)) - 1,
        parseInt(dStr.substring(6, 8)),
      )
    }

    // Extract MEMO
    const memoMatch = /<MEMO>(.*?)($|<)/.exec(trn)
    const description = memoMatch ? memoMatch[1].trim() : 'Sem descrição'

    // Extract FITID (id)
    const fitidMatch = /<FITID>([^\s<]+)/.exec(trn)
    const id = fitidMatch
      ? fitidMatch[1]
      : Math.random().toString(36).substring(7)

    entries.push({ id, date, amount, description })
  }

  return {
    entries: entries.sort((a, b) => a.date.getTime() - b.date.getTime()),
    balance,
  }
}

export function parseCSV(content: string): ParsedStatement {
  const lines = content.split('\n')
  const entries: BankStatementEntry[] = []

  let separator = ','
  const firstLines = lines.slice(0, 10).join('\n')
  if (
    firstLines.includes(';') &&
    firstLines.split(';').length > firstLines.split(',').length
  ) {
    separator = ';'
  }

  let startIndex = 0
  let dateIdx = 0
  let amountIdx = 1
  let descIdx = 2

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase()
    if (lower.includes('data') || lower.includes('date')) {
      startIndex = i + 1
      const headerParts = lower.split(separator).map((s) => s.trim())

      const foundDate = headerParts.findIndex(
        (p) => p.includes('data') || p.includes('date'),
      )
      const foundDesc = headerParts.findIndex(
        (p) =>
          p.includes('descri') ||
          p.includes('historico') ||
          p.includes('detail'),
      )
      const foundAmt = headerParts.findIndex(
        (p) => p.includes('valor') || p.includes('amount'),
      )

      if (foundDate !== -1) dateIdx = foundDate
      if (foundDesc !== -1) descIdx = foundDesc
      if (foundAmt !== -1) amountIdx = foundAmt
      break
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    let parts: string[] = []
    if (separator === ';') {
      parts = line.split(';')
    } else {
      let current = ''
      let inQuotes = false
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (
          char === '"' &&
          (j === 0 || line[j - 1] === separator || inQuotes)
        ) {
          inQuotes = !inQuotes
        } else if (char === separator && !inQuotes) {
          parts.push(current)
          current = ''
        } else {
          current += char
        }
      }
      parts.push(current)
    }

    if (parts.length >= Math.max(dateIdx, amountIdx, descIdx) + 1) {
      const datePart = parts[dateIdx].trim()
      let date: Date | null = null

      const dateRegexBr = /^(\d{2})\/(\d{2})\/(\d{4})$/
      const matchBr = datePart.match(dateRegexBr)
      if (matchBr) {
        date = new Date(
          Number(matchBr[3]),
          Number(matchBr[2]) - 1,
          Number(matchBr[1]),
          12,
          0,
          0,
        )
      } else {
        const parsed = new Date(datePart + 'T12:00:00')
        if (!isNaN(parsed.getTime())) {
          date = parsed
        } else {
          const parsed2 = new Date(datePart)
          if (!isNaN(parsed2.getTime())) date = parsed2
        }
      }

      if (!date || isNaN(date.getTime())) continue

      const description = parts[descIdx].trim().replace(/^"|"$/g, '')

      const amountPart = parts[amountIdx].trim()
      let cleanAmount = amountPart.replace(/[R$\s]/g, '')

      if (cleanAmount.lastIndexOf(',') > cleanAmount.lastIndexOf('.')) {
        cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.')
      } else {
        cleanAmount = cleanAmount.replace(/,/g, '')
      }

      const amount = parseFloat(cleanAmount)
      if (isNaN(amount)) continue

      entries.push({
        id: Math.random().toString(36).substring(7),
        date,
        amount,
        description,
      })
    }
  }

  return {
    entries: entries.sort((a, b) => a.date.getTime() - b.date.getTime()),
  }
}
