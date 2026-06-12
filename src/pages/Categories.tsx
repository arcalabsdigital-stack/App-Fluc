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
  CategoriaSimplificada,
} from '@/services/categoryService'
import * as Icons from 'lucide-react'

const ICON_NAMES = [
  'Tag',
  'Home',
  'Wallet',
  'ShoppingCart',
  'Coffee',
  'Car',
  'Briefcase',
  'HeartPulse',
  'Zap',
  'Gift',
  'Book',
  'Monitor',
  'Cpu',
  'TrendingUp',
  'TrendingDown',
  'Utensils',
  'Bus',
  'Plane',
  'Smartphone',
  'Music',
]

const COLORS = [
  'bg-gray-500',
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-rose-500',
]

const DEFAULT_GROUPS = [
  'Receitas',
  'Custos Diretos',
  'Custos Fixos',
  'Despesas Operacionais',
  'Investimentos',
  'Despesas Pessoais',
]

export default function Categories() {
  const [categories, setCategories] = useState<CategoriaSimplificada[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Form state
  const [editingCategory, setEditingCategory] =
    useState<CategoriaSimplificada | null>(null)
  const [formData, setFormData] = useState({
    nome_simplificado: '',
    tipo_grupo: 'Despesas Operacionais',
    icon: 'Tag',
    color: 'bg-gray-500',
  })
  const [customGroup, setCustomGroup] = useState('')
  const [isAddingCustomGroup, setIsAddingCustomGroup] = useState(false)

  // Delete migration state
  const [categoryToDelete, setCategoryToDelete] =
    useState<CategoriaSimplificada | null>(null)
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
      nome_simplificado: '',
      tipo_grupo: 'Despesas Operacionais',
      icon: 'Tag',
      color: 'bg-blue-500',
    })
    setIsAddingCustomGroup(false)
    setCustomGroup('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (category: CategoriaSimplificada) => {
    setEditingCategory(category)
    setFormData({
      nome_simplificado: category.nome_simplificado,
      tipo_grupo: category.tipo_grupo,
      icon: category.icon || 'Tag',
      color: category.color || 'bg-gray-500',
    })
    setIsAddingCustomGroup(false)
    setCustomGroup('')
    setIsModalOpen(true)
  }

  const handleDeleteRequest = async (category: CategoriaSimplificada) => {
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
    if (!formData.nome_simplificado) {
      toast.error('Nome é obrigatório')
      return
    }

    const groupToUse =
      isAddingCustomGroup && customGroup ? customGroup : formData.tipo_grupo

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          ...formData,
          tipo_grupo: groupToUse,
        })
        toast.success('Categoria atualizada')
      } else {
        await categoryService.createCategory({
          ...formData,
          tipo_grupo: groupToUse,
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
    new Set([...DEFAULT_GROUPS, ...categories.map((c) => c.tipo_grupo)]),
  )

  const groupedCategories = categories.reduce(
    (acc, cat) => {
      if (!acc[cat.tipo_grupo]) acc[cat.tipo_grupo] = []
      acc[cat.tipo_grupo].push(cat)
      return acc
    },
    {} as Record<string, CategoriaSimplificada[]>,
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(groupedCategories).map(([group, cats]) => (
            <div
              key={group}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">{group}</h2>
              <div className="space-y-3 flex-1">
                {cats.map((cat) => {
                  const isSystem =
                    !cat.criada_por_usuario || !cat.organization_id
                  return (
                    <div
                      key={cat.id}
                      className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center text-white',
                            cat.color || 'bg-gray-500',
                          )}
                        >
                          {renderIcon(cat.icon || 'Tag', 'w-5 h-5')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {cat.nome_simplificado}
                          </p>
                          {isSystem && (
                            <p className="text-xs text-gray-400">Sistema</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isSystem ? (
                          <div className="p-2 text-gray-400">
                            <Lock className="w-4 h-4" />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(cat)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
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
                value={formData.nome_simplificado}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nome_simplificado: e.target.value,
                  })
                }
                placeholder="Ex: Refeições"
              />
            </div>

            <div className="grid gap-2">
              <Label>Grupo</Label>
              {!isAddingCustomGroup ? (
                <div className="flex gap-2">
                  <Select
                    value={formData.tipo_grupo}
                    onValueChange={(v) =>
                      setFormData({ ...formData, tipo_grupo: v })
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

            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={cn(
                      'w-8 h-8 rounded-full transition-transform',
                      c,
                      formData.color === c
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-110',
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto p-1 no-scrollbar">
                {ICON_NAMES.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      'p-3 rounded-xl flex items-center justify-center transition-all',
                      formData.icon === icon
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
                    )}
                  >
                    {renderIcon(icon, 'w-5 h-5')}
                  </button>
                ))}
              </div>
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
              <strong>{categoryToDelete?.nome_simplificado}</strong>.
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
                            {c.nome_simplificado} ({c.tipo_grupo})
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
