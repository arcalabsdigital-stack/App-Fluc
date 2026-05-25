import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'

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
import {
  Transacao,
  TipoTransacao,
  FormaPagamento,
  Categoria,
} from '@/lib/types'
import useTransactionStore from '@/stores/useTransactionStore'
import { toast } from 'sonner'

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
  tipo_id: z.nativeEnum(TipoTransacao, {
    required_error: 'Por favor selecione um tipo.',
  }),
  forma_pagamento_id: z.nativeEnum(FormaPagamento, {
    required_error: 'Por favor selecione uma forma de pagamento.',
  }),
  observacoes: z.string().optional(),
  is_recurring: z.boolean().default(false),
  parcelas: z.coerce.number().min(1).default(1),
  status: z.string().default('pago'),
})

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit?: Transacao | null
}

export function TransactionForm({
  open,
  onOpenChange,
  transactionToEdit,
}: TransactionFormProps) {
  const { categories, addTransaction, updateTransaction } =
    useTransactionStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      observacoes: '',
      categoria_id: '',
      tipo_id: TipoTransacao.Despesa,
      forma_pagamento_id: FormaPagamento.CartaoCredito,
      data: new Date(),
    },
  })

  const currentTipo = form.watch('tipo_id')
  const currentCategoria = form.watch('categoria_id')
  const currentFormaPagamento = form.watch('forma_pagamento_id')
  const parcelas = form.watch('parcelas')

  const isInstallmentEligible = !transactionToEdit

  useEffect(() => {
    if (categories && categories.length > 0) {
      const category = categories.find((c) => c.id === currentCategoria)
      if (category && category.tipo !== currentTipo) {
        form.setValue('categoria_id', '')
      }
    }
  }, [currentTipo, currentCategoria, categories, form])

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        data: transactionToEdit.data,
        descricao: transactionToEdit.descricao,
        valor: transactionToEdit.valor,
        categoria_id: transactionToEdit.categoria_id,
        tipo_id: transactionToEdit.tipo_id,
        forma_pagamento_id: transactionToEdit.forma_pagamento_id,
        observacoes: transactionToEdit.observacoes || '',
        is_recurring: !!transactionToEdit.recurring_transaction_id,
        parcelas: 1,
        status: transactionToEdit.status || 'pago',
      })
    } else {
      form.reset({
        descricao: '',
        valor: 0,
        observacoes: '',
        categoria_id: '',
        tipo_id: TipoTransacao.Despesa,
        forma_pagamento_id: FormaPagamento.CartaoCredito,
        data: new Date(),
        is_recurring: false,
        parcelas: 1,
        status: 'pago',
      })
    }
  }, [transactionToEdit, form, open])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      if (transactionToEdit) {
        await updateTransaction(transactionToEdit.id, values)
        toast.success('Transação atualizada com sucesso')
      } else {
        await addTransaction(values)
        toast.success('Transação criada com sucesso')
      }
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error('Falha ao salvar transação')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
          </SheetTitle>
          <SheetDescription>
            {transactionToEdit
              ? 'Faça alterações na sua transação aqui.'
              : 'Adicione uma nova transação aos seus registros.'}
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
                          val === 'aberto'
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
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="aberto">Em Aberto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TipoTransacao).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
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

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Compras de mercado..." {...field} />
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
                    <FormLabel>Valor</FormLabel>
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
                  const safeCategories = categories || []
                  const filteredCategories = safeCategories.filter(
                    (c) => c.tipo === form.watch('tipo_id'),
                  )
                  const grupos = Array.from(
                    new Set(
                      filteredCategories.map(
                        (c) => c.natureza_contabil || c.grupo,
                      ),
                    ),
                  ).sort()

                  return (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
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
                          {grupos.map((grupo) => (
                            <SelectGroup key={grupo}>
                              <SelectLabel>{grupo}</SelectLabel>
                              {filteredCategories
                                .filter(
                                  (c) =>
                                    (c.natureza_contabil || c.grupo) === grupo,
                                )
                                .map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.nome}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          ))}
                          {grupos.length === 0 && (
                            <SelectItem value="empty" disabled>
                              Nenhuma categoria encontrada
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

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

            {isInstallmentEligible && (
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

            {(!isInstallmentEligible || parcelas === 1) && (
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
  )
}
