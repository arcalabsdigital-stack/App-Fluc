import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Lock, Tag, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  categoryService,
  Category,
  NaturezaContabil,
  EfeitoCaixa,
} from '@/services/categoryService'
import * as Icons from 'lucide-react'

type CategoryTypeOptionKey =
  | 'receita'
  | 'despesa'
  | 'despesa_sem_caixa'
  | 'ativo_compra'
  | 'passivo_emprestimo_rec'
  | 'passivo_emprestimo_pag'

interface CategoryTypeOption {
  key: CategoryTypeOptionKey
  label: string
  natureza_contabil: NaturezaContabil
  efeito_caixa: EfeitoCaixa
  tipo: 'Receita' | 'Despesa'
}

const CATEGORY_TYPE_OPTIONS: CategoryTypeOption[] = [
  {
    key: 'receita',
    label: 'Receita',
    natureza_contabil: 'Receita',
    efeito_caixa: 'Entrada',
    tipo: 'Receita',
  },
  {
    key: 'despesa',
    label: 'Despesa',
    natureza_contabil: 'Despesa',
    efeito_caixa: 'Saida',
    tipo: 'Despesa',
  },
  {
    key: 'despesa_sem_caixa',
    label: 'Despesa sem saída de caixa (depreciação)',
    natureza_contabil: 'Despesa',
    efeito_caixa: 'Sem_efeito',
    tipo: 'Despesa',
  },
  {
    key: 'ativo_compra',
    label: 'Compra de bem ou investimento',
    natureza_contabil: 'Ativo',
    efeito_caixa: 'Saida',
    tipo: 'Despesa',
  },
  {
    key: 'passivo_emprestimo_rec',
    label: 'Empréstimo ou financiamento recebido',
    natureza_contabil: 'Passivo',
    efeito_caixa: 'Entrada',
    tipo: 'Despesa',
  },
  {
    key: 'passivo_emprestimo_pag',
    label: 'Pagamento de empréstimo',
    natureza_contabil: 'Passivo',
    efeito_caixa: 'Saida',
    tipo: 'Despesa',
  },
]

const getOptionKeyFromCategory = (
  natureza: NaturezaContabil,
  efeito: EfeitoCaixa,
): CategoryTypeOptionKey => {
  const match = CATEGORY_TYPE_OPTIONS.find(
    (opt) => opt.natureza_contabil === natureza && opt.efeito_caixa === efeito,
  )
  if (match) return match.key
  if (natureza === 'Receita') return 'receita'
  return 'despesa'
}

const getSemanticIcon = (nome: string) => {
  const name = nome.toLowerCase().trim()

  if (
    name.includes('aluguel') ||
    name.includes('condomínio') ||
    name.includes('condominio')
  )
    return 'Building2'
  if (
    name.includes('reuniões') ||
    name.includes('reunioes') ||
    name.includes('clientes')
  )
    return 'Users'
  if (
    name.includes('salário') ||
    name.includes('salario') ||
    name.includes('encargos') ||
    name.includes('pessoal')
  )
    return 'Wallet'
  if (
    name.includes('empréstimo') ||
    name.includes('emprestimo') ||
    name.includes('bancário') ||
    name.includes('bancario')
  )
    return 'Landmark'
  if (
    name.includes('financiamento') ||
    name.includes('imóvel') ||
    name.includes('imovel')
  )
    return 'Home'
  if (name.includes('personalizada')) return 'Settings'
  if (name.includes('serviço') || name.includes('servico')) return 'Briefcase'
  if (name.includes('venda') || name.includes('produto')) return 'ShoppingCart'
  if (
    name.includes('aplicação') ||
    name.includes('aplicacao') ||
    name.includes('investimento')
  )
    return 'TrendingUp'
  if (name.includes('resgate')) return 'HandCoins'
  if (name.includes('estoque')) return 'Boxes'
  if (
    name.includes('máquina') ||
    name.includes('maquina') ||
    name.includes('equipamento') ||
    name.includes('software') ||
    name.includes('computador')
  )
    return 'Monitor'
  if (
    name.includes('reforma') ||
    name.includes('instalação') ||
    name.includes('instalacao') ||
    name.includes('manutenção') ||
    name.includes('manutencao')
  )
    return 'Hammer'
  if (
    name.includes('pró-labore') ||
    name.includes('pro-labore') ||
    name.includes('retirada')
  )
    return 'User'
  if (name.includes('reembolso')) return 'RefreshCcw'
  if (
    name.includes('assinatura') ||
    name.includes('software') ||
    name.includes('saas') ||
    name.includes('nuvem')
  )
    return 'Cloud'
  if (
    name.includes('transporte') ||
    name.includes('viagem') ||
    name.includes('combustível') ||
    name.includes('combustivel') ||
    name.includes('veículo') ||
    name.includes('veiculo')
  )
    return 'Truck'
  if (
    name.includes('imposto') ||
    name.includes('taxa') ||
    name.includes('tributo')
  )
    return 'Calculator'
  if (
    name.includes('matéria-prima') ||
    name.includes('materia-prima') ||
    name.includes('insumo')
  )
    return 'Factory'

  return 'Tag'
}

const getCategoryIcon = (cat: Category) => {
  return getSemanticIcon(cat.nome)
}

const getGroupColor = (grupo: string) => {
  const g = (grupo || '').toUpperCase()
  if (g.includes('RECEITA')) return 'bg-emerald-500'
  if (g.includes('CUSTO') || g.includes('PRODUTO') || g.includes('MATÉRIA'))
    return 'bg-red-500'
  if (g.includes('PESSOAL')) return 'bg-pink-500'
  if (g.includes('MARKETING') || g.includes('VENDA')) return 'bg-purple-500'
  if (g.includes('OPERACIONAL') || g.includes('FUNCIONAMENTO'))
    return 'bg-blue-500'
  if (
    g.includes('INVESTIMENTO') ||
    g.includes('PATRIMONIAL') ||
    g.includes('BENS')
  )
    return 'bg-teal-500'
  if (
    g.includes('FINANCEIR') ||
    g.includes('FINANCIAMENTO') ||
    g.includes('DÍVIDA') ||
    g.includes('PASSIVO')
  )
    return 'bg-rose-500'
  if (g.includes('ADMINISTRATIV')) return 'bg-orange-500'
  return 'bg-gray-500'
}

const getCategoryColor = (cat: Category) => {
  return getGroupColor(cat.grupo)
}

const STANDARD_GROUPS = [
  'RECEITAS (Entradas)',
  'DESPESAS OPERACIONAIS (Saídas - Funcionamento)',
  'DESPESAS COM PESSOAL (Detalhado)',
  'DESPESAS COM MARKETING E VENDAS',
  'DESPESAS COM PRODUTOS/MATÉRIA-PRIMA',
  'DESPESAS FINANCEIRAS',
  'DESPESAS GERAIS/DIVERSAS',
  'DESPESAS ADMINISTRATIVAS',
  'Custos e Impostos',
  'Estrutura Patrimonial',
  'Investimento',
]

function normalizeString(str: string) {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_]/g, '')
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    grupo: 'DESPESAS OPERACIONAIS (Saídas - Funcionamento)',
    categoryTypeOption: 'despesa' as CategoryTypeOptionKey,
  })
  const [customGroup, setCustomGroup] = useState('')
  const [isAddingCustomGroup, setIsAddingCustomGroup] = useState(false)

  // Delete migration state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )
  const [linkedCount, setLinkedCount] = useState(0)
  const [fallbackCategory, setFallbackCategory] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryService.fetchCategories()
      setCategories(data)
    } catch (error) {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setFormData({
      nome: '',
      grupo: 'DESPESAS OPERACIONAIS (Saídas - Funcionamento)',
      categoryTypeOption: 'despesa',
    })
    setIsAddingCustomGroup(false)
    setCustomGroup('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      nome: category.nome,
      grupo: category.grupo,
      categoryTypeOption: getOptionKeyFromCategory(
        category.natureza_contabil,
        category.efeito_caixa,
      ),
    })
    setIsAddingCustomGroup(false)
    setCustomGroup('')
    setIsModalOpen(true)
  }

  const handleDeleteRequest = async (category: Category) => {
    try {
      setCategoryToDelete(category)
      const count = await categoryService.checkLinkedRecords(category.id)
      setLinkedCount(count)
      setFallbackCategory('')
      setIsDeleteModalOpen(true)
    } catch (error) {
      toast.error('Erro ao verificar vínculos')
    }
  }

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    const groupToUse =
      isAddingCustomGroup && customGroup.trim()
        ? customGroup.trim()
        : formData.grupo

    if (!groupToUse) {
      toast.error('Grupo é obrigatório')
      return
    }

    const selectedOption =
      CATEGORY_TYPE_OPTIONS.find(
        (opt) => opt.key === formData.categoryTypeOption,
      ) || CATEGORY_TYPE_OPTIONS[1]

    const normalizedName = normalizeString(formData.nome)

    const categoryExists = categories.some(
      (c) =>
        c.id !== editingCategory?.id &&
        normalizeString(c.nome) === normalizedName,
    )

    if (categoryExists) {
      toast.error('Esta categoria já existe.')
      return
    }

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          nome: formData.nome.trim(),
          grupo: groupToUse,
          tipo: selectedOption.tipo,
          natureza_contabil: selectedOption.natureza_contabil,
          efeito_caixa: selectedOption.efeito_caixa,
        })
        toast.success('Categoria atualizada')
      } else {
        await categoryService.createCategory({
          nome: formData.nome.trim(),
          grupo: groupToUse,
          tipo: selectedOption.tipo,
          natureza_contabil: selectedOption.natureza_contabil,
          efeito_caixa: selectedOption.efeito_caixa,
        })
        toast.success('Categoria criada')
      }
      setIsModalOpen(false)
      loadCategories()
    } catch (error) {
      toast.error('Erro ao salvar categoria')
    }
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    if (linkedCount > 0 && !fallbackCategory) {
      toast.error('Selecione uma categoria de destino')
      return
    }

    try {
      await categoryService.deleteCategory(
        categoryToDelete.id,
        linkedCount > 0 ? fallbackCategory : undefined,
      )
      toast.success('Categoria excluída com sucesso')
      setIsDeleteModalOpen(false)
      loadCategories()
    } catch (error) {
      toast.error('Erro ao excluir categoria')
    }
  }

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag
    return <IconComponent className={className} />
  }

  const allGroups = Array.from(
    new Set([
      ...STANDARD_GROUPS,
      ...(editingCategory ? [editingCategory.grupo] : []),
      ...categories.map((c) => c.grupo).filter(Boolean),
    ]),
  )

  const groupedCategories = categories.reduce(
    (acc, cat) => {
      const g = cat.grupo || 'Outros'
      if (!acc[g]) acc[g] = []
      acc[g].push(cat)
      return acc
    },
    {} as Record<string, Category[]>,
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Categorias
          </h1>
          <p className="text-gray-500 mt-1">
            Organize e gerencie as classificações das suas transações.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 rounded-xl h-11 px-6"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div
          id="categories-list"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {Object.entries(groupedCategories).map(([group, cats]) => (
            <div
              key={group}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">{group}</h2>
              <div className="space-y-3 flex-1">
                {cats.map((cat) => {
                  const isSystem = !cat.organization_id
                  return (
                    <div
                      key={cat.id}
                      className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center text-white',
                            getCategoryColor(cat),
                          )}
                        >
                          {renderIcon(getCategoryIcon(cat), 'w-5 h-5')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {cat.nome}
                          </p>
                          {isSystem ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-normal">
                              <Lock className="w-3 h-3" /> Padrão do sistema
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {cat.natureza_contabil} •{' '}
                              {cat.efeito_caixa === 'Sem_efeito'
                                ? 'Sem efeito de caixa'
                                : cat.efeito_caixa}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isSystem ? (
                          <div
                            className="p-2 text-gray-400"
                            title="Categoria padrão do sistema"
                          >
                            <Lock className="w-4 h-4" />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-colors"
                              title="Editar categoria"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(cat)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                              title="Excluir categoria"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={formData.nome}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nome: e.target.value,
                  })
                }
                placeholder="Ex: Refeições"
              />
            </div>

            <div className="grid gap-2">
              <Label>Tipo de categoria</Label>
              <Select
                value={formData.categoryTypeOption}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    categoryTypeOption: v as CategoryTypeOptionKey,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Grupo</Label>
              {!isAddingCustomGroup ? (
                <div className="flex gap-2">
                  <Select
                    value={formData.grupo}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        grupo: v,
                      })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {allGroups.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingCustomGroup(true)}
                  >
                    Novo
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                    placeholder="Nome do novo grupo"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingCustomGroup(false)
                      setCustomGroup('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Migration Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Excluir Categoria
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Você está prestes a excluir a categoria{' '}
              <strong>{categoryToDelete?.nome}</strong>.
            </p>

            {linkedCount > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                <p className="text-sm text-amber-800 font-medium">
                  Esta categoria possui <strong>{linkedCount}</strong>{' '}
                  transações vinculadas. Para excluí-la, você deve mover estas
                  transações para uma nova categoria.
                </p>
                <div className="space-y-2">
                  <Label className="text-amber-900">Migrar para:</Label>
                  <Select
                    value={fallbackCategory}
                    onValueChange={setFallbackCategory}
                  >
                    <SelectTrigger className="bg-white border-amber-200">
                      <SelectValue placeholder="Selecione a categoria destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.id !== categoryToDelete?.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome} ({c.grupo})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Nenhuma transação vinculada. A exclusão será definitiva.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={linkedCount > 0 && !fallbackCategory}
            >
              {linkedCount > 0 ? 'Excluir e Migrar' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
