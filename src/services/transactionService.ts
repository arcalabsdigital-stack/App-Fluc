import { supabase } from '@/lib/supabase/client'
import { FilterState } from '@/components/transactions/TransactionFilters'
import { Transacao, TipoTransacao, FormaPagamento, Role } from '@/lib/types'
import { extractUUID } from '@/lib/utils'
import {
  format,
  addMonths,
  addDays,
  addYears,
  isSameMonth,
  isSameDay,
} from 'date-fns'

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date()
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
}

// Helper to map DB row to Transacao type
const mapToTransacao = (row: any): Transacao => ({
  id: row.id,
  data: parseLocalDate(row.date),
  descricao: row.description,
  valor: Number(row.amount),
  amount_paid: Number(row.amount_paid || 0),
  categoria_id: row.category,
  tipo_id: row.type as TipoTransacao,
  forma_pagamento_id: row.payment_method as FormaPagamento,
  observacoes: row.notes,
  recurring_transaction_id: row.recurring_transaction_id,
  is_recurring: !!row.recurring_transaction_id,
  status: row.status,
  account_id: row.account_id,
  is_conciliated: row.is_conciliated,
})

// Helper to map Transacao to DB row
const mapToRow = (transaction: Omit<Transacao, 'id'>, userId: string) => ({
  user_id: userId,
  date: format(transaction.data, 'yyyy-MM-dd'),
  description: transaction.descricao,
  amount: transaction.valor,
  amount_paid: transaction.amount_paid || 0,
  category: (transaction as any).categoria_id || (transaction as any).category,
  type: transaction.tipo_id,
  payment_method: transaction.forma_pagamento_id,
  notes: transaction.observacoes,
  recurring_transaction_id: transaction.recurring_transaction_id,
  status: transaction.status || 'aberto',
  account_id: transaction.account_id || null,
  is_conciliated:
    transaction.is_conciliated !== undefined
      ? transaction.is_conciliated
      : false,
})

export const transactionService = {
  async fetchTransactions(filters: FilterState, role: Role) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Initial query
    let query = supabase.from('transactions').select('*')

    // Apply filters based on Role and FilterState
    if (role === 'visitante') {
      // Visitor should not see anything (RLS handles this too, but explicit return saves a call)
      return []
    }

    if (role === 'colaborador') {
      // Collaborator restricted view: Single most recent transaction.
      // RLS enforces this, but we explicitly order and limit to match application logic expectations.
      // We add ID sort to ensure deterministic behavior matching the RLS policy.
      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(1)
    }

    if (role === 'admin') {
      // Admin sees all, applies filters
      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`)
      }

      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      if (filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      if (filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod)
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.dateRange?.from) {
        query = query.gte('date', format(filters.dateRange.from, 'yyyy-MM-dd'))
        if (filters.dateRange.to) {
          query = query.lte('date', format(filters.dateRange.to, 'yyyy-MM-dd'))
        }
      }

      // Default sort by date desc for full list
      query = query.order('date', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }

    let transactions = data.map(mapToTransacao)

    if (role === 'admin') {
      let recQuery = supabase.from('recurring_transactions').select('*')
      if (filters.search)
        recQuery = recQuery.ilike('description', `%${filters.search}%`)
      if (filters.type !== 'all') recQuery = recQuery.eq('type', filters.type)
      if (filters.category !== 'all')
        recQuery = recQuery.eq('category', filters.category)
      if (filters.paymentMethod !== 'all')
        recQuery = recQuery.eq('payment_method', filters.paymentMethod)

      const { data: recData } = await recQuery

      if (recData && recData.length > 0) {
        const projected: Transacao[] = []
        const now = new Date()
        const ninetyDays = addDays(now, 90)

        for (const rec of recData) {
          let currDate = parseLocalDate(rec.next_date)

          while (currDate <= ninetyDays) {
            let exists = false
            if (rec.frequency === 'monthly') {
              exists = transactions.some(
                (t) =>
                  t.recurring_transaction_id === rec.id &&
                  isSameMonth(t.data, currDate),
              )
            } else {
              exists = transactions.some(
                (t) =>
                  t.recurring_transaction_id === rec.id &&
                  isSameDay(t.data, currDate),
              )
            }

            if (!exists) {
              projected.push({
                id: `proj_${rec.id}_${format(currDate, 'yyyy-MM-dd')}`,
                data: currDate,
                descricao: rec.description,
                valor: Number(rec.amount),
                amount_paid: 0,
                categoria_id: rec.category,
                tipo_id: rec.type as TipoTransacao,
                forma_pagamento_id: rec.payment_method as FormaPagamento,
                observacoes: rec.notes || '',
                recurring_transaction_id: rec.id,
                is_recurring: true,
                status: 'aberto',
              })
            }

            if (rec.frequency === 'monthly') currDate = addMonths(currDate, 1)
            else if (rec.frequency === 'weekly') currDate = addDays(currDate, 7)
            else if (rec.frequency === 'yearly')
              currDate = addYears(currDate, 1)
            else break
          }
        }

        let filteredProjected = projected
        if (filters.status && filters.status !== 'all') {
          filteredProjected = filteredProjected.filter(
            (p) => p.status === filters.status,
          )
        }
        if (filters.dateRange?.from) {
          const from = filters.dateRange.from
          const to = filters.dateRange.to || from
          filteredProjected = filteredProjected.filter(
            (p) => p.data >= from && p.data <= to,
          )
        }

        transactions = [...transactions, ...filteredProjected]
        transactions.sort((a, b) => b.data.getTime() - a.data.getTime())
      }
    }

    return transactions
  },

  async updateTransactionScope(
    id: string,
    transaction: Partial<Transacao>,
    scope: string,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isProj = id.startsWith('proj_')

    if (scope === 'só esta') {
      if (isProj) {
        const { id: _, ...txWithoutId } = transaction as any
        return await this.createTransaction({
          ...txWithoutId,
          data: transaction.data!,
          is_recurring: false,
          recurring_transaction_id: transaction.recurring_transaction_id,
        })
      } else {
        return await this.updateTransaction(id, transaction)
      }
    } else if (scope === 'esta e as futuras' || scope === 'toda a série') {
      let recurringId = transaction.recurring_transaction_id

      if (!recurringId && !isProj) {
        return await this.updateTransaction(id, transaction)
      }

      await supabase
        .from('recurring_transactions')
        .update({
          description: transaction.descricao,
          amount: transaction.valor,
          category:
            (transaction as any).categoria_id || (transaction as any).category,
          type: transaction.tipo_id,
          payment_method: transaction.forma_pagamento_id,
          notes: transaction.observacoes,
        })
        .eq('id', recurringId)

      let query = supabase
        .from('transactions')
        .update({
          description: transaction.descricao,
          amount: transaction.valor,
          category:
            (transaction as any).categoria_id || (transaction as any).category,
          type: transaction.tipo_id,
          payment_method: transaction.forma_pagamento_id,
          notes: transaction.observacoes,
        })
        .eq('recurring_transaction_id', recurringId)

      if (scope === 'esta e as futuras') {
        query = query.gte(
          'date',
          format(transaction.data || new Date(), 'yyyy-MM-dd'),
        )
      }

      await query

      if (
        !isProj &&
        (transaction.status ||
          transaction.is_conciliated !== undefined ||
          transaction.account_id !== undefined)
      ) {
        const updates: any = {}
        if (transaction.status) updates.status = transaction.status
        if (transaction.is_conciliated !== undefined)
          updates.is_conciliated = transaction.is_conciliated
        if (transaction.account_id !== undefined)
          updates.account_id = transaction.account_id

        if (Object.keys(updates).length > 0) {
          await supabase.from('transactions').update(updates).eq('id', id)
        }
      } else if (isProj && transaction.status === 'pago') {
        const { id: _, ...txWithoutId } = transaction as any
        await this.createTransaction({
          ...txWithoutId,
          data: transaction.data!,
          is_recurring: false,
          recurring_transaction_id: recurringId,
          status: 'pago',
        })
      }
      return null
    }
  },

  async createTransaction(transaction: Omit<Transacao, 'id'>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const parcelas = transaction.parcelas || 1

    if (parcelas > 1 && !transaction.is_recurring) {
      const amountPerInstallment = Number(
        (transaction.valor / parcelas).toFixed(2),
      )
      const remainder = Number(
        (transaction.valor - amountPerInstallment * parcelas).toFixed(2),
      )

      const rowsToInsert = Array.from({ length: parcelas }).map((_, i) => {
        const installmentDate = addMonths(transaction.data, i)
        const isLast = i === parcelas - 1
        const installmentAmount =
          amountPerInstallment + (isLast ? remainder : 0)

        return {
          ...mapToRow(
            {
              ...transaction,
              data: installmentDate,
              descricao: `${transaction.descricao} (Parcela ${i + 1}/${parcelas})`,
              valor: installmentAmount,
            },
            user.id,
          ),
          recurring_transaction_id: null,
        }
      })

      const { data, error } = await supabase
        .from('transactions')
        .insert(rowsToInsert)
        .select()

      if (error) throw error
      return mapToTransacao(data[0])
    }

    let recurringId = null

    if (transaction.is_recurring) {
      const nextDate = addMonths(transaction.data, 1)

      const { data: recData, error: recError } = await supabase
        .from('recurring_transactions')
        .insert({
          user_id: user.id,
          description: transaction.descricao,
          amount: transaction.valor,
          category:
            (transaction as any).categoria_id || (transaction as any).category,
          type: transaction.tipo_id,
          payment_method: transaction.forma_pagamento_id,
          frequency: 'monthly',
          start_date: format(transaction.data, 'yyyy-MM-dd'),
          next_date: format(nextDate, 'yyyy-MM-dd'),
          notes: transaction.observacoes,
        })
        .select()
        .single()

      if (recError) throw recError
      recurringId = recData.id
    }

    const dbRow = {
      ...mapToRow(transaction, user.id),
      recurring_transaction_id: recurringId,
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(dbRow)
      .select()
      .single()

    if (error) throw error
    return mapToTransacao(data)
  },

  async updateTransaction(id: string, transaction: Partial<Transacao>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: existingTx, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    let recurringId = existingTx.recurring_transaction_id
    const isCurrentlyRecurring = !!recurringId

    if (transaction.is_recurring !== undefined) {
      const wantsToBeRecurring = transaction.is_recurring

      if (wantsToBeRecurring && !isCurrentlyRecurring) {
        const startDate = transaction.data || parseLocalDate(existingTx.date)
        const nextDate = addMonths(startDate, 1)

        const { data: recData, error: recError } = await supabase
          .from('recurring_transactions')
          .insert({
            user_id: user.id,
            description: transaction.descricao || existingTx.description,
            amount: transaction.valor || existingTx.amount,
            category:
              (transaction as any).categoria_id ||
              (transaction as any).category ||
              existingTx.category,
            type: transaction.tipo_id || existingTx.type,
            payment_method:
              transaction.forma_pagamento_id || existingTx.payment_method,
            frequency: 'monthly',
            start_date: format(startDate, 'yyyy-MM-dd'),
            next_date: format(nextDate, 'yyyy-MM-dd'),
            notes:
              transaction.observacoes !== undefined
                ? transaction.observacoes
                : existingTx.notes,
          })
          .select()
          .single()
        if (recError) throw recError
        recurringId = recData.id
      } else if (!wantsToBeRecurring && isCurrentlyRecurring) {
        await supabase
          .from('recurring_transactions')
          .delete()
          .eq('id', recurringId)
        recurringId = null
      } else if (wantsToBeRecurring && isCurrentlyRecurring) {
        await supabase
          .from('recurring_transactions')
          .update({
            description: transaction.descricao || existingTx.description,
            amount: transaction.valor || existingTx.amount,
            category:
              (transaction as any).categoria_id ||
              (transaction as any).category ||
              existingTx.category,
            type: transaction.tipo_id || existingTx.type,
            payment_method:
              transaction.forma_pagamento_id || existingTx.payment_method,
            notes:
              transaction.observacoes !== undefined
                ? transaction.observacoes
                : existingTx.notes,
          })
          .eq('id', recurringId)
      }
    } else if (isCurrentlyRecurring) {
      await supabase
        .from('recurring_transactions')
        .update({
          description: transaction.descricao || existingTx.description,
          amount: transaction.valor || existingTx.amount,
          category:
            (transaction as any).categoria_id ||
            (transaction as any).category ||
            existingTx.category,
          type: transaction.tipo_id || existingTx.type,
          payment_method:
            transaction.forma_pagamento_id || existingTx.payment_method,
          notes:
            transaction.observacoes !== undefined
              ? transaction.observacoes
              : existingTx.notes,
        })
        .eq('id', recurringId)
    }

    const updates: any = {
      recurring_transaction_id: recurringId,
    }
    if (transaction.data) updates.date = format(transaction.data, 'yyyy-MM-dd')
    if (transaction.descricao) updates.description = transaction.descricao
    if (transaction.valor) updates.amount = transaction.valor

    const cat =
      (transaction as any).categoria_id || (transaction as any).category
    if (cat) updates.category = cat

    if (transaction.tipo_id) updates.type = transaction.tipo_id
    if (transaction.forma_pagamento_id)
      updates.payment_method = transaction.forma_pagamento_id
    if (transaction.observacoes !== undefined)
      updates.notes = transaction.observacoes
    if (transaction.status) updates.status = transaction.status
    if (transaction.amount_paid !== undefined)
      updates.amount_paid = transaction.amount_paid

    if (
      transaction.valor !== undefined ||
      transaction.amount_paid !== undefined
    ) {
      const newTotal =
        transaction.valor !== undefined
          ? transaction.valor
          : Number(existingTx.amount)
      const newPaid =
        transaction.amount_paid !== undefined
          ? transaction.amount_paid
          : Number(existingTx.amount_paid || 0)

      if (!transaction.status) {
        if (newPaid >= newTotal) updates.status = 'pago'
        else if (newPaid > 0) updates.status = 'parcial'
        else updates.status = 'aberto'
      }
    }

    if (transaction.account_id !== undefined)
      updates.account_id = transaction.account_id
    if (transaction.is_conciliated !== undefined)
      updates.is_conciliated = transaction.is_conciliated

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapToTransacao(data)
  },

  async deleteTransaction(id: string) {
    const cleanId = extractUUID(id)
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', cleanId)

    if (error) throw error
  },

  async deleteTransactions(ids: string[]) {
    const cleanIds = ids.map(extractUUID)
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', cleanIds)

    if (error) throw error
  },

  async registerPayment(id: string, paymentAmount: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let txId = id
    let totalAmount = 0
    let currentAmountPaid = 0

    if (id.startsWith('proj_')) {
      const [, recurringId, dateStr] = id.split('_')
      const { data: recData, error: recError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('id', recurringId)
        .single()

      if (recError) throw recError

      const newTx = {
        user_id: user.id,
        date: dateStr,
        description: recData.description,
        amount: recData.amount,
        amount_paid: 0,
        category: recData.category,
        type: recData.type,
        payment_method: recData.payment_method,
        notes: recData.notes,
        recurring_transaction_id: recurringId,
        status: 'aberto',
      }

      const { data: createdTx, error: createError } = await supabase
        .from('transactions')
        .insert(newTx)
        .select()
        .single()

      if (createError) throw createError

      txId = createdTx.id
      totalAmount = Number(createdTx.amount)
      currentAmountPaid = 0
    } else {
      const { data: tx, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', txId)
        .single()

      if (fetchError) throw fetchError

      totalAmount = Number(tx.amount)
      currentAmountPaid = Number(tx.amount_paid || 0)
    }

    const newAmountPaid = currentAmountPaid + paymentAmount

    let newStatus = 'aberto'
    if (newAmountPaid >= totalAmount) {
      newStatus = 'pago'
    } else if (newAmountPaid > 0) {
      newStatus = 'parcial'
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', txId)
      .select()
      .single()

    if (error) throw error
    return { ...mapToTransacao(data), oldId: id }
  },
}
