import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { addMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2, PlusCircle, Info } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Transacao, TipoTransacao, FormaPagamento, Conta } from '@/lib/types'
import useTransactionStore from '@/stores/useTransactionStore'
import { accountService } from '@/services/accountService'
import { toast } from 'sonner'

const TIPO_GRUPOS = [
  'RECEITAS',
  'CUSTOS DIRETOS',
  'DESPESAS OPERACIONAIS',
  'BENS E DIREITOS',
  'DÍVIDAS',
]

const formSchema = z.object({
  data: z.date({
    required_error: 'Data é obrigatória',
  }),
  descricao: z.string().min(2, {
    message: 'A descrição deve ter pelo menos 2 caracteres.',
  }),
  valor: z.coerce.number().min(0.01, {
    message: 'O valor deve ser maior que 0.',
  }),
  categoria_id: z.string({
    required_error: 'Por favor selecione uma categoria.',
  }),
  forma_pagamento_id: z.nativeEnum(FormaPagamento, {
    required_error: 'Por favor selecione uma forma de pagamento.',
  }),
  observacoes: z.string().optional(),
  is_recurring: z.boolean().default(false),
  parcelas: z.coerce.number().min(1).default(1),
  status: z.string().default('aberto'),

  // Bens e Direitos
  valor_residual: z.coerce.number().default(0),
  ajuda_vida_util: z.boolean().default(true),
  vida_util: z.coerce.number().default(60),

  // Dividas
  juros: z.coerce.number().default(0),

  account_id: z.string().optional().nullable(),
})

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit?: Transacao | null
  initialData?: Partial<Transacao> | null
}

export function TransactionForm({
  open,
  onOpenChange,
  transactionToEdit,
  initialData,
}: TransactionFormProps) {
  const {
    categoriasSimplificadas,
    dicas,
    dicasLidas,
    addTransaction,
    updateTransaction,
    addCategoriaSimplificada,
    markDicaLida,
  } = useTransactionStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomCatDialog, setShowCustomCatDialog] = useState(false)
  const [customCatName, setCustomCatName] = useState('')
  const [customCatGroup, setCustomCatGroup] = useState('RECEITAS')

  const [currentTip, setCurrentTip] = useState<{
    id: string
    titulo: string
    descricao: string
  } | null>(null)

  const [scopeModalOpen, setScopeModalOpen] = useState(false)
  const [pendingValues, setPendingValues] = useState<z.infer<
    typeof formSchema
  > | null>(null)

  const [accounts, setAccounts] = useState<Conta[]>([])

  useEffect(() => {
    if (open) {
      accountService.getAccounts().then(setAccounts).catch(console.error)
    }
  }, [open])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      observacoes: '',
      categoria_id: '',
      forma_pagamento_id: FormaPagamento.Pix,
      data: new Date(),
      is_recurring: false,
      parcelas: 1,
      status: 'aberto',
      valor_residual: 0,
      ajuda_vida_util: true,
      vida_util: 60,
      juros: 0,
    },
  })

  const currentCategoriaId = form.watch('categoria_id')
  const selectedCat = categoriasSimplificadas.find(
    (c) =>
      c.nome_simplificado === currentCategoriaId || c.id === currentCategoriaId,
  )

  const isAsset = selectedCat?.tipo_grupo === 'BENS E DIREITOS'
  const isDebt = selectedCat?.tipo_grupo === 'DÍVIDAS'

  // Effect to show tips
  useEffect(() => {
    if (selectedCat && open) {
      const tip = dicas.find(
        (d) => d.categoria_simplificada_id === selectedCat.id,
      )
      if (tip && !dicasLidas.includes(tip.id)) {
        setCurrentTip({
          id: tip.id,
          titulo: tip.titulo,
          descricao: tip.descricao,
        })
      } else {
        setCurrentTip(null)
      }
    }
  }, [selectedCat, dicas, dicasLidas, open])

  // Effect for Auto Life span
  const ajudaVida = form.watch('ajuda_vida_util')
  useEffect(() => {
    if (isAsset && ajudaVida && selectedCat) {
      const name = selectedCat.nome_simplificado.toLowerCase()
      let life = 60 // 5 years default
      if (name.includes('máquina') || name.includes('maquina')) life = 120
      if (name.includes('computador') || name.includes('ti')) life = 36
      if (name.includes('veículo') || name.includes('carro')) life = 60
      if (name.includes('reforma') || name.includes('imóvel')) life = 240
      form.setValue('vida_util', life)
    }
  }, [isAsset, ajudaVida, selectedCat, form])

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        data: transactionToEdit.data,
        descricao: transactionToEdit.descricao,
        valor: transactionToEdit.valor,
        categoria_id: transactionToEdit.categoria_id,
        forma_pagamento_id: transactionToEdit.forma_pagamento_id,
        observacoes: transactionToEdit.observacoes || '',
        is_recurring: !!transactionToEdit.recurring_transaction_id,
        parcelas: transactionToEdit.parcelas || 1,
        status: transactionToEdit.status || 'aberto',
        valor_residual: 0,
        ajuda_vida_util: true,
        vida_util: 60,
        juros: 0,
        account_id: transactionToEdit.account_id || null,
      })
    } else if (open && initialData) {
      form.reset({
        descricao: initialData.descricao || '',
        valor: initialData.valor || 0,
        observacoes: '',
        categoria_id: '',
        forma_pagamento_id: FormaPagamento.Pix,
        data: initialData.data || new Date(),
        is_recurring: false,
        parcelas: 1,
        status: 'aberto',
        valor_residual: 0,
        ajuda_vida_util: true,
        vida_util: 60,
        juros: 0,
        account_id: initialData.account_id || null,
      })
    } else if (open) {
      form.reset({
        descricao: '',
        valor: 0,
        observacoes: '',
        categoria_id: '',
        forma_pagamento_id: FormaPagamento.Pix,
        data: new Date(),
        is_recurring: false,
        parcelas: 1,
        status: 'aberto',
        valor_residual: 0,
        ajuda_vida_util: true,
        vida_util: 60,
        juros: 0,
        account_id: null,
      })
    }
  }, [transactionToEdit, initialData, form, open])

  async function handleCreateCustomCategory() {
    if (!customCatName || customCatName.length < 2) return

    let nat = 'Despesa',
      efeito = 'Caixa_Negativo',
      acc = 'Resultado'
    if (customCatGroup === 'RECEITAS') {
      nat = 'Receita'
      efeito = 'Caixa_Positivo'
      acc = 'Resultado'
    } else if (customCatGroup === 'BENS E DIREITOS') {
      nat = 'Ativo'
      efeito = 'Caixa_Negativo'
      acc = 'Ativo Não-Circulante'
    } else if (customCatGroup === 'DÍVIDAS') {
      nat = 'Passivo'
      efeito = 'Caixa_Positivo'
      acc = 'Passivo Não-Circulante'
    }

    const newCat = await addCategoriaSimplificada({
      nome_simplificado: customCatName,
      tipo_grupo: customCatGroup,
      natureza_contabil: nat,
      efeito_caixa: efeito,
      accounting_group: acc,
    })

    if (newCat) {
      form.setValue('categoria_id', newCat.nome_simplificado)
      setShowCustomCatDialog(false)
      setCustomCatName('')
      toast.success('Categoria criada!')
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (
      transactionToEdit &&
      (transactionToEdit.recurring_transaction_id ||
        transactionToEdit.id.startsWith('proj_') ||
        transactionToEdit.is_recurring)
    ) {
      setPendingValues(values)
      setScopeModalOpen(true)
      return
    }
    await executeSubmit(values, 'single')
  }

  async function executeSubmit(
    values: z.infer<typeof formSchema>,
    scope: string,
  ) {
    try {
      setIsSubmitting(true)

      const categoryName = selectedCat?.nome_simplificado || values.categoria_id
      const tipoId =
        selectedCat?.tipo_grupo === 'RECEITAS' ||
        selectedCat?.tipo_grupo === 'DÍVIDAS'
          ? TipoTransacao.Receita
          : TipoTransacao.Despesa

      const finalAccountId =
        values.account_id === 'none' ? null : values.account_id

      if (transactionToEdit) {
        const payload: Partial<Transacao> = {
          ...values,
          categoria_id: categoryName,
          tipo_id: tipoId,
          account_id: finalAccountId,
        }

        if (values.status === 'pago' && transactionToEdit.status !== 'pago') {
          payload.amount_paid = values.valor
        } else if (
          values.status === 'aberto' &&
          transactionToEdit.status !== 'aberto'
        ) {
          payload.amount_paid = 0
        }

        if (scope !== 'single') {
          await useTransactionStore.getState().updateTransactionScope(
            transactionToEdit.id,
            {
              ...payload,
              recurring_transaction_id:
                transactionToEdit.recurring_transaction_id,
            },
            scope,
          )
          toast.success('Série recorrente atualizada')
          window.location.reload()
        } else {
          await updateTransaction(transactionToEdit.id, payload)
          toast.success('Transação atualizada com sucesso')
        }
      } else {
        if (isAsset) {
          await addTransaction({
            descricao: values.descricao,
            valor: values.valor,
            amount_paid: values.status === 'pago' ? values.valor : 0,
            categoria_id: categoryName,
            tipo_id: tipoId,
            forma_pagamento_id: values.forma_pagamento_id,
            data: values.data,
            status: values.status,
            observacoes: values.observacoes,
            is_recurring: values.is_recurring,
            parcelas: values.parcelas,
            account_id: finalAccountId,
          })

          if (values.vida_util && values.vida_util > 0) {
            const depreciableAmount = values.valor - values.valor_residual
            const monthlyDepreciation = depreciableAmount / values.vida_util

            if (monthlyDepreciation > 0) {
              await addTransaction({
                descricao: `Depreciação: ${values.descricao}`,
                valor: monthlyDepreciation,
                amount_paid: 0,
                categoria_id: 'Depreciação e Amortização',
                tipo_id: TipoTransacao.Despesa,
                forma_pagamento_id: FormaPagamento.Transferencia,
                data: addMonths(values.data, 1),
                status: 'aberto',
                is_recurring: true,
                account_id: finalAccountId,
              })
              toast.success('Ativo e Depreciação Automática criados!')
            }
          } else {
            toast.success('Ativo criado com sucesso!')
          }
        } else if (isDebt) {
          await addTransaction({
            descricao: `Empréstimo/Financiamento: ${values.descricao}`,
            valor: values.valor,
            amount_paid: values.status === 'pago' ? values.valor : 0,
            categoria_id: categoryName,
            tipo_id: tipoId,
            forma_pagamento_id: values.forma_pagamento_id,
            data: values.data,
            status: values.status,
            observacoes: values.observacoes,
            parcelas: 1,
            account_id: finalAccountId,
          })

          if (values.parcelas > 0) {
            const installmentAmount =
              (values.valor + values.juros) / values.parcelas
            for (let i = 0; i < values.parcelas; i++) {
              await addTransaction({
                descricao: `Parcela ${i + 1}/${values.parcelas}: ${values.descricao}`,
                valor: installmentAmount,
                amount_paid: 0,
                categoria_id: 'Pagamento de Dívidas',
                tipo_id: TipoTransacao.Despesa,
                forma_pagamento_id: values.forma_pagamento_id,
                data: addMonths(values.data, i + 1),
                status: 'aberto',
                parcelas: 1,
                account_id: finalAccountId,
              })
            }
            toast.success('Dívida e parcelas geradas com sucesso!')
          } else {
            toast.success('Dívida criada com sucesso!')
          }
        } else {
          await addTransaction({
            descricao: values.descricao,
            valor: values.valor,
            amount_paid: values.status === 'pago' ? values.valor : 0,
            categoria_id: categoryName,
            tipo_id: tipoId,
            forma_pagamento_id: values.forma_pagamento_id,
            data: values.data,
            status: values.status,
            observacoes: values.observacoes,
            is_recurring: values.is_recurring,
            parcelas: values.parcelas,
            account_id: finalAccountId,
          })
          toast.success('Transação criada com sucesso')
        }
      }
      onOpenChange(false)
      form.reset()
      setScopeModalOpen(false)
    } catch (error) {
      toast.error('Falha ao salvar transação')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-md w-full">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
            </SheetTitle>
            <SheetDescription>
              {transactionToEdit
                ? 'Faça alterações na sua transação aqui.'
                : 'Registre movimentações com linguagem simples. O Fluc fará a contabilidade por você!'}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          if (
                            transactionToEdit?.status === 'pago' &&
                            val !== 'pago'
                          ) {
                            toast.error(
                              'Transações pagas não podem ser reabertas. Exclua e crie uma nova.',
                            )
                            return
                          }
                          field.onChange(val)
                        }}
                        value={field.value}
                        disabled={transactionToEdit?.status === 'pago'}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aberto">
                            Pendente (Projetado)
                          </SelectItem>
                          <SelectItem value="pago">
                            Pago/Recebido (Realizado)
                          </SelectItem>
                          <SelectItem value="parcial">
                            Pago/Recebido Parcialmente
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="flex flex-col mt-2.5">
                      <FormLabel className="mb-1">Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date('1900-01-01')}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Compra de Notebook, Mensalidade..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria_id"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Categoria Simplificada</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIPO_GRUPOS.map((grupo) => (
                              <SelectGroup key={grupo}>
                                <SelectLabel className="bg-gray-50 uppercase text-xs font-bold">
                                  {grupo}
                                </SelectLabel>
                                {categoriasSimplificadas
                                  .filter((c) => c.tipo_grupo === grupo)
                                  .map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.nome_simplificado}
                                    >
                                      {category.nome_simplificado}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            ))}
                            <SelectGroup>
                              <Button
                                variant="ghost"
                                className="w-full justify-start font-normal text-primary hover:text-primary mt-2"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setShowCustomCatDialog(true)
                                }}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Criar nova categoria
                              </Button>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

              {isAsset && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-4 animate-fade-in-up">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Gestão de Ativos (Bens)
                  </h4>
                  <p className="text-sm text-blue-800">
                    O Fluc irá gerar a depreciação automática deste bem
                    mensalmente.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="valor_residual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Residual (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Valor estimado no final da vida útil
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vida_util"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vida Útil (meses)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              disabled={ajudaVida}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ajuda_vida_util"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-white">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">
                            Me ajuda com a vida útil
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {isDebt && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg space-y-4 animate-fade-in-up">
                  <h4 className="font-semibold text-red-900 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Gestão de Dívidas
                  </h4>
                  <p className="text-sm text-red-800">
                    Dividiremos essa obrigação automaticamente em parcelas a
                    pagar.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="juros"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total de Juros (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parcelas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qtd. Parcelas</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="360" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch('parcelas') > 1 && (
                    <div className="text-sm font-medium text-red-800 p-2 bg-red-100 rounded">
                      Próxima parcela:{' '}
                      {(
                        (form.watch('valor') + form.watch('juros')) /
                        form.watch('parcelas')
                      ).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}{' '}
                      em{' '}
                      {format(addMonths(form.watch('data'), 1), 'dd/MM/yyyy')}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="forma_pagamento_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(FormaPagamento).map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta Bancária</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a conta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem
                            value="none"
                            className="text-gray-500 italic"
                          >
                            Sem conta atrelada
                          </SelectItem>
                          {accounts
                            .filter((a) => a.is_active)
                            .map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.nome} ({acc.tipo})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionais..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isAsset && !isDebt && !transactionToEdit && (
                <FormField
                  control={form.control}
                  name="parcelas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Parcelas</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="72" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!isAsset && !isDebt && form.watch('parcelas') === 1 && (
                <FormField
                  control={form.control}
                  name="is_recurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Transação Recorrente
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Repetir esta transação automaticamente todos os meses.
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <SheetFooter>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : transactionToEdit ? (
                    'Salvar Alterações'
                  ) : (
                    'Criar Transação'
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <Dialog open={showCustomCatDialog} onOpenChange={setShowCustomCatDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria Simplificada</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome da Categoria
              </label>
              <Input
                id="name"
                value={customCatName}
                onChange={(e) => setCustomCatName(e.target.value)}
                placeholder="Ex: Assinatura de Software"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="group" className="text-sm font-medium">
                Tipo (Isso define a classificação contábil)
              </label>
              <Select value={customCatGroup} onValueChange={setCustomCatGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_GRUPOS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomCatDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCustomCategory}
              disabled={!customCatName}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!currentTip}
        onOpenChange={(val) => !val && setCurrentTip(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Info className="w-5 h-5" />
              {currentTip?.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-700">{currentTip?.descricao}</div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (currentTip) markDicaLida(currentTip.id)
                setCurrentTip(null)
              }}
            >
              Entendi e não mostrar mais
            </Button>
            <Button onClick={() => setCurrentTip(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scopeModalOpen} onOpenChange={setScopeModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar transação recorrente</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-700">
            Você está editando uma transação que se repete. Como deseja aplicar
            esta alteração?
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => executeSubmit(pendingValues!, 'só esta')}
            >
              só esta
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => executeSubmit(pendingValues!, 'esta e as futuras')}
            >
              esta e as futuras
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => executeSubmit(pendingValues!, 'toda a série')}
            >
              toda a série
            </Button>
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setScopeModalOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
