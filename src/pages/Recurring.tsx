import { useNavigate } from 'react-router-dom'
import { RecurringTransactionsList } from '@/components/budgets/RecurringTransactionsList'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, RepeatIcon } from 'lucide-react'

export default function Recurring() {
  const { currentWorkspace } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in pb-10 px-0 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Gastos Recorrentes
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          Gerencie suas assinaturas e gastos fixos em{' '}
          {currentWorkspace?.name || 'sua organização'}.
        </p>
      </div>

      <Tabs
        value="recurring"
        onValueChange={(val) => {
          if (val === 'budgets') navigate('/budgets')
        }}
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

        <TabsContent value="recurring" className="animate-fade-in mt-0">
          <RecurringTransactionsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
