export enum TipoTransacao {
  Receita = 'Receita',
  Despesa = 'Despesa',
}

export enum FormaPagamento {
  CartaoCredito = 'Cartão de Crédito',
  CartaoDebito = 'Cartão de Débito',
  Dinheiro = 'Dinheiro',
  Pix = 'Pix',
  Boleto = 'Boleto',
  Transferencia = 'Transferência Bancária',
}

export type Role = 'admin' | 'colaborador' | 'visitante'

export interface Categoria {
  id: string
  nome: string
  tipo: string
  grupo: string
  natureza_contabil?: string
  efeito_caixa?: string
  accounting_group?: string
}

export interface Transacao {
  id: string
  data: Date
  descricao: string
  valor: number
  categoria_id: string
  tipo_id: TipoTransacao
  forma_pagamento_id: FormaPagamento
  observacoes?: string
  recurring_transaction_id?: string | null
  is_recurring?: boolean
  parcelas?: number
  status?: string
}
