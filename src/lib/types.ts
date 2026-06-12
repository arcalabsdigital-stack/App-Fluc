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

export interface CategoriaSimplificada {
  id: string
  organization_id?: string
  nome_simplificado: string
  tipo_grupo: string
  natureza_contabil: string
  efeito_caixa: string
  accounting_group: string
  icon?: string | null
  color?: string | null
}

export interface DicaContextual {
  id: string
  categoria_simplificada_id: string
  titulo: string
  descricao: string
}

export interface DicaLida {
  id: string
  dica_id: string
}

export interface Transacao {
  id: string
  data: Date
  descricao: string
  valor: number
  amount_paid?: number
  categoria_id: string
  tipo_id: TipoTransacao
  forma_pagamento_id: FormaPagamento
  observacoes?: string
  recurring_transaction_id?: string | null
  is_recurring?: boolean
  parcelas?: number
  status?: string
  account_id?: string | null
  is_conciliated?: boolean
}

export interface Conta {
  id: string
  organization_id: string
  nome: string
  tipo: string
  saldo_inicial: number
  data_saldo_inicial: string
  is_active: boolean
  saldo_atual?: number
}
