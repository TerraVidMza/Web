import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { ConfiguracionProvider } from "@/context/configuracion-context"
import { AppRouter } from "@/routes/app-router"
import { ErrorDeContrato } from "@/api/errores"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      /**
       * Reintentar una respuesta que no cumple el contrato no la va a arreglar:
       * el backend va a devolver lo mismo. Se falla rápido para que el error
       * llegue con su detalle en vez de después de dos esperas.
       */
      retry: (intentos, error) => !(error instanceof ErrorDeContrato) && intentos < 1,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {/* `AuthProvider` va dentro del router: el manejo del 401 necesita
              `useNavigate` para no recargar la página entera. */}
          <BrowserRouter>
            <AuthProvider>
              <ConfiguracionProvider>
                <AppRouter />
              </ConfiguracionProvider>
            </AuthProvider>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
