import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  projectionsService,
  MonthlyProjection,
} from '@/services/projectionsService'
import { categoryService } from '@/services/categoryService'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Ritual() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const monthParam = searchParams.get('month')
  const yearParam = searchParams.get('year')

  const targetMonth = monthParam
    ? parseInt(monthParam)
    : new Date().getMonth() + 1
  const targetYear = yearParam ? parseInt(yearParam) : new Date().getFullYear()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [revenueTotal, setRevenueTotal] = useState<string>('')
  const [revenueCategories, setRevenueCategories] = useState<
    { name: string; checked: boolean }[]
  >([])

  const [fixedCosts, setFixedCosts] = useState<
    { name: string; checked: boolean; amount: string }[]
  >([
    { name: 'Aluguel', checked: false, amount: '' },
    { name: 'Salários', checked: false, amount: '' },
    { name: 'Impostos', checked: false, amount: '' },
    { name: 'Software/Sistemas', checked: false, amount: '' },
  ])
  const [variableExpenses, setVariableExpenses] = useState<
    { name: string; checked: boolean; amount: string }[]
  >([])

  useEffect(() => {
    categoryService
      .fetchCategories()
      .then((data) => {
        const receitas = data.filter((c) => c.natureza_contabil === 'Receita')
        setRevenueCategories(
          receitas.map((c) => ({ name: c.nome_simplificado, checked: false })),
        )

        const despesas = data.filter((c) => c.natureza_contabil === 'Despesa')
        setVariableExpenses(
          despesas.map((c) => ({
            name: c.nome_simplificado,
            checked: false,
            amount: '',
          })),
        )
      })
      .catch(console.error)
  }, [])

  const parseCurrency = (val: string) => {
    if (!val) return 0
    return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const handleRevenueCategoryToggle = (idx: number, checked: boolean) => {
    const newCats = [...revenueCategories]
    newCats[idx].checked = checked
    setRevenueCategories(newCats)
  }

  const handleFixedToggle = (idx: number, checked: boolean) => {
    const newCosts = [...fixedCosts]
    newCosts[idx].checked = checked
    setFixedCosts(newCosts)
  }

  const handleFixedAmount = (idx: number, amount: string) => {
    const newCosts = [...fixedCosts]
    newCosts[idx].amount = amount
    setFixedCosts(newCosts)
  }

  const handleVariableToggle = (idx: number, checked: boolean) => {
    const newExp = [...variableExpenses]
    newExp[idx].checked = checked
    setVariableExpenses(newExp)
  }

  const handleVariableAmount = (idx: number, amount: string) => {
    const newExp = [...variableExpenses]
    newExp[idx].amount = amount
    setVariableExpenses(newExp)
  }

  const totalRev = parseCurrency(revenueTotal)
  const totalExp = [...fixedCosts, ...variableExpenses]
    .filter((item) => item.checked)
    .reduce((acc, item) => acc + parseCurrency(item.amount), 0)

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const projections: MonthlyProjection[] = []

      if (totalRev > 0) {
        const selectedRevCats = revenueCategories
          .filter((c) => c.checked)
          .map((c) => c.name)
        const catName =
          selectedRevCats.length > 0
            ? selectedRevCats.join(', ')
            : 'Receitas (Geral)'

        projections.push({
          month: targetMonth,
          year: targetYear,
          category_name: catName,
          planned_amount: totalRev,
          type: 'Receita',
        })
      }

      const allExpenses = [...fixedCosts, ...variableExpenses].filter(
        (c) => c.checked && parseCurrency(c.amount) > 0,
      )
      for (const exp of allExpenses) {
        projections.push({
          month: targetMonth,
          year: targetYear,
          category_name: exp.name,
          planned_amount: parseCurrency(exp.amount),
          type: 'Despesa',
        })
      }

      await projectionsService.saveProjections(
        targetMonth,
        targetYear,
        projections,
      )
      toast.success('Projeções salvas com sucesso!')
      navigate('/diagnostico')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar projeções')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in pb-20">
      <div className="mb-8 text-center mt-6">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Ritual do Mês
        </h1>
        <p className="text-muted-foreground mt-2">
          Planejamento financeiro para{' '}
          {format(new Date(targetYear, targetMonth - 1, 1), 'MMMM yyyy', {
            locale: ptBR,
          })}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= i ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}
            >
              {step > i ? <Check className="w-4 h-4" /> : i}
            </div>
            {i < 3 && (
              <div
                className={`w-12 h-1 rounded-full ${step > i ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="border-none shadow-md">
        {step === 1 && (
          <div className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl">Projeção de Receitas</CardTitle>
              <CardDescription>
                Qual é a sua meta de faturamento para este mês?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Quanto você espera faturar este mês?
                </Label>
                <div className="relative max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    className="pl-10 text-lg h-12 font-medium"
                    placeholder="0.00"
                    value={revenueTotal}
                    onChange={(e) => setRevenueTotal(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">
                    De onde vem essa receita?
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecione as categorias aplicáveis (opcional).
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {revenueCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 border p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <Checkbox
                        id={`rev-${idx}`}
                        checked={cat.checked}
                        onCheckedChange={(c) =>
                          handleRevenueCategoryToggle(idx, c as boolean)
                        }
                      />
                      <Label
                        htmlFor={`rev-${idx}`}
                        className="flex-1 cursor-pointer font-medium"
                      >
                        {cat.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6 mt-2 bg-gray-50/50 dark:bg-gray-900/20 rounded-b-xl">
              <Button size="lg" onClick={() => setStep(2)}>
                Próximo <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl">
                Projeção de Custos e Despesas
              </CardTitle>
              <CardDescription>
                Estime seus gastos fixos e variáveis para o mês.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2 text-primary">
                  <AlertCircle className="w-5 h-5" />
                  Custos Fixos
                </Label>
                <div className="grid gap-3">
                  {fixedCosts.map((cost, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 border p-4 rounded-xl transition-all ${cost.checked ? 'bg-primary/5 border-primary/20 shadow-sm' : 'hover:border-gray-300'}`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={`fix-${idx}`}
                          checked={cost.checked}
                          onCheckedChange={(c) =>
                            handleFixedToggle(idx, c as boolean)
                          }
                        />
                        <Label
                          htmlFor={`fix-${idx}`}
                          className="flex-1 cursor-pointer font-medium text-base"
                        >
                          {cost.name}
                        </Label>
                      </div>
                      {cost.checked && (
                        <div className="relative w-full sm:w-56 animate-fade-in">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                            R$
                          </span>
                          <Input
                            className="pl-9 h-11 bg-white dark:bg-background"
                            placeholder="0.00"
                            value={cost.amount}
                            onChange={(e) =>
                              handleFixedAmount(idx, e.target.value)
                            }
                            type="number"
                            step="0.01"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2 text-orange-500">
                  <AlertCircle className="w-5 h-5" />
                  Despesas Variáveis
                </Label>
                <div className="grid gap-3">
                  {variableExpenses.map((exp, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 border p-4 rounded-xl transition-all ${exp.checked ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 shadow-sm' : 'hover:border-gray-300'}`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={`var-${idx}`}
                          checked={exp.checked}
                          onCheckedChange={(c) =>
                            handleVariableToggle(idx, c as boolean)
                          }
                        />
                        <Label
                          htmlFor={`var-${idx}`}
                          className="flex-1 cursor-pointer font-medium text-base"
                        >
                          {exp.name}
                        </Label>
                      </div>
                      {exp.checked && (
                        <div className="relative w-full sm:w-56 animate-fade-in">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                            R$
                          </span>
                          <Input
                            className="pl-9 h-11 bg-white dark:bg-background"
                            placeholder="0.00"
                            value={exp.amount}
                            onChange={(e) =>
                              handleVariableAmount(idx, e.target.value)
                            }
                            type="number"
                            step="0.01"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6 mt-2 bg-gray-50/50 dark:bg-gray-900/20 rounded-b-xl">
              <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <Button size="lg" onClick={() => setStep(3)}>
                Próximo <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-2xl font-bold">
                Resumo do Mês
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Tudo certo? Vamos acompanhar juntos!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-10">
              <div className="grid gap-4 max-w-lg mx-auto">
                <div className="flex justify-between items-center p-5 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100 rounded-2xl">
                  <span className="font-semibold">
                    Total de Receitas Projetadas
                  </span>
                  <span className="text-xl font-bold">
                    {formatCurrency(totalRev)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-5 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100 rounded-2xl">
                  <span className="font-semibold">
                    Total de Custos/Despesas
                  </span>
                  <span className="text-xl font-bold">
                    {formatCurrency(totalExp)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 mt-4 shadow-sm">
                  <span className="font-bold text-lg">Resultado Esperado</span>
                  <span
                    className={`text-3xl font-bold ${totalRev - totalExp >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(totalRev - totalExp)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row justify-between border-t pt-6 bg-gray-50/50 dark:bg-gray-900/20 rounded-b-xl gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <Button
                size="lg"
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full sm:w-auto sm:min-w-[240px]"
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar Projeção'}
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  )
}
