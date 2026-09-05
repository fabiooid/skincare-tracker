import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AgentProvider } from '@/components/agent-provider'
import { AuthProvider } from '@/lib/auth'
import { HomePage } from '@/pages/home'
import { IngredientsPage } from '@/pages/ingredients'
import { LoginPage } from '@/pages/login'
import { ProductWorkspacePage } from '@/pages/product-workspace'
import { ProductsPage } from '@/pages/products'
import { RegisterPage } from '@/pages/register'
import { SettingsAccountPage } from '@/pages/settings/account'
import { SettingsAppearancePage } from '@/pages/settings/appearance'
import { SettingsLanguagePage } from '@/pages/settings/language'
import { SettingsOrganizationPage } from '@/pages/settings/organization'
import { SettingsPlanPage } from '@/pages/settings/plan'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AgentProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/settings" element={<Navigate to="/settings/account" replace />} />
              <Route path="/settings/account" element={<SettingsAccountPage />} />
              <Route path="/settings/appearance" element={<SettingsAppearancePage />} />
              <Route path="/settings/language" element={<SettingsLanguagePage />} />
              <Route path="/settings/plan" element={<SettingsPlanPage />} />
              <Route path="/settings/organization" element={<SettingsOrganizationPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductWorkspacePage />} />
              <Route path="/ingredients" element={<IngredientsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AgentProvider>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
