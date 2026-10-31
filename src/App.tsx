import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { AuthProvider } from '@/context/AuthContext'
import { CompareProvider } from '@/context/CompareContext'
import { LangProvider } from '@/context/LangContext'
import AppRoutes from '@/routes/AppRoutes'

const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } })

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <LangProvider>
          <AuthProvider>
            <CompareProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
              <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: '14px' } }} />
            </CompareProvider>
          </AuthProvider>
        </LangProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
