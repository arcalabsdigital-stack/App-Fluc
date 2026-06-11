import { create } from 'zustand'
import { Transacao, Categoria } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
import { transactionService } from '@/services/transactionService'
import { ReactNode, useEffect } from 'react'
import { FilterState } from '@/components/transactions/TransactionFilters'

import { CategoriaSimplificada, DicaContextual } from '@/lib/types'

interface TransactionStore {
  transactions: Transacao[]
  categories: Categoria[]
  categoriasSimplificadas: CategoriaSimplificada[]
  dicas: DicaContextual[]
  dicasLidas: string[]
  isLoading: boolean
  fetchCategories: () => Promise<void>
  fetchTransactions: (filters: FilterState, role: string) => Promise<void>
  addTransaction: (t: Omit<Transacao, 'id'>) => Promise<void>
  updateTransaction: (id: string, t: Partial<Transacao>) => Promise<void>
  updateTransactionScope: (
    id: string,
    t: Partial<Transacao>,
    scope: string,
  ) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  registerPayment: (id: string, amount: number) => Promise<void>
  addCategoriaSimplificada: (
    cat: Partial<CategoriaSimplificada>,
  ) => Promise<CategoriaSimplificada | null>
  markDicaLida: (dicaId: string) => Promise<void>
}

const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  categories: [],
  categoriasSimplificadas: [],
  dicas: [],
  dicasLidas: [],
  isLoading: false,
  fetchCategories: async () => {
    const [
      { data: categories },
      { data: catSimp },
      { data: dicas },
      { data: lidas },
    ] = await Promise.all([
      supabase.from('categories').select('*').order('grupo').order('nome'),
      supabase
        .from('categoria_simplificada')
        .select('*')
        .order('nome_simplificado'),
      supabase.from('dicas_contextuais').select('*'),
      supabase.from('dicas_lidas').select('dica_id'),
    ])

    set({
      categories: (categories || []) as Categoria[],
      categoriasSimplificadas: (catSimp || []) as CategoriaSimplificada[],
      dicas: (dicas || []) as DicaContextual[],
      dicasLidas: (lidas || []).map((l) => l.dica_id),
    })
  },
  addCategoriaSimplificada: async (cat) => {
    const { data: orgIdRes } = await supabase.rpc('get_current_user_org_id')
    const { data, error } = await supabase
      .from('categoria_simplificada')
      .insert({
        ...cat,
        organization_id: orgIdRes,
        criada_por_usuario: true,
        permite_customizacao: true,
      })
      .select()
      .single()

    if (data) {
      set((state) => ({
        categoriasSimplificadas: [...state.categoriasSimplificadas, data],
      }))
      return data as CategoriaSimplificada
    }
    return null
  },
  markDicaLida: async (dicaId) => {
    const { data: orgIdRes } = await supabase.rpc('get_current_user_org_id')
    await supabase
      .from('dicas_lidas')
      .insert({ organization_id: orgIdRes, dica_id: dicaId })
    set((state) => ({ dicasLidas: [...state.dicasLidas, dicaId] }))
  },
  fetchTransactions: async (filters, role) => {
    set({ isLoading: true })
    try {
      const data = await transactionService.fetchTransactions(
        filters,
        role as any,
      )
      set({ transactions: data })
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  addTransaction: async (transaction) => {
    const newT = await transactionService.createTransaction(transaction)
    set((state) => ({ transactions: [newT, ...state.transactions] }))
  },
  updateTransaction: async (id, transaction) => {
    const updated = await transactionService.updateTransaction(id, transaction)
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
    }))
  },
  updateTransactionScope: async (id, transaction, scope) => {
    await transactionService.updateTransactionScope(id, transaction, scope)
  },
  deleteTransaction: async (id) => {
    await transactionService.deleteTransaction(id)
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }))
  },
  registerPayment: async (id, amount) => {
    const result = await transactionService.registerPayment(id, amount)
    const oldId = (result as any).oldId
    delete (result as any).oldId
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === oldId ? result : t,
      ),
    }))
  },
}))

export function TransactionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    useTransactionStore.getState().fetchCategories()
  }, [])
  return <>{children}</>
}

export default useTransactionStore
