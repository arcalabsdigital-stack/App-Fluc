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
  // Simple CSV parser for demonstration (Date, Amount, Description)
  const lines = content.split('\n')
  const entries: BankStatementEntry[] = []

  // Skip header if obvious
  let startIndex = 0
  if (
    lines[0] &&
    (lines[0].toLowerCase().includes('data') ||
      lines[0].toLowerCase().includes('date'))
  ) {
    startIndex = 1
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(',')
    if (parts.length >= 3) {
      // Assuming DD/MM/YYYY or YYYY-MM-DD
      const datePart = parts[0].trim()
      let date = new Date()
      if (datePart.includes('/')) {
        const [d, m, y] = datePart.split('/')
        date = new Date(Number(y), Number(m) - 1, Number(d))
      } else {
        date = new Date(datePart)
      }

      const amountPart = parts[1]
        .trim()
        .replace('R$', '')
        .replace(/\./g, '')
        .replace(',', '.')
      const amount = parseFloat(amountPart)

      const description = parts.slice(2).join(',').trim()

      entries.push({
        id: Math.random().toString(36).substring(7),
        date,
        amount: isNaN(amount) ? 0 : amount,
        description,
      })
    }
  }

  return {
    entries: entries.sort((a, b) => a.date.getTime() - b.date.getTime()),
  }
}
