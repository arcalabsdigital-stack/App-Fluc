import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { dashboardService } from '@/services/dashboardService'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Planejamento() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const month = parseInt(
    searchParams.get('month') || String(new Date().getMonth() + 1),
  )
  const year = parseInt(
    searchParams.get('year') || String(new Date().getFullYear()),
  )

  const [categories, setCategories] = useState<any[]>([])
  const [projections, setProjections] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setInitialLoading(true)
      try {
        const cats = await dashboardService.getCategories()
        setCategories(cats)

        const existing = await dashboardService.getProjections(month, year)
        const map: Record<string, number> = {}
        existing.forEach((p) => {
          map[p.category_name] = Number(p.planned_amount)
        })
        setProjections(map)
      } catch (error) {
        toast.error('Erro ao carregar dados do planejamento')
      } finally {
        setInitialLoading(false)
      }
    }
    load()
  }, [month, year])

  const handleValueChange = (catName: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setProjections((prev) => ({
      ...prev,
      [catName]: numValue,
    }))
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const toSave = categories
        .map((c) => ({
          month,
          year,
          category_name: c.nome,
          planned_amount: projections[c.nome] || 0,
          type: c.tipo,
        }))
        .filter((p) => p.planned_amount > 0)

      await dashboardService.saveProjections(month, year, toSave)
      toast.success('Projeções salvas com sucesso!')
      navigate('/diagnostico')
    } catch (e) {
      toast.error('Erro ao salvar projeções')
    } finally {
      setLoading(false)
    }
  }

  const monthName = format(new Date(year, month - 1), 'MMMM', { locale: ptBR })

  const receitas = categories.filter((c) => c.tipo === 'Receita')
  const despesas = categories.filter((c) => c.tipo === 'Despesa')

  if (initialLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Carregando planejamento...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Planejamento Mensal
          </h1>
          <p className="text-gray-500 capitalize">
            Defina suas metas para {monthName} de {year}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/diagnostico')}>
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-green-600">
              Receitas Planejadas
            </CardTitle>
            <CardDescription>O que você espera receber?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {receitas.map((c) => (
              <div key={c.id} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {c.nome}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={projections[c.nome] || ''}
                  onChange={(e) => handleValueChange(c.nome, e.target.value)}
                />
              </div>
            ))}
            {receitas.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhuma categoria de receita cadastrada.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-red-500">
              Despesas Planejadas
            </CardTitle>
            <CardDescription>Qual é o seu limite de gastos?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {despesas.map((c) => (
              <div key={c.id} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {c.nome}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={projections[c.nome] || ''}
                  onChange={(e) => handleValueChange(c.nome, e.target.value)}
                />
              </div>
            ))}
            {despesas.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhuma categoria de despesa cadastrada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button size="lg" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Salvando...' : 'Confirmar Projeção'}
        </Button>
      </div>
    </div>
  )
}
