import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { addMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  Loader2,
  PlusCircle,
  Info,
  Home,
  ShoppingCart,
  Briefcase,
  Car,
  Coffee,
  Zap,
  Heart,
  Smile,
  Star,
  Activity,
} from 'lucide-react'

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

const AVAILABLE_ICONS = [
  { name: 'Home', icon: Home },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Car', icon: Car },
  { name: 'Coffee', icon: Coffee },
  { name: 'Zap', icon: Zap },
  { name: 'Heart', icon: Heart },
  { name: 'Smile', icon: Smile },
  { name: 'Star', icon: Star },
  { name: 'Activity', icon: Activity },
]

const AVAILABLE_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
]

function normalizeString(str: string) {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_]/g, '')
}

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
    categories,
    categoriesLoading,
    categoriasSimplificadas,
    dicas,
    dicasLidas,
    addTransaction,
    updateTransaction,
    addCategoriaSimplificada,
    addCategory,
    markDicaLida,
  } = useTransactionStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomCatDialog, setShowCustomCatDialog] = useState(false)
  const [customCatName, setCustomCatName] = useState('')
  const [customCatGroup, setCustomCatGroup] = useState('RECEITAS')
  const [isNewGroup, setIsNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [customCatColor, setCustomCatColor] = useState(AVAILABLE_COLORS[0])
  const [customCatIcon, setCustomCatIcon] = useState('Zap')

  const uniqueGroups = useMemo(() => {
    return [...new Set(categories.map((c) => c.grupo))].sort()
  }, [categories])

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
  const selectedCat = categories.find((c) => c.id === currentCategoriaId)

  const isAsset = selectedCat?.natureza_contabil === 'Ativo'
  const isDebt = selectedCat?.natureza_contabil === 'Passivo'

  // Effect to show tips
  useEffect(() => {
    if (selectedCat && open) {
      const normalizedName = normalizeString(selectedCat.nome)
      const matchingSimplificada = categoriasSimplificadas.find(
        (cs) => normalizeString(cs.nome_simplificado) === normalizedName,
      )
      if (matchingSimplificada) {
        const tip = dicas.find(
          (d) => d.categoria_simplificada_id === matchingSimplificada.id,
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
      } else {
        setCurrentTip(null)
      }
    }
  }, [selectedCat, dicas, dicasLidas, open])

  // Effect for Auto Life span
  const ajudaVida = form.watch('ajuda_vida_util')
  useEffect(() => {
    if (isAsset && ajudaVida && selectedCat) {
      const name = selectedCat.nome.toLowerCase()
      let life = 60
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
        categoria_id:
          transactionToEdit.categoria_id ||
          (transactionToEdit as any).category ||
          '',
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
        categoria_id:
          initialData.categoria_id || (initialData as any).category || '',
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

    const normalizedName = normalizeString(customCatName)
    const normalizedGroup = normalizeString(
      isNewGroup ? newGroupName : customCatGroup,
    )

    const categoryExists = categories.some(
      (c) => normalizeString(c.nome) === normalizedName,
    )

    if (categoryExists) {
      toast.error('Esta categoria já existe.')
      return
    }

    let finalGroup = customCatGroup
    if (isNewGroup) {
      if (!newGroupName) return
      const groupExists = uniqueGroups.some(
        (g) => normalizeString(g) === normalizedGroup,
      )
      if (groupExists) {
        toast.error('Este grupo já existe.')
        return
      }
      finalGroup = newGroupName
    }

    let nat = 'Despesa',
      efeito = 'Saida' as string,
      acc = 'Resultado',
      tipo = 'Despesa' as string

    const lowerGroup = finalGroup.toLowerCase()
    if (lowerGroup.includes('receita')) {
      nat = 'Receita'
      efeito = 'Entrada'
      acc = 'Resultado'
      tipo = 'Receita'
    } else if (
      lowerGroup.includes('bens') ||
      lowerGroup.includes('direitos') ||
      lowerGroup.includes('investimentos')
    ) {
      nat = 'Ativo'
      efeito = 'Saida'
      acc = 'Ativo Não-Circulante'
      tipo = 'Despesa'
    } else if (
      lowerGroup.includes('dívida') ||
      lowerGroup.includes('divida') ||
      lowerGroup.includes('passivo')
    ) {
      nat = 'Passivo'
      efeito = 'Entrada'
      acc = 'Passivo Não-Circulante'
      tipo = 'Despesa'
    }

    const newCat = await addCategory({
      nome: customCatName,
      tipo,
      grupo: finalGroup,
      natureza_contabil: nat,
      efeito_caixa: efeito,
      accounting_group: acc,
    })

    if (newCat) {
      form.setValue('categoria_id', newCat.id)
      setShowCustomCatDialog(false)
      setCustomCatName('')
      setIsNewGroup(false)
      setNewGroupName('')
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

      const categoryName = selectedCat?.id || values.categoria_id
      const isReceita = selectedCat?.natureza_contabil === 'Receita'

      const tipoId = isReceita ? TipoTransacao.Receita : TipoTransacao.Despesa

      const finalAccountId =
        values.account_id === 'none' ? null : values.account_id

      if (transactionToEdit) {
        const payload: any = {
          ...values,
          categoria_id: categoryName,
          category: categoryName,
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
            category: categoryName,
            tipo_id: tipoId,
            forma_pagamento_id: values.forma_pagamento_id,
            data: values.data,
            status: values.status,
            observacoes: values.observacoes,
            is_recurring: values.is_recurring,
            parcelas: values.parcelas,
            account_id: finalAccountId,
          } as any)

          if (values.vida_util && values.vida_util > 0) {
            const depreciableAmount = values.valor - values.valor_residual
            const monthlyDepreciation =
              Math.round((depreciableAmount / values.vida_util) * 100) / 100

            if (monthlyDepreciation > 0) {
              const depreciacaoCat = categories.find(
                (c) => c.nome === 'Depreciação e Amortização',
              )
              if (!depreciacaoCat) {
                toast.error(
                  'Categoria "Depreciação e Amortização" não encontrada no catálogo.',
                )
                setIsSubmitting(false)
                return
              }
              await addTransaction({
                descricao: `Depreciação: ${values.descricao}`,
                valor: monthlyDepreciation,
                amount_paid: 0,
                categoria_id: depreciacaoCat.id,
                category: depreciacaoCat.id,
                tipo_id: TipoTransacao.Despesa,
                forma_pagamento_id: FormaPagamento.Transferencia,
                data: addMonths(values.data, 1),
                status: 'aberto',
                is_recurring: true,
                account_id: finalAccountId,
              } as any)
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
            category: categoryName,
            tipo_id: tipoId,
            forma_pagamento_id: values.forma_pagamento_id,
            data: values.data,
            status: values.status,
            observacoes: values.observacoes,
            parcelas: 1,
            account_id: finalAccountId,
          } as any)

          if (values.parcelas > 0) {
            const amortizacaoCat = categories.find(
              (c) => c.nome === 'Amortização de Empréstimos',
            )
            const jurosCat = categories.find(
              (c) => c.nome === 'Juros de Empréstimos',
            )
            if (!amortizacaoCat || !jurosCat) {
              toast.error(
                'Categorias de financiamento não encontradas no catálogo.',
              )
              setIsSubmitting(false)
              return
            }
            const totalComJuros = values.valor + values.juros
            const installmentAmount =
              Math.round((totalComJuros / values.parcelas) * 100) / 100
            const principalPorParcela =
              Math.round((values.valor / values.parcelas) * 100) / 100
            const jurosPorParcela =
              Math.round((installmentAmount - principalPorParcela) * 100) / 100

            for (let i = 0; i < values.parcelas; i++) {
              // Parcela principal (amortização)
              await addTransaction({
                descricao: `Parcela ${i + 1}/${values.parcelas} (Principal): ${values.descricao}`,
                valor: principalPorParcela,
                amount_paid: 0,
                categoria_id: amortizacaoCat.id,
                category: amortizacaoCat.id,
                tipo_id: TipoTransacao.Despesa,
                forma_pagamento_id: values.forma_pagamento_id,
                data: addMonths(values.data, i + 1),
                status: 'aberto',
                parcelas: 1,
                account_id: finalAccountId,
              } as any)
              // Juros da parcela (se houver)
              if (jurosPorParcela > 0) {
                await addTransaction({
                  descricao: `Juros ${i + 1}/${values.parcelas}: ${values.descricao}`,
                  valor: jurosPorParcela,
                  amount_paid: 0,
                  categoria_id: jurosCat.id,
                  category: jurosCat.id,
                  tipo_id: TipoTransacao.Despesa,
                  forma_pagamento_id: values.forma_pagamento_id,
                  data: addMonths(values.data, i + 1),
                  status: 'aberto',
                  parcelas: 1,
                  account_id: finalAccountId,
                } as any)
              }
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
            category: categoryName,
            tipo_id: tipoId,
            forma_pagamento_id: values.forma_pagamento_id,
            data: values.data,
            status: values.status,
            observacoes: values.observacoes,
            is_recurring: values.is_recurring,
            parcelas: values.parcelas,
            account_id: finalAccountId,
          } as any)
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
                        <FormLabel>Categoria</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={categoriesLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  categoriesLoading
                                    ? 'Carregando categorias...'
                                    : 'Selecione...'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesLoading ? (
                              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Carregando categorias...</span>
                              </div>
                            ) : (
                              <>
                                {uniqueGroups.map((grupo) => {
                                  const catsInGroup = categories.filter(
                                    (c) => c.grupo === grupo,
                                  )
                                  if (catsInGroup.length === 0) return null
                                  return (
                                    <SelectGroup key={grupo}>
                                      <SelectLabel className="bg-gray-50 uppercase text-xs font-bold">
                                        {grupo}
                                      </SelectLabel>
                                      {catsInGroup.map((category) => (
                                        <SelectItem
                                          key={category.id}
                                          value={category.id}
                                        >
                                          <div className="flex items-center gap-2">
                                            {category.nome}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  )
                                })}
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
                              </>
                            )}
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

      <Dialog
        open={showCustomCatDialog}
        onOpenChange={(val) => {
          setShowCustomCatDialog(val)
          if (!val) {
            setIsNewGroup(false)
            setNewGroupName('')
            setCustomCatName('')
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Categoria</DialogTitle>
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
                Grupo Principal
              </label>
              {!isNewGroup ? (
                <Select
                  value={customCatGroup}
                  onValueChange={(val) => {
                    if (val === 'NOVO_GRUPO') {
                      setIsNewGroup(true)
                    } else {
                      setCustomCatGroup(val)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueGroups.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="NOVO_GRUPO"
                      className="text-primary font-medium"
                    >
                      + Criar novo grupo...
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do novo grupo"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsNewGroup(false)
                      setNewGroupName('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCustomCatColor(color)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all',
                      customCatColor === color
                        ? 'border-black scale-110'
                        : 'border-transparent hover:scale-110',
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Ícone</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map(({ name, icon: IconComponent }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCustomCatIcon(name)}
                    className={cn(
                      'p-2 rounded-md border flex items-center justify-center hover:bg-gray-50 transition-colors',
                      customCatIcon === name
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 text-gray-500',
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                ))}
              </div>
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
              disabled={!customCatName || (isNewGroup && !newGroupName)}
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
