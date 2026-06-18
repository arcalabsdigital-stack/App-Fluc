import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Transacao, TipoTransacao } from '@/lib/types'
import { format } from 'date-fns'
import {
  Edit,
  Trash2,
  Download,
  Check,
  Clock,
  FileText,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react'
import useTransactionStore from '@/stores/useTransactionStore'
import { cn } from '@/lib/utils'
import { ImportTransactions } from './ImportTransactions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TransactionsTableProps {
  data: Transacao[]
  onEdit: (transaction: Transacao) => void
  onChange?: () => void
  isVisitor?: boolean
}

export function TransactionsTable({
  data,
  onEdit,
  onChange,
  isVisitor = false,
}: TransactionsTableProps) {
  const { categories, deleteTransaction, deleteTransactions, registerPayment } =
    useTransactionStore()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState<Transacao | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>('')

  useEffect(() => {
    if (paymentDialog) {
      const remaining = paymentDialog.valor - (paymentDialog.amount_paid || 0)
      setPaymentAmount(remaining.toString())
    }
  }, [paymentDialog])

  const handleRegisterPayment = async () => {
    if (!paymentDialog || !paymentAmount) return
    const amount = parseFloat(paymentAmount)
    if (amount <= 0) {
      toast.error('O valor deve ser maior que 0')
      return
    }
    try {
      await registerPayment(paymentDialog.id, amount)
      toast.success('Pagamento registrado com sucesso!')
      setPaymentDialog(null)
    } catch (error) {
      toast.error('Erro ao registrar pagamento')
    }
  }

  const getCategoryName = (idOrName: string) => {
    if (!idOrName) return 'Desconhecido'
    const category = categories.find((c) => c.id === idOrName)
    if (category) return category.nome
    return idOrName
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleExportExcel = () => {
    const dataWithCats = data.map((t) => ({
      ...t,
      categoria_id: getCategoryName(t.categoria_id),
    }))
    import('@/lib/exportUtils').then((m) => m.exportToExcel(dataWithCats))
  }

  const handleExportPDF = () => {
    const dataWithCats = data.map((t) => ({
      ...t,
      categoria_id: getCategoryName(t.categoria_id),
    }))
    import('@/lib/exportUtils').then((m) => m.exportToPDF(dataWithCats))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.map((t) => t.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setIsDeletingBulk(true)
    try {
      await deleteTransactions(selectedIds)
      setSelectedIds([])
      toast.success('Transações excluídas com sucesso!')
      if (onChange) onChange()
    } catch (error) {
      toast.error('Erro ao excluir transações')
    } finally {
      setIsDeletingBulk(false)
    }
  }

  if (data.length === 0) {
    return (
      <div className="space-y-4">
        {!isVisitor && (
          <div className="flex justify-end items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span id="btn-add-transaction">
                <ImportTransactions onSuccess={onChange} />
              </span>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
          <p className="text-gray-500 mb-2">Nenhuma transação encontrada.</p>
          <p className="text-sm text-gray-400">
            Ajuste os filtros ou adicione uma nova transação.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 font-medium">
            Total de {data.length} transações
          </div>
          {selectedIds.length > 0 && !isVisitor && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeletingBulk}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Selecionados ({selectedIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Tem certeza que deseja excluir?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a excluir {selectedIds.length} transações.
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeletingBulk ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isVisitor && (
            <span id="btn-import-csv">
              <ImportTransactions onSuccess={onChange} />
            </span>
          )}{' '}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleExportExcel}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Exportar Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPDF}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4 text-red-600" />
                Exportar PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div
        id="transactions-list"
        className="rounded-xl border bg-white shadow-sm overflow-hidden"
      >
        <Table wrapperClassName="max-h-[calc(100vh-280px)] min-h-[300px]">
          <TableHeader className="sticky top-0 z-20 bg-gray-50 shadow-sm">
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              {!isVisitor && (
                <TableHead className="w-[40px] px-4">
                  <Checkbox
                    checked={
                      selectedIds.length === data.length && data.length > 0
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAll(checked as boolean)
                    }
                    aria-label="Selecionar tudo"
                  />
                </TableHead>
              )}
              <TableHead className="w-[100px] lg:w-[100px] lg:whitespace-nowrap">
                Data
              </TableHead>
              <TableHead className="lg:max-w-[250px] lg:truncate">
                Descrição
              </TableHead>
              <TableHead className="hidden md:table-cell lg:w-[130px] lg:whitespace-nowrap">
                Categoria
              </TableHead>
              <TableHead className="hidden sm:table-cell lg:w-[100px] lg:whitespace-nowrap">
                Tipo
              </TableHead>
              <TableHead className="text-right lg:w-[110px] lg:whitespace-nowrap">
                Valor
              </TableHead>
              <TableHead className="hidden md:table-cell lg:w-[140px] lg:whitespace-nowrap lg:truncate">
                Forma de Pagamento
              </TableHead>
              <TableHead
                id="transactions-status-col"
                className="w-[110px] text-center lg:whitespace-nowrap"
              >
                Status
              </TableHead>
              <TableHead className="w-[100px] text-center lg:whitespace-nowrap">
                Conciliado
              </TableHead>
              {!isVisitor && (
                <TableHead className="w-[100px] text-right lg:whitespace-nowrap sticky right-0 z-30 bg-gray-50 shadow-[-1px_0_0_#e5e7eb]">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="group bg-white hover:bg-slate-50"
              >
                {!isVisitor && (
                  <TableCell className="w-[40px] px-4">
                    <Checkbox
                      checked={selectedIds.includes(transaction.id)}
                      onCheckedChange={(checked) =>
                        handleSelectRow(transaction.id, checked as boolean)
                      }
                      aria-label="Selecionar transação"
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium text-gray-600 lg:whitespace-nowrap">
                  {format(new Date(transaction.data), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell
                  className="font-semibold text-gray-900 lg:max-w-[250px] lg:truncate"
                  title={transaction.descricao}
                >
                  {transaction.descricao}
                </TableCell>
                <TableCell className="hidden md:table-cell lg:whitespace-nowrap">
                  <Badge
                    variant="secondary"
                    className="font-normal text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 lg:truncate lg:max-w-[110px]"
                    title={getCategoryName(transaction.categoria_id)}
                  >
                    {getCategoryName(transaction.categoria_id)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell lg:whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={
                      transaction.tipo_id === TipoTransacao.Receita
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }
                  >
                    {transaction.tipo_id}
                  </Badge>
                </TableCell>
                <TableCell
                  className={
                    'text-right font-bold lg:whitespace-nowrap ' +
                    (transaction.tipo_id === TipoTransacao.Receita
                      ? 'text-green-600'
                      : 'text-gray-900')
                  }
                >
                  {transaction.tipo_id === TipoTransacao.Despesa ? '-' : '+'}
                  {formatCurrency(transaction.valor)}
                </TableCell>
                <TableCell
                  className="hidden md:table-cell text-gray-500 text-sm lg:whitespace-nowrap lg:truncate lg:max-w-[130px]"
                  title={transaction.forma_pagamento_id}
                >
                  {transaction.forma_pagamento_id}
                </TableCell>
                <TableCell className="text-center lg:whitespace-nowrap">
                  <div
                    className={cn(
                      'inline-flex items-center justify-center h-7 px-2.5 text-xs font-medium rounded-full',
                      transaction.status === 'pago'
                        ? 'text-green-700 bg-green-50'
                        : transaction.status === 'parcial'
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-amber-700 bg-amber-50',
                    )}
                  >
                    {transaction.status === 'pago' ? (
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3 h-3" /> Realizado
                      </span>
                    ) : transaction.status === 'parcial' ? (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Parcial
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center lg:whitespace-nowrap">
                  {transaction.is_conciliated ? (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Sim
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-500 border-gray-200"
                    >
                      Não
                    </Badge>
                  )}
                </TableCell>
                {!isVisitor && (
                  <TableCell className="text-right lg:whitespace-nowrap sticky right-0 z-10 bg-white group-hover:bg-slate-50 shadow-[-1px_0_0_#e5e7eb] transition-colors">
                    <div className="flex items-center justify-end gap-2">
                      {transaction.status !== 'pago' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setPaymentDialog(transaction)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Baixar</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => onEdit(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Tem certeza que deseja excluir?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá
                              permanentemente o registro da transação.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={async () => {
                                try {
                                  await deleteTransaction(transaction.id)
                                  toast.success(
                                    'Transação excluída com sucesso!',
                                  )
                                  if (onChange) onChange()
                                } catch (error) {
                                  toast.error('Erro ao excluir transação')
                                }
                              }}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!paymentDialog}
        onOpenChange={(val) => !val && setPaymentDialog(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento / Baixa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-sm text-gray-500">
              Valor Total:{' '}
              {paymentDialog && formatCurrency(paymentDialog.valor)}
              <br />
              Valor Já Pago:{' '}
              {paymentDialog && formatCurrency(paymentDialog.amount_paid || 0)}
              <br />
              <strong>
                Saldo Restante:{' '}
                {paymentDialog &&
                  formatCurrency(
                    paymentDialog.valor - (paymentDialog.amount_paid || 0),
                  )}
              </strong>
            </div>
            <div className="grid gap-2">
              <label htmlFor="payment" className="text-sm font-medium">
                Valor da Baixa (R$)
              </label>
              <Input
                id="payment"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              {paymentDialog &&
                parseFloat(paymentAmount) <
                  paymentDialog.valor - (paymentDialog.amount_paid || 0) && (
                  <p className="text-xs text-amber-600">
                    Este valor resultará em uma baixa parcial.
                  </p>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPayment}>Confirmar Baixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
