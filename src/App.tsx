import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Index from './pages/Index'
import Payments from './pages/Payments'
import Settings from './pages/Settings'
import Help from './pages/Help'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Onboarding from './pages/Onboarding'
import Users from './pages/Users'
import History from './pages/History'
import Search from './pages/Search'
import Checkout from './pages/Checkout'
import Diagnostico from './pages/Diagnostico'
import Valuation from './pages/Valuation'
import Budgets from './pages/Budgets'
import Recurring from './pages/Recurring'
import Categories from './pages/Categories'
import AdminCoupons from './pages/admin/Coupons'
import AdminStaff from './pages/admin/Staff'
import Accounts from './pages/Accounts'
import Ritual from './pages/Ritual'
import { TransactionProvider } from '@/stores/useTransactionStore'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <AuthProvider>
      <TransactionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/diagnostico" element={<Diagnostico />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                <Route path="/users" element={<Users />} />
                <Route path="/history" element={<History />} />
                <Route path="/search" element={<Search />} />
                <Route path="/valuation" element={<Valuation />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/recurring" element={<Recurring />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/staff" element={<AdminStaff />} />
                <Route path="/ritual-do-mes" element={<Ritual />} />
              </Route>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/checkout" element={<Checkout />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </TransactionProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
