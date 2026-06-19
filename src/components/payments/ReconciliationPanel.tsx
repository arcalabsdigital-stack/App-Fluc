import { useEffect, useState, useRef } from 'react'
import { accountService } from '@/services/accountService'
import { transactionService } from '@/services/transactionService'
import { supabase } from '@/lib/supabase/client'
import { Conta, Transacao, TipoTransacao } from '@/lib/types'
import { BankStatementEntry, parseOFX, parseCSV } from '@/lib/ofxParser'
import { parseBancoInterPDF } from '@/lib/pdfParser'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  Plus,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ReconType = 'match' | 'statement_only' | 'system_only'

interface ReconciliationRow {
  id: string
  type: ReconType
  statement?: BankStatementEntry
  transaction?: Transacao
  score?: 'high' | 'medium'
}

export function ReconciliationPanel() {
  const [accounts, setAccounts] = useState<Conta[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [statements, setStatements] = useState<BankStatementEntry[]>([])
  const [statementBalance, setStatementBalance] = useState<number | undefined>()
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [reconciliationData, setReconciliationData] = useState<
    ReconciliationRow[]
  >([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [prefilledTransaction, setPrefilledTransaction] = useState<any>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    accountService.getAccounts().then((accs) => {
      setAccounts(accs.filter((a) => a.is_active))
      if (accs.length > 0) setSelectedAccountId(accs[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedAccountId) {
      fetchAndMatch()
    }
  }, [selectedAccountId, statements])

  const fetchAndMatch = async () => {
    try {
      const txs = await transactionService.fetchTransactions(
        {
          search: '',
          type: 'all',
          category: 'all',
          paymentMethod: 'all',
          status: 'all',
        },
        'admin',
      )
      const eligible = txs.filter(
        (t) =>
          !t.is_conciliated &&
          (t.account_id === selectedAccountId || !t.account_id),
      )
      setTransactions(eligible)
      if (statements.length > 0) {
        matchTransactions(statements, eligible)
      }
    } catch (error) {
      console.error('Error fetching transactions for reconciliation:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      let parsedEntries: BankStatementEntry[] = []
      let parsedBalance: number | undefined

      if (file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const parsed = await parseBancoInterPDF(arrayBuffer)
          parsedEntries = parsed.entries
          parsedBalance = parsed.balance
        } catch (pdfErr) {
          console.error('PDF parsing error:', pdfErr)
          toast.error(
            'Não foi possível ler este PDF. Verifique se é um extrato do Banco Inter suportado.',
          )
          setIsProcessing(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
          return
        }
      } else {
        const content = await file.text()
        if (file.name.toLowerCase().endsWith('.ofx')) {
          const parsed = parseOFX(content)
          parsedEntries = parsed.entries
          parsedBalance = parsed.balance
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          const parsed = parseCSV(content)
          parsedEntries = parsed.entries
          parsedBalance = parsed.balance
        } else {
          toast.error('Formato não suportado. Use PDF, OFX ou CSV.')
          setIsProcessing(false)
          return
        }
      }

      setStatements(parsedEntries)
      setStatementBalance(parsedBalance)
      matchTransactions(parsedEntries, transactions)
      toast.success(`${parsedEntries.length} registros importados do extrato.`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao processar o arquivo.')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const matchTransactions = (stmts: BankStatementEntry[], txs: Transacao[]) => {
    let availableTxs = [...txs]
    const result: ReconciliationRow[] = []
    let minDate = new Date()
    let maxDate = new Date(1900, 0, 1)

    for (const stmt of stmts) {
      if (stmt.date < minDate) minDate = stmt.date
      if (stmt.date > maxDate) maxDate = stmt.date

      let bestMatch: Transacao | null = null
      let bestScore: 'high' | 'medium' | null = null

      for (const tx of availableTxs) {
        const stmtAmt = Math.abs(stmt.amount)
        const txAmt = Math.abs(tx.valor)
        const typeMatch =
          (stmt.amount < 0 && tx.tipo_id === 'Despesa') ||
          (stmt.amount >= 0 && tx.tipo_id === 'Receita')

        if (Math.abs(stmtAmt - txAmt) < 0.01 && typeMatch) {
          const daysDiff = Math.abs(differenceInDays(stmt.date, tx.data))
          if (daysDiff <= 3) {
            const stmtWords = stmt.description.toLowerCase().split(/\s+/)
            const txWords = tx.descricao.toLowerCase().split(/\s+/)
            const hasCommonWord = stmtWords.some(
              (w) => w.length > 3 && txWords.includes(w),
            )

            bestMatch = tx
            bestScore = daysDiff === 0 && hasCommonWord ? 'high' : 'medium'
            break
          }
        }
      }

      if (bestMatch) {
        availableTxs = availableTxs.filter((t) => t.id !== bestMatch!.id)
        result.push({
          id: `match_${stmt.id}`,
          type: 'match',
          statement: stmt,
          transaction: bestMatch,
          score: bestScore!,
        })
      } else {
        result.push({
          id: `stmt_${stmt.id}`,
          type: 'statement_only',
          statement: stmt,
        })
      }
    }

    for (const tx of availableTxs) {
      const daysFromStart = differenceInDays(tx.data, minDate)
      const daysFromEnd = differenceInDays(tx.data, maxDate)
      if (daysFromStart >= -3 && daysFromEnd <= 3 && tx.status !== 'aberto') {
        result.push({
          id: `tx_${tx.id}`,
          type: 'system_only',
          transaction: tx,
        })
      }
    }

    result.sort((a, b) => {
      const dateA = a.statement?.date || a.transaction?.data || new Date()
      const dateB = b.statement?.date || b.transaction?.data || new Date()
      return dateA.getTime() - dateB.getTime()
    })

    setReconciliationData(result)
  }

  const refreshAccounts = async () => {
    const accs = await accountService.getAccounts()
    setAccounts(accs.filter((a) => a.is_active))
  }

  const handleConciliate = async (index: number) => {
    const row = reconciliationData[index]
    if (!row.transaction) return

    try {
      setIsProcessing(true)
      const amountPaid = row.statement
        ? Math.abs(row.statement.amount)
        : row.transaction.valor

      if (row.transaction.id.startsWith('proj_')) {
        const { id: _id, ...rest } = row.transaction as any
        await transactionService.createTransaction({
          ...rest,
          is_conciliated: true,
          status: 'pago',
          account_id: selectedAccountId,
          amount_paid: amountPaid,
          is_recurring: false,
        })
      } else {
        await transactionService.updateTransaction(row.transaction.id, {
          is_conciliated: true,
          status: 'pago',
          account_id: selectedAccountId,
          amount_paid: amountPaid,
        })
      }
      toast.success('Transação conciliada com sucesso!')
      const newData = [...reconciliationData]
      newData.splice(index, 1)
      setReconciliationData(newData)
      await refreshAccounts()
    } catch (error) {
      toast.error('Erro ao conciliar transação.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuickCreateAndSettle = async (index: number) => {
    const row = reconciliationData[index]
    if (!row.statement) return

    try {
      setIsProcessing(true)
      const stmt = row.statement

      const newTx = {
        data: stmt.date,
        descricao: stmt.description,
        valor: Math.abs(stmt.amount),
        amount_paid: Math.abs(stmt.amount),
        categoria_id: 'Outros',
        tipo_id:
          stmt.amount < 0 ? TipoTransacao.Despesa : TipoTransacao.Receita,
        forma_pagamento_id: 'Outros',
        status: 'pago',
        is_conciliated: true,
        account_id: selectedAccountId,
        observacoes: 'Criado via conciliação inteligente',
        is_recurring: false,
      } as any

      await transactionService.createTransaction(newTx)
      toast.success('Transação criada e baixada com sucesso!')

      const newData = [...reconciliationData]
      newData.splice(index, 1)
      setReconciliationData(newData)
      await refreshAccounts()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar transação inteligente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateFromStatement = (stmt: BankStatementEntry) => {
    setPrefilledTransaction({
      data: stmt.date,
      valor: Math.abs(stmt.amount),
      amount_paid: Math.abs(stmt.amount),
      descricao: stmt.description,
      tipo_id: stmt.amount < 0 ? TipoTransacao.Despesa : TipoTransacao.Receita,
      account_id: selectedAccountId,
      status: 'pago',
      is_conciliated: true,
    })
    setCreateFormOpen(true)
  }

  const onTransactionFormClose = (open: boolean) => {
    setCreateFormOpen(open)
    if (!open && prefilledTransaction) {
      fetchAndMatch()
      refreshAccounts()
      setPrefilledTransaction(null)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  const currentAccount = accounts.find((a) => a.id === selectedAccountId)
  const saldoFluc = currentAccount?.saldo_atual || 0
  const divergence =
    statementBalance !== undefined ? saldoFluc - statementBalance : null

  const statementOnlyCount = reconciliationData.filter(
    (r) => r.type === 'statement_only',
  ).length
  const systemOnlyCount = reconciliationData.filter(
    (r) => r.type === 'system_only',
  ).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger className="w-full sm:w-[250px] bg-white">
              <SelectValue placeholder="Selecione a conta para conciliação" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full sm:w-auto">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full sm:w-auto gap-2"
          >
            {isProcessing ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {isProcessing ? 'Processando...' : 'Importar PDF/OFX/CSV'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".ofx,.csv,.pdf"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {statements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Saldo Fluc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(saldoFluc)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Saldo realizado da conta
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Saldo Extrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {statementBalance !== undefined
                  ? formatCurrency(statementBalance)
                  : 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lido do arquivo importado
              </p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'transition-colors',
              divergence === 0
                ? 'bg-green-50 border-green-200'
                : divergence !== null
                  ? 'bg-red-50 border-red-200'
                  : '',
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle
                className={cn(
                  'text-sm font-medium',
                  divergence === 0
                    ? 'text-green-700'
                    : divergence !== null
                      ? 'text-red-700'
                      : 'text-gray-500',
                )}
              >
                Divergência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-2xl font-bold',
                  divergence === 0
                    ? 'text-green-700'
                    : divergence !== null
                      ? 'text-red-700'
                      : 'text-gray-900',
                )}
              >
                {divergence !== null ? formatCurrency(divergence) : 'N/A'}
              </div>
              <p
                className={cn(
                  'text-xs mt-1 font-medium',
                  divergence === 0
                    ? 'text-green-600'
                    : divergence !== null
                      ? 'text-red-600'
                      : 'text-gray-500',
                )}
              >
                {divergence === 0
                  ? 'Saldos conferem!'
                  : divergence !== null
                    ? `Divergência causada por ${statementOnlyCount} itens apenas no extrato e ${systemOnlyCount} apenas no Fluc.`
                    : 'Saldos não comparáveis'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {reconciliationData.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <ShieldCheck className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              Nenhum extrato importado
            </h3>
            <p className="text-gray-500 max-w-md mt-2">
              Selecione uma conta e importe o arquivo (PDF, OFX, CSV) do seu
              banco para iniciar a conciliação automática.
            </p>
          </div>
        ) : (
          <div className="divide-y overflow-x-auto">
            <div className="min-w-[800px] grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm font-semibold text-gray-600">
              <div className="col-span-5">Extrato Bancário</div>
              <div className="col-span-2 text-center">Ação</div>
              <div className="col-span-5">Registro no Fluc</div>
            </div>
            {reconciliationData.map((row, i) => (
              <div
                key={row.id}
                className={cn(
                  'min-w-[800px] grid grid-cols-12 gap-4 p-4 items-center transition-colors border-l-4',
                  row.type === 'match'
                    ? 'border-green-500 hover:bg-green-50/30'
                    : row.type === 'statement_only'
                      ? 'border-amber-500 hover:bg-amber-50/30 bg-amber-50/10'
                      : 'border-red-500 hover:bg-red-50/30 bg-red-50/10',
                )}
              >
                <div className="col-span-5 flex flex-col">
                  {row.statement ? (
                    <>
                      <span
                        className="font-medium text-gray-900 truncate"
                        title={row.statement.description}
                      >
                        {row.statement.description}
                      </span>
                      <div className="flex items-center gap-3 text-sm mt-1">
                        <span className="text-gray-500">
                          {format(row.statement.date, 'dd/MM/yyyy')}
                        </span>
                        <span
                          className={cn(
                            'font-semibold',
                            row.statement.amount < 0
                              ? 'text-red-600'
                              : 'text-green-600',
                          )}
                        >
                          {formatCurrency(row.statement.amount)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 italic flex items-center text-sm gap-2">
                      <AlertCircle className="w-4 h-4" /> Não encontrado no
                      extrato
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex flex-col items-center justify-center px-2">
                  {row.type === 'match' && (
                    <Button
                      size="sm"
                      onClick={() => handleConciliate(i)}
                      className={
                        row.score === 'high'
                          ? 'bg-green-600 hover:bg-green-700 w-full'
                          : 'bg-green-500 hover:bg-green-600 w-full'
                      }
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar
                    </Button>
                  )}
                  {row.type === 'statement_only' && (
                    <div className="flex flex-col items-center gap-1 w-full">
                      <span className="text-[10px] font-medium text-amber-600 uppercase text-center leading-tight">
                        Apenas Extrato
                      </span>
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white w-full shadow-sm text-xs px-2"
                        onClick={() => handleQuickCreateAndSettle(i)}
                      >
                        <Zap className="w-3 h-3 mr-1" /> Criar e Baixar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-700 hover:bg-amber-50 w-full text-xs h-7"
                        onClick={() =>
                          handleCreateFromStatement(row.statement!)
                        }
                      >
                        Revisar Form
                      </Button>
                    </div>
                  )}
                  {row.type === 'system_only' && (
                    <div className="flex flex-col items-center gap-1 w-full">
                      <span className="text-[10px] font-medium text-red-600 uppercase flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Ausente no Extrato
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-700 border-red-300 bg-white hover:bg-red-50 w-full"
                        onClick={() => handleConciliate(i)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Forçar
                      </Button>
                    </div>
                  )}
                </div>

                <div className="col-span-5">
                  {row.transaction ? (
                    <div
                      className={cn(
                        'p-3 rounded-lg border flex flex-col bg-white shadow-sm',
                        row.type === 'match'
                          ? 'border-green-200'
                          : 'border-red-200',
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span
                          className="font-medium text-gray-900 truncate flex-1"
                          title={row.transaction.descricao}
                        >
                          {row.transaction.descricao}
                        </span>
                        <span
                          className={cn(
                            'font-bold',
                            row.transaction.tipo_id === 'Despesa'
                              ? 'text-red-600'
                              : 'text-green-600',
                          )}
                        >
                          {formatCurrency(
                            row.transaction.tipo_id === 'Despesa'
                              ? -row.transaction.valor
                              : row.transaction.valor,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-gray-500">
                          {format(row.transaction.data, 'dd/MM/yyyy')}
                        </span>
                        <span className="text-gray-500 px-2 py-0.5 bg-gray-100 rounded border truncate max-w-[150px]">
                          {row.transaction.categoria_id}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm bg-gray-50">
                      Pendente de Lançamento
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionForm
        open={createFormOpen}
        onOpenChange={onTransactionFormClose}
        initialData={prefilledTransaction}
      />
    </div>
  )
}
