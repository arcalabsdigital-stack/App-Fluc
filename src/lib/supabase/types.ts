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
      monthly_projections: {
        Row: {
          category_name: string
          created_at: string
          id: string
          month: number
          organization_id: string
          planned_amount: number
          type: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          month: number
          organization_id: string
          planned_amount?: number
          type: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          month?: number
          organization_id?: string
          planned_amount?: number
          type?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: 'monthly_projections_organization_id_fkey'
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
      planning_summaries: {
        Row: {
          created_at: string | null
          expenses_breakdown: Json | null
          id: string
          month: number
          organization_id: string
          revenue_source: string | null
          total_expenses: number
          total_revenue: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          expenses_breakdown?: Json | null
          id?: string
          month: number
          organization_id: string
          revenue_source?: string | null
          total_expenses?: number
          total_revenue?: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          expenses_breakdown?: Json | null
          id?: string
          month?: number
          organization_id?: string
          revenue_source?: string | null
          total_expenses?: number
          total_revenue?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: 'planning_summaries_organization_id_fkey'
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
          privacy_accepted_at: string | null
          privacy_version: string | null
          razao_social_ou_nome: string | null
          role: string
          telefone: string | null
          terms_accepted_at: string | null
          terms_version: string | null
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
          privacy_accepted_at?: string | null
          privacy_version?: string | null
          razao_social_ou_nome?: string | null
          role?: string
          telefone?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
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
          privacy_accepted_at?: string | null
          privacy_version?: string | null
          razao_social_ou_nome?: string | null
          role?: string
          telefone?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
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
