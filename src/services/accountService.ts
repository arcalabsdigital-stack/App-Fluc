import { supabase } from '@/lib/supabase/client'
import { Conta } from '@/lib/types'

export const accountService = {
  async getAccounts(): Promise<Conta[]> {
    const { data, error } = await supabase.rpc('get_accounts_with_balances')

    if (error) {
      console.error('Error fetching accounts:', error)
      throw error
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      organization_id: row.organization_id,
      nome: row.nome,
      tipo: row.tipo,
      saldo_inicial: Number(row.saldo_inicial),
      data_saldo_inicial: row.data_saldo_inicial,
      is_active: row.is_active,
      saldo_atual: Number(row.saldo_atual || 0),
    }))
  },

  async createAccount(
    account: Omit<Conta, 'id' | 'organization_id' | 'saldo_atual'>,
  ): Promise<Conta> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: orgId, error: orgError } = await supabase.rpc(
      'get_current_user_org_id',
    )
    if (orgError) throw orgError

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        organization_id: orgId,
        nome: account.nome,
        tipo: account.tipo,
        saldo_inicial: account.saldo_inicial,
        data_saldo_inicial: account.data_saldo_inicial,
        is_active: account.is_active,
      })
      .select()
      .single()

    if (error) throw error
    return data as Conta
  },

  async updateAccount(id: string, account: Partial<Conta>): Promise<Conta> {
    const { data, error } = await supabase
      .from('accounts')
      .update(account)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Conta
  },

  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) throw error
  },
}
