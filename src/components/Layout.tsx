import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

import { useAuth } from '@/hooks/use-auth'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TourOverlay } from './TourOverlay'
import { ExpandableChat } from '@/components/ui/expandable-chat'

export default function Layout() {
  const { subscription } = useAuth()

  const trialEndingSoon =
    subscription?.status === 'trial' &&
    subscription.trial_end &&
    new Date(subscription.trial_end).getTime() - new Date().getTime() <
      3 * 24 * 60 * 60 * 1000 &&
    new Date(subscription.trial_end).getTime() > new Date().getTime()

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Sidebar />
      <TourOverlay />
      <div className="flex flex-col min-h-screen md:pl-[280px]">
        {trialEndingSoon && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Seu período de teste termina em breve.{' '}
            <Link to="/settings?tab=billing" className="font-bold underline">
              Assine agora
            </Link>{' '}
            para não perder o acesso.
          </div>
        )}
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <ExpandableChat />
      </div>
    </div>
  )
}
