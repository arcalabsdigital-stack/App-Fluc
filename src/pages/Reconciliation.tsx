import { useEffect, useState, useRef } from 'react'
import { accountService } from '@/services/accountService'
import { transactionService } from '@/services/transactionService'
import { Conta, Transacao, TipoTransacao } from '@/lib/types'
import { BankStatementEntry, parseOFX, parseCSV } from '@/lib/ofxParser'
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
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { TransactionForm } from '@/components/transactions/TransactionForm'

type ReconType = 'match' | 'statement_only' | 'system_only'

interface ReconciliationRow {
  id: string
  type: ReconType
  statement?: BankStatementEntry
  transaction?: Transacao
  score?: 'high' | 'medium'
}

export default function ReconciliationPage() {
  const [accounts, setAccounts] = useState<Conta[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [statements, setStatements] = useState<BankStatementEntry[]>([])
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [reconciliationData, setReconciliationData] = useState<
    ReconciliationRow[]
  >([])

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
      transactionService
        .fetchTransactions(
          {
            search: '',
            type: 'all',
            category: 'all',
            paymentMethod: 'all',
            status: 'all',
          },
          'admin',
        )
        .then((txs) => {
          const eligible = txs.filter(
            (t) =>
              !t.is_conciliated &&
              (t.account_id === selectedAccountId || !t.account_id),
          )
          setTransactions(eligible)
          if (statements.length > 0) {
            matchTransactions(statements, eligible)
          }
        })
    }
  }, [selectedAccountId, statements])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      let entries: BankStatementEntry[] = []

      if (file.name.toLowerCase().endsWith('.ofx')) {
        entries = parseOFX(content)
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        entries = parseCSV(content)
      } else {
        toast.error('Formato não suportado. Use OFX ou CSV.')
        return
      }

      setStatements(entries)
      matchTransactions(entries, transactions)
      toast.success(`${entries.length} registros importados do extrato.`)
    }
    reader.readAsText(file)
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
            bestMatch = tx
            bestScore = daysDiff === 0 ? 'high' : 'medium'
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

  const handleConciliate = async (index: number) => {
    const row = reconciliationData[index]
    if (!row.transaction) return

    try {
      await transactionService.updateTransaction(row.transaction.id, {
        is_conciliated: true,
        status: 'pago',
        account_id: selectedAccountId,
      })

      toast.success('Transação conciliada com sucesso!')

      const newData = [...reconciliationData]
      newData.splice(index, 1)
      setReconciliationData(newData)
    } catch (error) {
      toast.error('Erro ao conciliar transação.')
    }
  }

  const handleCreateFromStatement = (
    stmt: BankStatementEntry,
    index: number,
  ) => {
    setPrefilledTransaction({
      data: stmt.date,
      valor: Math.abs(stmt.amount),
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
      transactionService
        .fetchTransactions(
          {
            search: '',
            type: 'all',
            category: 'all',
            paymentMethod: 'all',
            status: 'all',
          },
          'admin',
        )
        .then((txs) => {
          const eligible = txs.filter(
            (t) =>
              !t.is_conciliated &&
              (t.account_id === selectedAccountId || !t.account_id),
          )
          setTransactions(eligible)
          matchTransactions(statements, eligible)
        })
      setPrefilledTransaction(null)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Conciliação
            Bancária
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Sincronize seu extrato bancário com os registros do sistema.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            <UploadCloud className="w-4 h-4 mr-2" /> Importar OFX/CSV
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".ofx,.csv"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {reconciliationData.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <ShieldCheck className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              Nenhum extrato importado ou todos conciliados
            </h3>
            <p className="text-gray-500 max-w-md mt-2">
              Selecione uma conta e importe o arquivo OFX ou CSV do seu banco
              para iniciar a conciliação automática.
            </p>
            <Button
              className="mt-6"
              onClick={() => fileInputRef.current?.click()}
            >
              Importar Arquivo
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm font-semibold text-gray-600">
              <div className="col-span-5">Extrato Bancário</div>
              <div className="col-span-2 text-center">Ação</div>
              <div className="col-span-5">Registro no Fluc</div>
            </div>
            {reconciliationData.map((row, i) => (
              <div
                key={row.id}
                className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors border-l-4 ${
                  row.type === 'match'
                    ? 'border-green-500 hover:bg-green-50/30'
                    : row.type === 'statement_only'
                      ? 'border-amber-500 hover:bg-amber-50/30 bg-amber-50/10'
                      : 'border-red-500 hover:bg-red-50/30 bg-red-50/10'
                }`}
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
                          className={`font-semibold ${row.statement.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {formatCurrency(row.statement.amount)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 italic flex items-center text-sm gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Não encontrado no extrato bancário
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex flex-col items-center justify-center">
                  {row.type === 'match' && (
                    <Button
                      size="sm"
                      onClick={() => handleConciliate(i)}
                      className={
                        row.score === 'high'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-green-500 hover:bg-green-600'
                      }
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar
                    </Button>
                  )}
                  {row.type === 'statement_only' && (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-amber-600 uppercase">
                        Sugestão
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-700 border-amber-300 bg-white hover:bg-amber-50 w-full"
                        onClick={() =>
                          handleCreateFromStatement(row.statement!, i)
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" /> Criar Lançamento
                      </Button>
                    </div>
                  )}
                  {row.type === 'system_only' && (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-red-600 uppercase flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Divergência
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-700 border-red-300 bg-white hover:bg-red-50 w-full"
                        onClick={() => handleConciliate(i)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Forçar Baixa
                      </Button>
                    </div>
                  )}
                </div>

                <div className="col-span-5">
                  {row.transaction ? (
                    <div
                      className={`p-3 rounded-lg border flex flex-col bg-white shadow-sm ${
                        row.type === 'match'
                          ? 'border-green-200'
                          : 'border-red-200'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span
                          className="font-medium text-gray-900 truncate max-w-[200px]"
                          title={row.transaction.descricao}
                        >
                          {row.transaction.descricao}
                        </span>
                        <span
                          className={`font-bold ${row.transaction.tipo_id === 'Despesa' ? 'text-red-600' : 'text-green-600'}`}
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
                        <span className="text-gray-500 px-2 py-0.5 bg-gray-100 rounded border">
                          {row.transaction.categoria_id}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm bg-gray-50">
                      Pendente no Sistema
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
