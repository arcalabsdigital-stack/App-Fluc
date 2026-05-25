import { useLocation, useNavigate } from 'react-router-dom'
import { BudgetsProgress } from '@/components/dashboard/BudgetsProgress'
import { RecurringTransactionsList } from '@/components/budgets/RecurringTransactionsList'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, RepeatIcon } from 'lucide-react'

export default function Budgets() {
  const { currentWorkspace } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const currentTab =
    location.pathname === '/recurring' ? 'recurring' : 'budgets'

  const handleTabChange = (val: string) => {
    if (val === 'recurring') {
      navigate('/recurring')
    } else {
      navigate('/budgets')
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in pb-10 px-0 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {currentTab === 'recurring' ? 'Gastos Recorrentes' : 'Orçamentos'}
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          {currentTab === 'recurring'
            ? `Gerencie suas assinaturas e gastos fixos em ${currentWorkspace?.name || 'sua organização'}.`
            : `Gerencie limites de gastos mensais para as suas categorias em ${currentWorkspace?.name || 'sua organização'}.`}
        </p>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-6 bg-white border border-gray-100 h-14 p-1 shadow-sm rounded-xl overflow-x-auto overflow-y-hidden flex-nowrap justify-start w-full sm:w-fit">
          <TabsTrigger
            value="budgets"
            className="h-full rounded-lg px-6 data-[state=active]:bg-gray-50 whitespace-nowrap"
          >
            <Target className="w-4 h-4 mr-2" />
            Orçamento do Mês
          </TabsTrigger>
          <TabsTrigger
            value="recurring"
            className="h-full rounded-lg px-6 data-[state=active]:bg-gray-50 whitespace-nowrap"
          >
            <RepeatIcon className="w-4 h-4 mr-2" />
            Gastos Fixos & Assinaturas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[600px]">
              <BudgetsProgress />
            </div>

            <div className="bg-white rounded-3xl p-6 border shadow-sm flex flex-col gap-4 h-fit">
              <h3 className="text-lg font-bold text-gray-900">
                Como funciona?
              </h3>
              <p className="text-sm text-gray-600">
                Os orçamentos permitem que você defina um teto máximo de gastos
                para categorias específicas ao longo de um mês.
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>
                  Selecione uma categoria de despesa e defina o valor máximo.
                </li>
                <li>
                  O sistema calculará automaticamente o quanto você já gastou
                  naquela categoria no mês atual.
                </li>
                <li>Acompanhe a barra de progresso para evitar surpresas.</li>
                <li>
                  Ao atingir a meta, a barra indicará que o orçamento foi
                  extrapolado.
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recurring" className="animate-fade-in mt-0">
          <RecurringTransactionsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
