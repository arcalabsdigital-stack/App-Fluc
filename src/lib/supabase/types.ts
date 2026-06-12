// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null
          data_saldo_inicial: string
          id: string
          is_active: boolean
          nome: string
          organization_id: string
          saldo_inicial: number
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_saldo_inicial?: string
          id?: string
          is_active?: boolean
          nome: string
          organization_id: string
          saldo_inicial?: number
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_saldo_inicial?: string
          id?: string
          is_active?: boolean
          nome?: string
          organization_id?: string
          saldo_inicial?: number
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'accounts_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_name: string | null
          entity_type: string
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_name?: string | null
          entity_type: string
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      billing_history: {
        Row: {
          amount: number
          asaas_payment_id: string | null
          created_at: string | null
          cupom_desconto: string | null
          desconto_valor: number | null
          id: string
          invoice_url: string | null
          metodo_pagamento: string | null
          nota_fiscal_url: string | null
          organization_id: string
          payment_date: string | null
          periodo_faturamento: string | null
          receipt_url: string | null
          recibo_url: string | null
          status: string
          subscription_id: string
        }
        Insert: {
          amount: number
          asaas_payment_id?: string | null
          created_at?: string | null
          cupom_desconto?: string | null
          desconto_valor?: number | null
          id?: string
          invoice_url?: string | null
          metodo_pagamento?: string | null
          nota_fiscal_url?: string | null
          organization_id: string
          payment_date?: string | null
          periodo_faturamento?: string | null
          receipt_url?: string | null
          recibo_url?: string | null
          status: string
          subscription_id: string
        }
        Update: {
          amount?: number
          asaas_payment_id?: string | null
          created_at?: string | null
          cupom_desconto?: string | null
          desconto_valor?: number | null
          id?: string
          invoice_url?: string | null
          metodo_pagamento?: string | null
          nota_fiscal_url?: string | null
          organization_id?: string
          payment_date?: string | null
          periodo_faturamento?: string | null
          receipt_url?: string | null
          recibo_url?: string | null
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'billing_history_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'billing_history_subscription_id_fkey'
            columns: ['subscription_id']
            isOneToOne: false
            referencedRelation: 'subscriptions'
            referencedColumns: ['id']
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          id: string
          month: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          id?: string
          month: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          id?: string
          month?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'budgets_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      categoria_simplificada: {
        Row: {
          accounting_group: string
          color: string | null
          criada_por_usuario: boolean | null
          efeito_caixa: string
          icon: string | null
          id: string
          natureza_contabil: string
          nome_simplificado: string
          organization_id: string | null
          permite_customizacao: boolean | null
          tipo_grupo: string
        }
        Insert: {
          accounting_group: string
          color?: string | null
          criada_por_usuario?: boolean | null
          efeito_caixa: string
          icon?: string | null
          id?: string
          natureza_contabil: string
          nome_simplificado: string
          organization_id?: string | null
          permite_customizacao?: boolean | null
          tipo_grupo: string
        }
        Update: {
          accounting_group?: string
          color?: string | null
          criada_por_usuario?: boolean | null
          efeito_caixa?: string
          icon?: string | null
          id?: string
          natureza_contabil?: string
          nome_simplificado?: string
          organization_id?: string | null
          permite_customizacao?: boolean | null
          tipo_grupo?: string
        }
        Relationships: [
          {
            foreignKeyName: 'categoria_simplificada_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          accounting_group: string | null
          created_at: string
          efeito_caixa: string
          grupo: string
          id: string
          natureza_contabil: string
          nome: string
          tipo: string
        }
        Insert: {
          accounting_group?: string | null
          created_at?: string
          efeito_caixa?: string
          grupo: string
          id?: string
          natureza_contabil?: string
          nome: string
          tipo: string
        }
        Update: {
          accounting_group?: string | null
          created_at?: string
          efeito_caixa?: string
          grupo?: string
          id?: string
          natureza_contabil?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          applied_at: string
          coupon_id: string
          id: string
          organization_id: string
          payment_id: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string
          coupon_id: string
          id?: string
          organization_id: string
          payment_id?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string
          coupon_id?: string
          id?: string
          organization_id?: string
          payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'coupon_redemptions_coupon_id_fkey'
            columns: ['coupon_id']
            isOneToOne: false
            referencedRelation: 'coupons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coupon_redemptions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          times_used: number
          updated_at: string
          usage_limit: number | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
          valid_until?: string | null
        }
        Relationships: []
      }
      dicas_contextuais: {
        Row: {
          categoria_simplificada_id: string | null
          descricao: string
          id: string
          titulo: string
        }
        Insert: {
          categoria_simplificada_id?: string | null
          descricao: string
          id?: string
          titulo: string
        }
        Update: {
          categoria_simplificada_id?: string | null
          descricao?: string
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dicas_contextuais_categoria_simplificada_id_fkey'
            columns: ['categoria_simplificada_id']
            isOneToOne: false
            referencedRelation: 'categoria_simplificada'
            referencedColumns: ['id']
          },
        ]
      }
      dicas_lidas: {
        Row: {
          dica_id: string | null
          id: string
          organization_id: string | null
        }
        Insert: {
          dica_id?: string | null
          id?: string
          organization_id?: string | null
        }
        Update: {
          dica_id?: string | null
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dicas_lidas_dica_id_fkey'
            columns: ['dica_id']
            isOneToOne: false
            referencedRelation: 'dicas_contextuais'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dicas_lidas_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      equity_shares: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          partner_name: string
          percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          partner_name: string
          percentage: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          partner_name?: string
          percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'equity_shares_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          organization_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          organization_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          organization_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          cnpj: string | null
          corporate_name: string | null
          created_at: string
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          corporate_name?: string | null
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          corporate_name?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parcelated_transactions: {
        Row: {
          account_id: string | null
          category_id: string
          created_at: string
          description: string
          estimated_end_date: string
          id: string
          installment_amount: number
          is_active: boolean
          is_conciliated: boolean | null
          next_installment_date: string
          organization_id: string
          paid_installments: number
          payment_method: string
          start_date: string
          total_amount: number
          total_installments: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          category_id: string
          created_at?: string
          description: string
          estimated_end_date: string
          id?: string
          installment_amount: number
          is_active?: boolean
          is_conciliated?: boolean | null
          next_installment_date: string
          organization_id: string
          paid_installments?: number
          payment_method: string
          start_date: string
          total_amount: number
          total_installments: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          category_id?: string
          created_at?: string
          description?: string
          estimated_end_date?: string
          id?: string
          installment_amount?: number
          is_active?: boolean
          is_conciliated?: boolean | null
          next_installment_date?: string
          organization_id?: string
          paid_installments?: number
          payment_method?: string
          start_date?: string
          total_amount?: number
          total_installments?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'compras_parceladas_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'parcelated_transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
        ]
      }
      pending_rewards: {
        Row: {
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_applied: boolean
          organization_id: string
        }
        Insert: {
          created_at?: string
          discount_type: string
          discount_value: number
          id?: string
          is_applied?: boolean
          organization_id: string
        }
        Update: {
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_applied?: boolean
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pending_rewards_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      plans: {
        Row: {
          asaas_plan_id: string | null
          billing_period: string | null
          created_at: string
          desconto_anual_percentual: number | null
          features: Json | null
          id: string
          name: string
          price: number
          price_anual: number | null
          price_mensal: number | null
        }
        Insert: {
          asaas_plan_id?: string | null
          billing_period?: string | null
          created_at?: string
          desconto_anual_percentual?: number | null
          features?: Json | null
          id?: string
          name: string
          price: number
          price_anual?: number | null
          price_mensal?: number | null
        }
        Update: {
          asaas_plan_id?: string | null
          billing_period?: string | null
          created_at?: string
          desconto_anual_percentual?: number | null
          features?: Json | null
          id?: string
          name?: string
          price?: number
          price_anual?: number | null
          price_mensal?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cnpj_ou_cpf: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean
          must_change_password: boolean
          onboarding_completed: boolean
          organization_id: string
          plan: string | null
          razao_social_ou_nome: string | null
          role: string
          telefone: string | null
          tipo_documento: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cnpj_ou_cpf?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          must_change_password?: boolean
          onboarding_completed?: boolean
          organization_id: string
          plan?: string | null
          razao_social_ou_nome?: string | null
          role?: string
          telefone?: string | null
          tipo_documento?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cnpj_ou_cpf?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          onboarding_completed?: boolean
          organization_id?: string
          plan?: string | null
          razao_social_ou_nome?: string | null
          role?: string
          telefone?: string | null
          tipo_documento?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      recurring_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string | null
          description: string
          frequency: string
          id: string
          is_conciliated: boolean | null
          next_date: string
          notes: string | null
          organization_id: string
          payment_method: string
          start_date: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string | null
          description: string
          frequency: string
          id?: string
          is_conciliated?: boolean | null
          next_date: string
          notes?: string | null
          organization_id: string
          payment_method: string
          start_date: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          frequency?: string
          id?: string
          is_conciliated?: boolean | null
          next_date?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string
          start_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recurring_transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recurring_transactions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      subscriptions: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          created_at: string | null
          current_period_end: string | null
          id: string
          organization_id: string
          plan: string
          status: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          organization_id: string
          plan: string
          status?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          organization_id?: string
          plan?: string
          status?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: true
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          amount_paid: number
          category: string
          created_at: string | null
          date: string
          description: string
          id: string
          installment_number: number | null
          is_conciliated: boolean | null
          notes: string | null
          organization_id: string
          parcelated_transaction_id: string | null
          payment_method: string
          recurring_transaction_id: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          amount_paid?: number
          category: string
          created_at?: string | null
          date: string
          description: string
          id?: string
          installment_number?: number | null
          is_conciliated?: boolean | null
          notes?: string | null
          organization_id: string
          parcelated_transaction_id?: string | null
          payment_method: string
          recurring_transaction_id?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          amount_paid?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          installment_number?: number | null
          is_conciliated?: boolean | null
          notes?: string | null
          organization_id?: string
          parcelated_transaction_id?: string | null
          payment_method?: string
          recurring_transaction_id?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_parcelated_transaction_id_fkey'
            columns: ['parcelated_transaction_id']
            isOneToOne: false
            referencedRelation: 'parcelated_transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_recurring_transaction_id_fkey'
            columns: ['recurring_transaction_id']
            isOneToOne: false
            referencedRelation: 'recurring_transactions'
            referencedColumns: ['id']
          },
        ]
      }
      transfers: {
        Row: {
          conta_destino_id: string
          conta_origem_id: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          organization_id: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          conta_destino_id: string
          conta_origem_id: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          organization_id: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          conta_destino_id?: string
          conta_origem_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          organization_id?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'transfers_conta_destino_id_fkey'
            columns: ['conta_destino_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transfers_conta_origem_id_fkey'
            columns: ['conta_origem_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transfers_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      user_workspaces: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_workspaces_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_email_exists: { Args: { p_email: string }; Returns: Json }
      create_new_workspace: {
        Args: { p_cnpj: string; p_corporate_name: string; p_name: string }
        Returns: string
      }
      get_accounts_with_balances: {
        Args: never
        Returns: {
          data_saldo_inicial: string
          id: string
          is_active: boolean
          nome: string
          organization_id: string
          saldo_atual: number
          saldo_inicial: number
          tipo: string
        }[]
      }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: string
        }[]
      }
      get_auth_admin_workspaces: { Args: never; Returns: string[] }
      get_auth_user_workspaces: { Args: never; Returns: string[] }
      get_current_user_org_id: { Args: never; Returns: string }
      get_dashboard_kpi: { Args: { p_date_now: string }; Returns: Json }
      get_latest_transaction_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      process_recurring_transactions: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: accounts
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   nome: text (not null)
//   tipo: text (not null)
//   saldo_inicial: numeric (not null, default: 0)
//   data_saldo_inicial: date (not null, default: CURRENT_DATE)
//   is_active: boolean (not null, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: audit_logs
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   user_id: uuid (nullable)
//   action: text (not null)
//   entity_type: text (not null)
//   entity_name: text (nullable)
//   details: jsonb (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: billing_history
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   subscription_id: uuid (not null)
//   amount: numeric (not null)
//   status: text (not null)
//   payment_date: timestamp with time zone (nullable)
//   receipt_url: text (nullable)
//   invoice_url: text (nullable)
//   asaas_payment_id: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   cupom_desconto: text (nullable)
//   desconto_valor: numeric (nullable)
//   periodo_faturamento: text (nullable, default: 'mensal'::text)
//   metodo_pagamento: text (nullable)
//   recibo_url: text (nullable)
//   nota_fiscal_url: text (nullable)
// Table: budgets
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   category: text (not null)
//   amount: numeric (not null, default: 0)
//   month: text (not null)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: categoria_simplificada
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   nome_simplificado: character varying (not null)
//   tipo_grupo: character varying (not null)
//   natureza_contabil: character varying (not null)
//   efeito_caixa: character varying (not null)
//   accounting_group: character varying (not null)
//   permite_customizacao: boolean (nullable, default: false)
//   criada_por_usuario: boolean (nullable, default: false)
//   icon: text (nullable)
//   color: text (nullable)
// Table: categories
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   tipo: text (not null)
//   grupo: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   accounting_group: text (nullable)
//   natureza_contabil: character varying (not null, default: 'Despesa'::character varying)
//   efeito_caixa: character varying (not null, default: 'Sem_efeito'::character varying)
// Table: coupon_redemptions
//   id: uuid (not null, default: gen_random_uuid())
//   coupon_id: uuid (not null)
//   user_id: uuid (not null)
//   organization_id: uuid (not null)
//   payment_id: text (nullable)
//   applied_at: timestamp with time zone (not null, default: now())
// Table: coupons
//   id: uuid (not null, default: gen_random_uuid())
//   code: text (not null)
//   discount_type: text (not null)
//   discount_value: numeric (not null)
//   valid_until: timestamp with time zone (nullable)
//   usage_limit: integer (nullable)
//   times_used: integer (not null, default: 0)
//   is_active: boolean (not null, default: true)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: dicas_contextuais
//   id: uuid (not null, default: gen_random_uuid())
//   categoria_simplificada_id: uuid (nullable)
//   titulo: character varying (not null)
//   descricao: text (not null)
// Table: dicas_lidas
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   dica_id: uuid (nullable)
// Table: equity_shares
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   partner_name: text (not null)
//   percentage: numeric (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: notifications
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   user_id: uuid (not null)
//   title: text (not null)
//   message: text (not null)
//   is_read: boolean (nullable, default: false)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: organizations
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   cnpj: text (nullable)
//   corporate_name: text (nullable)
//   slug: text (nullable)
// Table: parcelated_transactions
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   description: text (not null)
//   total_amount: numeric (not null)
//   installment_amount: numeric (not null)
//   total_installments: integer (not null)
//   paid_installments: integer (not null, default: 0)
//   start_date: date (not null)
//   next_installment_date: date (not null)
//   estimated_end_date: date (not null)
//   category_id: uuid (not null)
//   payment_method: text (not null)
//   is_active: boolean (not null, default: true)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   user_id: uuid (not null)
//   account_id: uuid (nullable)
//   is_conciliated: boolean (nullable, default: false)
// Table: pending_rewards
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   discount_type: text (not null)
//   discount_value: numeric (not null)
//   is_applied: boolean (not null, default: false)
//   created_at: timestamp with time zone (not null, default: now())
// Table: plans
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   price: numeric (not null)
//   asaas_plan_id: text (nullable)
//   features: jsonb (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   billing_period: text (nullable, default: 'mensal'::text)
//   price_mensal: numeric (nullable, default: 0)
//   price_anual: numeric (nullable, default: 0)
//   desconto_anual_percentual: numeric (nullable, default: 0)
// Table: profiles
//   id: uuid (not null)
//   full_name: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   role: text (not null, default: 'visitante'::text)
//   avatar_url: text (nullable)
//   organization_id: uuid (not null)
//   is_active: boolean (not null, default: true)
//   must_change_password: boolean (not null, default: false)
//   plan: text (nullable)
//   cnpj_ou_cpf: text (nullable)
//   tipo_documento: text (nullable)
//   razao_social_ou_nome: text (nullable)
//   telefone: text (nullable)
//   onboarding_completed: boolean (not null, default: false)
// Table: recurring_transactions
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   user_id: uuid (not null)
//   description: text (not null)
//   amount: numeric (not null)
//   category: text (not null)
//   type: text (not null)
//   payment_method: text (not null)
//   frequency: text (not null)
//   start_date: date (not null)
//   next_date: date (not null)
//   notes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   account_id: uuid (nullable)
//   is_conciliated: boolean (nullable, default: false)
// Table: subscriptions
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   plan: text (not null)
//   status: text (not null, default: 'trial'::text)
//   trial_start: timestamp with time zone (nullable)
//   trial_end: timestamp with time zone (nullable)
//   current_period_end: timestamp with time zone (nullable)
//   asaas_customer_id: text (nullable)
//   asaas_subscription_id: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: transactions
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   date: date (not null)
//   description: text (not null)
//   category: text (not null)
//   type: text (not null)
//   amount: numeric (not null)
//   payment_method: text (not null)
//   notes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   organization_id: uuid (not null)
//   recurring_transaction_id: uuid (nullable)
//   status: text (not null, default: 'aberto'::text)
//   parcelated_transaction_id: uuid (nullable)
//   installment_number: integer (nullable)
//   account_id: uuid (nullable)
//   is_conciliated: boolean (nullable, default: false)
//   amount_paid: numeric (not null, default: 0)
// Table: transfers
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   user_id: uuid (not null)
//   conta_origem_id: uuid (not null)
//   conta_destino_id: uuid (not null)
//   valor: numeric (not null)
//   date: date (not null)
//   description: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: user_workspaces
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   organization_id: uuid (not null)
//   role: text (not null, default: 'visitante'::text)
//   is_active: boolean (not null, default: true)
//   created_at: timestamp with time zone (nullable, default: now())

// --- CONSTRAINTS ---
// Table: accounts
//   FOREIGN KEY accounts_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY accounts_pkey: PRIMARY KEY (id)
//   CHECK accounts_tipo_check: CHECK ((tipo = ANY (ARRAY['corrente'::text, 'poupanca'::text, 'aplicacao'::text, 'caixa'::text])))
// Table: audit_logs
//   FOREIGN KEY audit_logs_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY audit_logs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY audit_logs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: billing_history
//   FOREIGN KEY billing_history_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY billing_history_pkey: PRIMARY KEY (id)
//   FOREIGN KEY billing_history_subscription_id_fkey: FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
// Table: budgets
//   FOREIGN KEY budgets_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY budgets_pkey: PRIMARY KEY (id)
// Table: categoria_simplificada
//   FOREIGN KEY categoria_simplificada_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY categoria_simplificada_pkey: PRIMARY KEY (id)
// Table: categories
//   UNIQUE categories_nome_tipo_unique: UNIQUE (nome, tipo)
//   PRIMARY KEY categories_pkey: PRIMARY KEY (id)
//   CHECK categories_tipo_check: CHECK ((tipo = ANY (ARRAY['Receita'::text, 'Despesa'::text])))
// Table: coupon_redemptions
//   FOREIGN KEY coupon_redemptions_coupon_id_fkey: FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
//   FOREIGN KEY coupon_redemptions_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY coupon_redemptions_pkey: PRIMARY KEY (id)
//   FOREIGN KEY coupon_redemptions_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: coupons
//   UNIQUE coupons_code_key: UNIQUE (code)
//   CHECK coupons_discount_type_check: CHECK ((discount_type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED'::text])))
//   PRIMARY KEY coupons_pkey: PRIMARY KEY (id)
// Table: dicas_contextuais
//   FOREIGN KEY dicas_contextuais_categoria_simplificada_id_fkey: FOREIGN KEY (categoria_simplificada_id) REFERENCES categoria_simplificada(id) ON DELETE CASCADE
//   PRIMARY KEY dicas_contextuais_pkey: PRIMARY KEY (id)
// Table: dicas_lidas
//   FOREIGN KEY dicas_lidas_dica_id_fkey: FOREIGN KEY (dica_id) REFERENCES dicas_contextuais(id) ON DELETE CASCADE
//   UNIQUE dicas_lidas_organization_id_dica_id_key: UNIQUE (organization_id, dica_id)
//   FOREIGN KEY dicas_lidas_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY dicas_lidas_pkey: PRIMARY KEY (id)
// Table: equity_shares
//   FOREIGN KEY equity_shares_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   CHECK equity_shares_percentage_check: CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric)))
//   PRIMARY KEY equity_shares_pkey: PRIMARY KEY (id)
// Table: notifications
//   FOREIGN KEY notifications_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY notifications_pkey: PRIMARY KEY (id)
//   FOREIGN KEY notifications_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: organizations
//   PRIMARY KEY organizations_pkey: PRIMARY KEY (id)
// Table: parcelated_transactions
//   FOREIGN KEY compras_parceladas_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY compras_parceladas_pkey: PRIMARY KEY (id)
//   FOREIGN KEY compras_parceladas_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
//   FOREIGN KEY parcelated_transactions_account_id_fkey: FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
// Table: pending_rewards
//   CHECK pending_rewards_discount_type_check: CHECK ((discount_type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED'::text])))
//   FOREIGN KEY pending_rewards_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY pending_rewards_pkey: PRIMARY KEY (id)
// Table: plans
//   UNIQUE plans_name_key: UNIQUE (name)
//   PRIMARY KEY plans_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   FOREIGN KEY profiles_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id)
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
//   CHECK profiles_role_check: CHECK ((role = ANY (ARRAY['admin'::text, 'colaborador'::text, 'visitante'::text, 'super_admin'::text])))
// Table: recurring_transactions
//   FOREIGN KEY recurring_transactions_account_id_fkey: FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
//   FOREIGN KEY recurring_transactions_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY recurring_transactions_pkey: PRIMARY KEY (id)
//   FOREIGN KEY recurring_transactions_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: subscriptions
//   FOREIGN KEY subscriptions_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   UNIQUE subscriptions_organization_id_key: UNIQUE (organization_id)
//   PRIMARY KEY subscriptions_pkey: PRIMARY KEY (id)
// Table: transactions
//   FOREIGN KEY transactions_account_id_fkey: FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
//   CHECK transactions_amount_paid_check: CHECK ((amount_paid >= (0)::numeric))
//   FOREIGN KEY transactions_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id)
//   FOREIGN KEY transactions_parcelated_transaction_id_fkey: FOREIGN KEY (parcelated_transaction_id) REFERENCES parcelated_transactions(id) ON DELETE SET NULL
//   PRIMARY KEY transactions_pkey: PRIMARY KEY (id)
//   FOREIGN KEY transactions_recurring_transaction_id_fkey: FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL
//   FOREIGN KEY transactions_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: transfers
//   FOREIGN KEY transfers_conta_destino_id_fkey: FOREIGN KEY (conta_destino_id) REFERENCES accounts(id) ON DELETE RESTRICT
//   FOREIGN KEY transfers_conta_origem_id_fkey: FOREIGN KEY (conta_origem_id) REFERENCES accounts(id) ON DELETE RESTRICT
//   FOREIGN KEY transfers_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY transfers_pkey: PRIMARY KEY (id)
//   FOREIGN KEY transfers_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
//   CHECK transfers_valor_check: CHECK ((valor > (0)::numeric))
// Table: user_workspaces
//   FOREIGN KEY user_workspaces_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY user_workspaces_pkey: PRIMARY KEY (id)
//   FOREIGN KEY user_workspaces_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
//   UNIQUE user_workspaces_user_id_organization_id_key: UNIQUE (user_id, organization_id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: accounts
//   Policy "Users can delete accounts in their org" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can insert accounts in their org" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can update accounts in their org" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can view accounts in their org" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
// Table: audit_logs
//   Policy "Admins can view all audit logs" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (is_admin() AND (organization_id = get_current_user_org_id()))
//   Policy "SuperAdmin view audit logs" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_super_admin()
//   Policy "Users can insert audit logs" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can view their own audit logs" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) AND (organization_id = get_current_user_org_id()))
// Table: billing_history
//   Policy "Users can insert billing in their org" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can view billing in their org" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
// Table: budgets
//   Policy "Users can delete budgets in their org" (DELETE, PERMISSIVE) roles={public}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can insert budgets in their org" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can update budgets in their org" (UPDATE, PERMISSIVE) roles={public}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can view budgets in their org" (SELECT, PERMISSIVE) roles={public}
//     USING: (organization_id = get_current_user_org_id())
// Table: categoria_simplificada
//   Policy "Public read global categorias_simplificada" (SELECT, PERMISSIVE) roles={public}
//     USING: ((organization_id IS NULL) OR (organization_id = get_current_user_org_id()))
//   Policy "Users can delete their own categorias_simplificada" (DELETE, PERMISSIVE) roles={public}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can insert categorias_simplificada" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can read all categorias_simplificada" (SELECT, PERMISSIVE) roles={public}
//     USING: ((organization_id IS NULL) OR (organization_id = get_current_user_org_id()))
//   Policy "Users can update their own categorias_simplificada" (UPDATE, PERMISSIVE) roles={public}
//     USING: (organization_id = get_current_user_org_id())
// Table: categories
//   Policy "authenticated_select_categories" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: coupon_redemptions
//   Policy "SuperAdmin manage redemptions" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_super_admin()
//   Policy "Users can read own redemptions" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_auth_user_workspaces() AS get_auth_user_workspaces))
// Table: coupons
//   Policy "Public read coupons" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "SuperAdmin manage coupons" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_super_admin()
// Table: dicas_contextuais
//   Policy "Public read dicas_contextuais" (SELECT, PERMISSIVE) roles={public}
//     USING: true
// Table: dicas_lidas
//   Policy "Users can insert dicas_lidas" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can read dicas_lidas" (SELECT, PERMISSIVE) roles={public}
//     USING: (organization_id = get_current_user_org_id())
// Table: equity_shares
//   Policy "Users can delete equity in their org" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can insert equity in their org" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can update equity in their org" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can view equity in their org" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
// Table: notifications
//   Policy "Users can delete their notifications" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (organization_id = get_current_user_org_id()))
//   Policy "Users can insert notifications" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can update their notifications" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (organization_id = get_current_user_org_id()))
//   Policy "Users can view their notifications" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (organization_id = get_current_user_org_id()))
// Table: organizations
//   Policy "Admins can update their organization" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (id IN ( SELECT get_auth_admin_workspaces() AS get_auth_admin_workspaces))
//     WITH CHECK: (id IN ( SELECT get_auth_admin_workspaces() AS get_auth_admin_workspaces))
//   Policy "Users can view their own organization" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((id IN ( SELECT get_auth_user_workspaces() AS get_auth_user_workspaces)) OR (id = get_current_user_org_id()))
// Table: parcelated_transactions
//   Policy "Users can delete parcelated transactions" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can insert parcelated transactions" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can update parcelated transactions" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can view their parcelated transactions" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
// Table: pending_rewards
//   Policy "SuperAdmin manage pending rewards" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_super_admin()
// Table: plans
//   Policy "authenticated_select_plans" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: profiles
//   Policy "Admins can update profiles in their organization" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_auth_admin_workspaces() AS get_auth_admin_workspaces))
//   Policy "SuperAdmin manage profiles" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_super_admin()
//   Policy "Users can update their own profile" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (id = auth.uid())
//     WITH CHECK: (id = auth.uid())
//   Policy "Users can view profiles in their organization" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((id = auth.uid()) OR (organization_id IN ( SELECT get_auth_user_workspaces() AS get_auth_user_workspaces)) OR is_super_admin())
// Table: recurring_transactions
//   Policy "Users can delete recurring in their org" (DELETE, PERMISSIVE) roles={public}
//     USING: ((organization_id = get_current_user_org_id()) AND (get_user_role() <> 'visitante'::text))
//   Policy "Users can insert recurring in their org" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: ((organization_id = get_current_user_org_id()) AND (get_user_role() <> 'visitante'::text))
//   Policy "Users can update recurring in their org" (UPDATE, PERMISSIVE) roles={public}
//     USING: ((organization_id = get_current_user_org_id()) AND (get_user_role() <> 'visitante'::text))
//   Policy "Users can view recurring in their org" (SELECT, PERMISSIVE) roles={public}
//     USING: (organization_id = get_current_user_org_id())
// Table: subscriptions
//   Policy "Users can update subscriptions in their org" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can view subscriptions in their org" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
// Table: transactions
//   Policy "Users can delete transactions in their org" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id = get_current_user_org_id()) AND (get_user_role() <> 'visitante'::text))
//   Policy "Users can insert transactions in their org" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id = get_current_user_org_id()) AND (get_user_role() <> 'visitante'::text))
//   Policy "Users can update transactions in their org" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id = get_current_user_org_id()) AND (get_user_role() <> 'visitante'::text))
//   Policy "Users view transactions in their org" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
// Table: transfers
//   Policy "Users can delete transfers in their org" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can insert transfers in their org" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id = get_current_user_org_id())
//   Policy "Users can update transfers in their org" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
//   Policy "Users can view transfers in their org" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id = get_current_user_org_id())
// Table: user_workspaces
//   Policy "Admins can update users in their org" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_auth_admin_workspaces() AS get_auth_admin_workspaces))
//   Policy "SuperAdmin can manage user_workspaces" (ALL, PERMISSIVE) roles={authenticated}
//     USING: is_super_admin()
//   Policy "Users can view workspaces they belong to" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (organization_id IN ( SELECT get_auth_user_workspaces() AS get_auth_user_workspaces)))

// --- DATABASE FUNCTIONS ---
// FUNCTION check_budget_on_transaction()
//   CREATE OR REPLACE FUNCTION public.check_budget_on_transaction()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       v_budget RECORD;
//       v_spent NUMERIC;
//       v_month TEXT;
//   BEGIN
//       IF NEW.type = 'Despesa' THEN
//           v_month := to_char(NEW.date, 'YYYY-MM');
//
//           SELECT * INTO v_budget FROM public.budgets
//           WHERE category = NEW.category
//           AND month = v_month
//           AND organization_id = NEW.organization_id;
//
//           IF FOUND THEN
//               SELECT COALESCE(SUM(amount), 0) + NEW.amount INTO v_spent
//               FROM public.transactions
//               WHERE category = NEW.category
//               AND type = 'Despesa'
//               AND to_char(date, 'YYYY-MM') = v_month
//               AND organization_id = NEW.organization_id
//               AND id != NEW.id;
//
//               IF v_spent >= v_budget.amount AND (v_spent - NEW.amount) < v_budget.amount THEN
//                   INSERT INTO public.notifications (organization_id, user_id, title, message)
//                   VALUES (
//                       NEW.organization_id, NEW.user_id,
//                       'Alerta de Orçamento',
//                       'Atenção! Você atingiu ou ultrapassou o limite definido para esta categoria.'
//                   );
//               END IF;
//           END IF;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION check_user_email_exists(text)
//   CREATE OR REPLACE FUNCTION public.check_user_email_exists(p_email text)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_user_id uuid;
//   BEGIN
//     SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
//     IF v_user_id IS NOT NULL THEN
//       RETURN json_build_object('exists', true, 'user_id', v_user_id);
//     ELSE
//       RETURN json_build_object('exists', false);
//     END IF;
//   END;
//   $function$
//
// FUNCTION create_new_workspace(text, text, text)
//   CREATE OR REPLACE FUNCTION public.create_new_workspace(p_name text, p_cnpj text, p_corporate_name text)
//    RETURNS uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_org_id UUID;
//     v_slug TEXT;
//   BEGIN
//     IF auth.uid() IS NULL THEN
//       RAISE EXCEPTION 'Not authenticated';
//     END IF;
//
//     -- Generate a basic slug
//     v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
//
//     INSERT INTO public.organizations (name, cnpj, corporate_name, slug)
//     VALUES (p_name, p_cnpj, p_corporate_name, v_slug)
//     RETURNING id INTO v_org_id;
//
//     INSERT INTO public.user_workspaces (user_id, organization_id, role, is_active)
//     VALUES (auth.uid(), v_org_id, 'admin', true);
//
//     INSERT INTO public.subscriptions (organization_id, plan, status, trial_start, trial_end)
//     VALUES (v_org_id, 'Fluxo', 'trial', now(), now() + interval '7 days');
//
//     UPDATE public.profiles
//     SET organization_id = v_org_id
//     WHERE id = auth.uid();
//
//     RETURN v_org_id;
//   END;
//   $function$
//
// FUNCTION get_accounts_with_balances()
//   CREATE OR REPLACE FUNCTION public.get_accounts_with_balances()
//    RETURNS TABLE(id uuid, organization_id uuid, nome text, tipo text, saldo_inicial numeric, data_saldo_inicial date, is_active boolean, saldo_atual numeric)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     SELECT
//       a.id,
//       a.organization_id,
//       a.nome,
//       a.tipo,
//       a.saldo_inicial,
//       a.data_saldo_inicial,
//       a.is_active,
//       a.saldo_inicial +
//       COALESCE((SELECT SUM(CASE WHEN t.type = 'Receita' THEN t.amount_paid ELSE -t.amount_paid END) FROM public.transactions t WHERE t.account_id = a.id AND t.date >= a.data_saldo_inicial), 0) +
//       COALESCE((SELECT SUM(tr.valor) FROM public.transfers tr WHERE tr.conta_destino_id = a.id AND tr.date >= a.data_saldo_inicial), 0) -
//       COALESCE((SELECT SUM(tr.valor) FROM public.transfers tr WHERE tr.conta_origem_id = a.id AND tr.date >= a.data_saldo_inicial), 0) AS saldo_atual
//     FROM public.accounts a
//     WHERE a.organization_id = public.get_current_user_org_id()
//     ORDER BY a.created_at ASC;
//   END;
//   $function$
//
// FUNCTION get_all_users_for_admin()
//   CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
//    RETURNS TABLE(id uuid, email text, full_name text, role text, is_active boolean, created_at timestamp with time zone)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF NOT public.is_super_admin() THEN
//       RAISE EXCEPTION 'Not authorized';
//     END IF;
//
//     RETURN QUERY
//     SELECT
//       p.id,
//       u.email::TEXT,
//       p.full_name,
//       p.role,
//       p.is_active,
//       p.created_at
//     FROM public.profiles p
//     JOIN auth.users u ON u.id = p.id;
//   END;
//   $function$
//
// FUNCTION get_auth_admin_workspaces()
//   CREATE OR REPLACE FUNCTION public.get_auth_admin_workspaces()
//    RETURNS SETOF uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     RETURN QUERY SELECT organization_id FROM public.user_workspaces WHERE user_id = auth.uid() AND role = 'admin';
//   END;
//   $function$
//
// FUNCTION get_auth_user_workspaces()
//   CREATE OR REPLACE FUNCTION public.get_auth_user_workspaces()
//    RETURNS SETOF uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     RETURN QUERY SELECT organization_id FROM public.user_workspaces WHERE user_id = auth.uid();
//   END;
//   $function$
//
// FUNCTION get_current_user_org_id()
//   CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
//    RETURNS uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_org_id uuid;
//   BEGIN
//     SELECT organization_id INTO v_org_id FROM public.profiles WHERE id = auth.uid() AND is_active = true LIMIT 1;
//     RETURN v_org_id;
//   END;
//   $function$
//
// FUNCTION get_dashboard_kpi(date)
//   CREATE OR REPLACE FUNCTION public.get_dashboard_kpi(p_date_now date)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_conciliated_balance NUMERIC := 0;
//     v_realized_balance NUMERIC := 0;
//     v_projected_balance NUMERIC := 0;
//
//     v_available_balance NUMERIC := 0;
//     v_invested_balance NUMERIC := 0;
//
//     v_month_income_realized NUMERIC;
//     v_month_income_projected NUMERIC;
//
//     v_month_expense_realized NUMERIC;
//     v_month_expense_projected NUMERIC;
//
//     v_last_month_income NUMERIC;
//     v_last_month_expense NUMERIC;
//
//     v_start_month DATE;
//     v_end_month DATE;
//     v_start_last_month DATE;
//     v_end_last_month DATE;
//     v_org_id uuid;
//     acc RECORD;
//
//     acc_conc NUMERIC;
//     acc_real NUMERIC;
//     acc_proj NUMERIC;
//     transfers_in NUMERIC;
//     transfers_out NUMERIC;
//   BEGIN
//     v_org_id := public.get_current_user_org_id();
//     v_start_month := date_trunc('month', p_date_now);
//     v_end_month := (date_trunc('month', p_date_now) + interval '1 month' - interval '1 day')::date;
//     v_start_last_month := date_trunc('month', p_date_now - interval '1 month');
//     v_end_last_month := (date_trunc('month', p_date_now) - interval '1 day')::date;
//
//     FOR acc IN SELECT id, tipo, saldo_inicial, data_saldo_inicial FROM public.accounts WHERE organization_id = v_org_id AND is_active = true LOOP
//       acc_conc := acc.saldo_inicial;
//       acc_real := acc.saldo_inicial;
//       acc_proj := acc.saldo_inicial;
//
//       -- Conciliated (confirmed transactions)
//       acc_conc := acc_conc + COALESCE((
//         SELECT SUM(CASE WHEN type = 'Receita' THEN amount_paid ELSE -amount_paid END)
//         FROM public.transactions
//         WHERE account_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial AND is_conciliated = true
//       ), 0);
//
//       -- Realized (paid/received)
//       acc_real := acc_real + COALESCE((
//         SELECT SUM(CASE WHEN type = 'Receita' THEN amount_paid ELSE -amount_paid END)
//         FROM public.transactions
//         WHERE account_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial
//       ), 0);
//
//       -- Projected (realized + remaining pending)
//       acc_proj := acc_real + COALESCE((
//         SELECT SUM(CASE WHEN type = 'Receita' THEN (amount - amount_paid) ELSE -(amount - amount_paid) END)
//         FROM public.transactions
//         WHERE account_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial AND status != 'pago'
//       ), 0);
//
//       transfers_in := COALESCE((
//         SELECT SUM(valor) FROM public.transfers WHERE conta_destino_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial
//       ), 0);
//       transfers_out := COALESCE((
//         SELECT SUM(valor) FROM public.transfers WHERE conta_origem_id = acc.id AND date <= p_date_now AND date >= acc.data_saldo_inicial
//       ), 0);
//
//       acc_conc := acc_conc + transfers_in - transfers_out;
//       acc_real := acc_real + transfers_in - transfers_out;
//       acc_proj := acc_proj + transfers_in - transfers_out;
//
//       v_conciliated_balance := v_conciliated_balance + acc_conc;
//       v_realized_balance := v_realized_balance + acc_real;
//       v_projected_balance := v_projected_balance + acc_proj;
//
//       IF acc.tipo IN ('corrente', 'poupanca', 'caixa') THEN
//         v_available_balance := v_available_balance + acc_real;
//       ELSIF acc.tipo = 'aplicacao' THEN
//         v_invested_balance := v_invested_balance + acc_real;
//       END IF;
//     END LOOP;
//
//     SELECT COALESCE(SUM(amount_paid), 0) INTO v_month_income_realized
//     FROM public.transactions
//     WHERE type = 'Receita' AND date >= v_start_month AND date <= v_end_month AND organization_id = v_org_id;
//
//     SELECT COALESCE(SUM(amount - amount_paid), 0) INTO v_month_income_projected
//     FROM public.transactions
//     WHERE type = 'Receita' AND status != 'pago' AND date >= v_start_month AND date <= v_end_month AND organization_id = v_org_id;
//
//     SELECT COALESCE(SUM(amount_paid), 0) INTO v_month_expense_realized
//     FROM public.transactions
//     WHERE type = 'Despesa' AND date >= v_start_month AND date <= v_end_month AND organization_id = v_org_id;
//
//     SELECT COALESCE(SUM(amount - amount_paid), 0) INTO v_month_expense_projected
//     FROM public.transactions
//     WHERE type = 'Despesa' AND status != 'pago' AND date >= v_start_month AND date <= v_end_month AND organization_id = v_org_id;
//
//     SELECT COALESCE(SUM(amount_paid), 0) INTO v_last_month_income
//     FROM public.transactions
//     WHERE type = 'Receita' AND date >= v_start_last_month AND date <= v_end_last_month AND organization_id = v_org_id;
//
//     SELECT COALESCE(SUM(amount_paid), 0) INTO v_last_month_expense
//     FROM public.transactions
//     WHERE type = 'Despesa' AND date >= v_start_last_month AND date <= v_end_last_month AND organization_id = v_org_id;
//
//     RETURN json_build_object(
//       'totalBalance', v_realized_balance,
//       'conciliatedBalance', v_conciliated_balance,
//       'realizedBalance', v_realized_balance,
//       'projectedBalance', v_projected_balance,
//       'availableBalance', v_available_balance,
//       'investedBalance', v_invested_balance,
//       'monthIncome', v_month_income_realized,
//       'monthExpense', v_month_expense_realized,
//       'monthIncomeRealized', v_month_income_realized,
//       'monthIncomeProjected', v_month_income_projected,
//       'monthExpenseRealized', v_month_expense_realized,
//       'monthExpenseProjected', v_month_expense_projected,
//       'lastMonthIncome', v_last_month_income,
//       'lastMonthExpense', v_last_month_expense
//     );
//   END;
//   $function$
//
// FUNCTION get_latest_transaction_id()
//   CREATE OR REPLACE FUNCTION public.get_latest_transaction_id()
//    RETURNS uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     -- Deterministic sort order matching the service layer
//     RETURN (SELECT id FROM public.transactions ORDER BY created_at DESC, id DESC LIMIT 1);
//   END;
//   $function$
//
// FUNCTION get_user_role()
//   CREATE OR REPLACE FUNCTION public.get_user_role()
//    RETURNS text
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     RETURN COALESCE((
//       SELECT role FROM public.user_workspaces
//       WHERE user_id = auth.uid()
//         AND organization_id = public.get_current_user_org_id()
//         AND is_active = true
//     ), 'visitante');
//   END;
//   $function$
//
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     org_id UUID;
//     new_role TEXT;
//     v_must_change_password BOOLEAN;
//     v_org_name TEXT;
//     v_plan TEXT;
//   BEGIN
//     v_must_change_password := COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false);
//
//     BEGIN
//       org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
//     EXCEPTION WHEN OTHERS THEN
//       org_id := NULL;
//     END;
//
//     new_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'admin');
//     v_plan := NEW.raw_user_meta_data->>'plan';
//
//     IF org_id IS NULL THEN
//        v_org_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'organization_name', ''), NULLIF(NEW.raw_user_meta_data->>'full_name', '') || ' - Organização', 'Minha Organização');
//        INSERT INTO public.organizations (name) VALUES (v_org_name) RETURNING id INTO org_id;
//        new_role := 'admin';
//
//        INSERT INTO public.subscriptions (organization_id, plan, status, trial_start, trial_end)
//        VALUES (org_id, COALESCE(NULLIF(v_plan, ''), 'Fluxo'), 'trial', now(), now() + interval '7 days')
//        ON CONFLICT (organization_id) DO NOTHING;
//     END IF;
//
//     BEGIN
//       IF org_id IS NOT NULL THEN
//         INSERT INTO public.profiles (id, full_name, role, organization_id, is_active, must_change_password, plan)
//         VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data->>'full_name', ''), new_role, org_id, true, v_must_change_password, NULLIF(v_plan, ''))
//         ON CONFLICT (id) DO UPDATE SET plan = EXCLUDED.plan WHERE profiles.plan IS NULL;
//
//         INSERT INTO public.user_workspaces (user_id, organization_id, role, is_active)
//         VALUES (NEW.id, org_id, new_role, true)
//         ON CONFLICT (user_id, organization_id) DO NOTHING;
//       END IF;
//     EXCEPTION WHEN OTHERS THEN
//       RAISE WARNING 'handle_new_user profile insert failed: %', SQLERRM;
//     END;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION is_admin()
//   CREATE OR REPLACE FUNCTION public.is_admin()
//    RETURNS boolean
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     RETURN EXISTS (
//       SELECT 1 FROM public.user_workspaces
//       WHERE user_id = auth.uid()
//         AND organization_id = public.get_current_user_org_id()
//         AND role = 'admin'
//         AND is_active = true
//     );
//   END;
//   $function$
//
// FUNCTION is_super_admin()
//   CREATE OR REPLACE FUNCTION public.is_super_admin()
//    RETURNS boolean
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN (auth.jwt() ->> 'email')::text IN ('marciomorais2722@gmail.com', 'arcalabs.digital@gmail.com');
//   END;
//   $function$
//
// FUNCTION log_profile_audit()
//   CREATE OR REPLACE FUNCTION public.log_profile_audit()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       v_user_id UUID;
//       v_action TEXT;
//       v_entity_name TEXT;
//       v_org_id UUID;
//   BEGIN
//       BEGIN
//         v_user_id := auth.uid();
//         IF v_user_id IS NULL THEN
//             v_user_id := COALESCE(NEW.id, OLD.id);
//         END IF;
//
//         IF TG_OP = 'INSERT' THEN
//             v_action := 'CREATE';
//             v_entity_name := NEW.full_name;
//             v_org_id := NEW.organization_id;
//         ELSIF TG_OP = 'UPDATE' THEN
//             v_action := 'UPDATE';
//             v_entity_name := NEW.full_name;
//             v_org_id := NEW.organization_id;
//         ELSIF TG_OP = 'DELETE' THEN
//             v_action := 'DELETE';
//             v_entity_name := OLD.full_name;
//             v_org_id := OLD.organization_id;
//         END IF;
//
//         IF v_entity_name IS NULL OR v_entity_name = '' THEN
//             v_entity_name := 'Novo Usuário';
//         END IF;
//
//         IF v_org_id IS NOT NULL THEN
//           INSERT INTO public.audit_logs (organization_id, user_id, action, entity_type, entity_name, details)
//           VALUES (v_org_id, v_user_id, v_action, 'USER', v_entity_name,
//                   CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END);
//         END IF;
//       EXCEPTION WHEN OTHERS THEN
//         RAISE WARNING 'log_profile_audit failed: %', SQLERRM;
//       END;
//
//       RETURN COALESCE(NEW, OLD);
//   END;
//   $function$
//
// FUNCTION log_transaction_audit()
//   CREATE OR REPLACE FUNCTION public.log_transaction_audit()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       v_user_id UUID;
//       v_action TEXT;
//       v_entity_name TEXT;
//       v_org_id UUID;
//   BEGIN
//       v_user_id := auth.uid();
//       IF v_user_id IS NULL THEN
//           v_user_id := COALESCE(NEW.user_id, OLD.user_id);
//       END IF;
//
//       IF TG_OP = 'INSERT' THEN
//           v_action := 'CREATE';
//           v_entity_name := NEW.description;
//           v_org_id := NEW.organization_id;
//       ELSIF TG_OP = 'UPDATE' THEN
//           v_action := 'UPDATE';
//           v_entity_name := NEW.description;
//           v_org_id := NEW.organization_id;
//       ELSIF TG_OP = 'DELETE' THEN
//           v_action := 'DELETE';
//           v_entity_name := OLD.description;
//           v_org_id := OLD.organization_id;
//       END IF;
//
//       INSERT INTO public.audit_logs (organization_id, user_id, action, entity_type, entity_name, details)
//       VALUES (v_org_id, v_user_id, v_action, 'TRANSACTION', v_entity_name,
//               CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END);
//
//       RETURN COALESCE(NEW, OLD);
//   END;
//   $function$
//
// FUNCTION process_recurring_transactions()
//   CREATE OR REPLACE FUNCTION public.process_recurring_transactions()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       r RECORD;
//   BEGIN
//       FOR r IN
//           SELECT * FROM public.recurring_transactions
//           WHERE next_date <= CURRENT_DATE
//       LOOP
//           INSERT INTO public.transactions (
//               organization_id, user_id, description, amount, category, type, payment_method, date, recurring_transaction_id, account_id
//           ) VALUES (
//               r.organization_id, r.user_id, r.description, r.amount, r.category, r.type, r.payment_method, r.next_date, r.id, r.account_id
//           );
//
//           UPDATE public.recurring_transactions
//           SET next_date = CASE
//               WHEN frequency = 'monthly' THEN next_date + INTERVAL '1 month'
//               WHEN frequency = 'weekly' THEN next_date + INTERVAL '1 week'
//               WHEN frequency = 'yearly' THEN next_date + INTERVAL '1 year'
//               ELSE next_date + INTERVAL '1 month'
//           END,
//           updated_at = NOW()
//           WHERE id = r.id;
//
//           INSERT INTO public.notifications (organization_id, user_id, title, message)
//           VALUES (
//               r.organization_id, r.user_id,
//               'Gasto Recorrente',
//               'O gasto fixo "' || r.description || '" foi registrado automaticamente.'
//           );
//       END LOOP;
//   END;
//   $function$
//
// FUNCTION set_org_id_on_insert()
//   CREATE OR REPLACE FUNCTION public.set_org_id_on_insert()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       IF NEW.organization_id IS NULL THEN
//           NEW.organization_id := public.get_current_user_org_id();
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION set_transaction_org_id()
//   CREATE OR REPLACE FUNCTION public.set_transaction_org_id()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF NEW.organization_id IS NULL THEN
//       NEW.organization_id := public.get_current_user_org_id();
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: audit_logs
//   set_audit_logs_org_id_trigger: CREATE TRIGGER set_audit_logs_org_id_trigger BEFORE INSERT ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION set_org_id_on_insert()
// Table: budgets
//   set_budgets_org_id_trigger: CREATE TRIGGER set_budgets_org_id_trigger BEFORE INSERT ON public.budgets FOR EACH ROW EXECUTE FUNCTION set_org_id_on_insert()
// Table: notifications
//   set_notifications_org_id_trigger: CREATE TRIGGER set_notifications_org_id_trigger BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION set_org_id_on_insert()
// Table: parcelated_transactions
//   set_parcelated_transactions_org_id_trigger: CREATE TRIGGER set_parcelated_transactions_org_id_trigger BEFORE INSERT ON public.parcelated_transactions FOR EACH ROW EXECUTE FUNCTION set_org_id_on_insert()
// Table: profiles
//   audit_profiles_trigger: CREATE TRIGGER audit_profiles_trigger AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION log_profile_audit()
// Table: recurring_transactions
//   set_recurring_org_id_trigger: CREATE TRIGGER set_recurring_org_id_trigger BEFORE INSERT ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION set_org_id_on_insert()
// Table: transactions
//   audit_transactions_trigger: CREATE TRIGGER audit_transactions_trigger AFTER INSERT OR DELETE OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION log_transaction_audit()
//   check_budget_trigger: CREATE TRIGGER check_budget_trigger AFTER INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION check_budget_on_transaction()
//   set_transaction_org_id_trigger: CREATE TRIGGER set_transaction_org_id_trigger BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION set_transaction_org_id()

// --- INDEXES ---
// Table: categories
//   CREATE UNIQUE INDEX categories_nome_tipo_unique ON public.categories USING btree (nome, tipo)
// Table: coupons
//   CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code)
// Table: dicas_lidas
//   CREATE UNIQUE INDEX dicas_lidas_organization_id_dica_id_key ON public.dicas_lidas USING btree (organization_id, dica_id)
// Table: plans
//   CREATE UNIQUE INDEX plans_name_key ON public.plans USING btree (name)
// Table: subscriptions
//   CREATE UNIQUE INDEX subscriptions_organization_id_key ON public.subscriptions USING btree (organization_id)
// Table: transactions
//   CREATE INDEX transactions_account_id_date_idx ON public.transactions USING btree (account_id, date)
//   CREATE INDEX transactions_created_at_idx ON public.transactions USING btree (created_at DESC)
// Table: transfers
//   CREATE INDEX transfers_conta_destino_id_date_idx ON public.transfers USING btree (conta_destino_id, date)
//   CREATE INDEX transfers_conta_origem_id_date_idx ON public.transfers USING btree (conta_origem_id, date)
// Table: user_workspaces
//   CREATE UNIQUE INDEX user_workspaces_user_id_organization_id_key ON public.user_workspaces USING btree (user_id, organization_id)
