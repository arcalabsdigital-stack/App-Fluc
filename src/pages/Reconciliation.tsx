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
import { ShieldCheck, UploadCloud, CheckCircle2, Plus } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { TransactionForm } from '@/components/transactions/TransactionForm'

type MatchScore = 'high' | 'medium' | 'none'

interface ReconciliationRow {
  statement: BankStatementEntry
  match: Transacao | null
  score: MatchScore
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
        })
    }
  }, [selectedAccountId])

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

    for (const stmt of stmts) {
      let bestMatch: Transacao | null = null
      let bestScore: MatchScore = 'none'

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
      }

      result.push({
        statement: stmt,
        match: bestMatch,
        score: bestScore,
      })
    }

    setReconciliationData(result)
  }

  const handleConciliate = async (index: number) => {
    const row = reconciliationData[index]
    if (!row.match) return

    try {
      await transactionService.updateTransaction(row.match.id, {
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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
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
              Nenhum extrato importado
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
                key={row.statement.id}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors"
              >
                <div className="col-span-5 flex flex-col">
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
                </div>

                <div className="col-span-2 flex flex-col items-center justify-center">
                  {row.match ? (
                    <Button
                      size="sm"
                      onClick={() => handleConciliate(i)}
                      className={
                        row.score === 'high'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-amber-500 hover:bg-amber-600'
                      }
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCreateFromStatement(row.statement, i)
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" /> Registrar
                    </Button>
                  )}
                </div>

                <div className="col-span-5">
                  {row.match ? (
                    <div
                      className={`p-3 rounded-lg border flex flex-col ${row.score === 'high' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}
                    >
                      <div className="flex justify-between">
                        <span
                          className="font-medium text-gray-900 truncate max-w-[200px]"
                          title={row.match.descricao}
                        >
                          {row.match.descricao}
                        </span>
                        <span
                          className={`font-bold ${row.match.tipo_id === 'Despesa' ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {formatCurrency(
                            row.match.tipo_id === 'Despesa'
                              ? -row.match.valor
                              : row.match.valor,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-gray-500">
                          {format(row.match.data, 'dd/MM/yyyy')}
                        </span>
                        <span className="text-gray-500 px-2 py-0.5 bg-white rounded border">
                          {row.match.categoria_id}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm bg-gray-50">
                      Nenhum registro correspondente encontrado
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
