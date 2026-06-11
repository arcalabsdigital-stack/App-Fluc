import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { ImportTransactions } from '@/components/transactions/ImportTransactions'
import {
  TransactionFilters,
  FilterState,
} from '@/components/transactions/TransactionFilters'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import useTransactionStore from '@/stores/useTransactionStore'
import { Transacao } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'
import AccessDenied from '@/pages/AccessDenied'
import { WeeklyMaturityCard } from '@/components/payments/WeeklyMaturityCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReconciliationPanel } from '@/components/payments/ReconciliationPanel'

const Payments = () => {
  const { transactions, fetchTransactions, isLoading } = useTransactionStore()
  const { role } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transacao | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    category: 'all',
    paymentMethod: 'all',
    status: 'all',
    dateRange: undefined,
  })

  // Fetch transactions when filters change
  useEffect(() => {
    if (!role) return

    // Add debounce for search/filter changes to prevent rapid requests
    const timer = setTimeout(() => {
      fetchTransactions(filters, role)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, fetchTransactions, role]) // fetchTransactions is stable

  const handleImportSuccess = () => {
    if (role) {
      fetchTransactions(filters, role)
    }
  }

  const handleCreate = () => {
    setEditingTransaction(null)
    setIsFormOpen(true)
  }

  const handleEdit = (transaction: Transacao) => {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  const isVisitor = role === 'visitante'

  // Show loading state if loading is true
  const showLoading = isLoading

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in pb-10 px-0 sm:px-0">
      <Tabs defaultValue="transactions" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Transações
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              Gerencie seus registros financeiros e conciliação bancária.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="transactions" className="flex-1 sm:flex-none">
                Registros
              </TabsTrigger>
              {!isVisitor && (
                <TabsTrigger
                  value="reconciliation"
                  className="flex-1 sm:flex-none"
                >
                  Conciliação
                </TabsTrigger>
              )}
            </TabsList>

            {!isVisitor && (
              <div className="flex gap-2 w-full sm:w-auto">
                <ImportTransactions onSuccess={handleImportSuccess} />
                <Button
                  onClick={handleCreate}
                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </div>
            )}
          </div>
        </div>

        <TabsContent
          value="transactions"
          className="space-y-4 sm:space-y-6 mt-0"
        >
          {!isVisitor && <WeeklyMaturityCard />}

          <TransactionFilters filters={filters} setFilters={setFilters} />

          {showLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <TransactionsTable
              data={transactions}
              onEdit={handleEdit}
              onImportSuccess={handleImportSuccess}
              isVisitor={isVisitor}
            />
          )}
        </TabsContent>

        {!isVisitor && (
          <TabsContent value="reconciliation" className="mt-0">
            <ReconciliationPanel />
          </TabsContent>
        )}
      </Tabs>

      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transactionToEdit={editingTransaction}
      />
    </div>
  )
}

export default Payments
