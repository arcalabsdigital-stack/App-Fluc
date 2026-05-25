import { Transacao } from './types'
import { format } from 'date-fns'

export function exportToCSV(transactions: Transacao[]) {
  const headers = [
    'Data',
    'Descrição',
    'Categoria',
    'Tipo',
    'Valor',
    'Forma de Pagamento',
    'Observações',
  ]
  const rows = transactions.map((t) => [
    format(new Date(t.data), 'dd/MM/yyyy'),
    t.descricao,
    t.categoria_id,
    t.tipo_id,
    t.valor.toString(),
    t.forma_pagamento_id,
    t.observacoes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((field) => {
          const str = String(field || '')
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToExcel(transactions: Transacao[]) {
  const headers = [
    'Data',
    'Descrição',
    'Categoria',
    'Tipo',
    'Valor',
    'Forma de Pagamento',
    'Status',
    'Observações',
  ]
  let table =
    '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><thead><tr>' +
    headers
      .map(
        (h) =>
          `<th style="background-color: #f3f4f6; font-weight: bold;">${h}</th>`,
      )
      .join('') +
    '</tr></thead><tbody>'

  transactions.forEach((t) => {
    table +=
      '<tr>' +
      [
        format(new Date(t.data), 'dd/MM/yyyy'),
        t.descricao,
        t.categoria_id,
        t.tipo_id,
        t.valor.toFixed(2).replace('.', ','),
        t.forma_pagamento_id,
        t.status || 'pago',
        t.observacoes || '',
      ]
        .map((v) => `<td>${v}</td>`)
        .join('') +
      '</tr>'
  })
  table += '</tbody></table></body></html>'

  const blob = new Blob([table], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `transacoes_${format(new Date(), 'yyyy-MM-dd')}.xls`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToPDF(transactions: Transacao[]) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  let html = `
    <html>
      <head>
        <title>Relatório de Transações</title>
        <style>
          body { font-family: sans-serif; color: #333; padding: 20px; }
          h2 { color: #111; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f9fafb; font-weight: bold; color: #111; }
          .val-receita { color: #16a34a; }
          .val-despesa { color: #dc2626; }
        </style>
      </head>
      <body>
        <h2>Relatório de Transações</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Valor (R$)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
  `

  transactions.forEach((t) => {
    const valClass = t.tipo_id === 'Receita' ? 'val-receita' : 'val-despesa'
    const sign = t.tipo_id === 'Despesa' ? '-' : '+'
    html += `
      <tr>
        <td>${format(new Date(t.data), 'dd/MM/yyyy')}</td>
        <td>${t.descricao}</td>
        <td>${t.categoria_id}</td>
        <td>${t.tipo_id}</td>
        <td class="${valClass}"><strong>${sign} ${t.valor.toFixed(2)}</strong></td>
        <td>${t.status || 'pago'}</td>
      </tr>
    `
  })

  html += `</tbody></table></body></html>`

  doc.open()
  doc.write(html)
  doc.close()

  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 2000)
  }
}
