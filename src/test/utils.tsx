import type { ReactElement, ReactNode } from "react"
import { render, type RenderOptions } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/context/auth-context"
import { ConfiguracionProvider } from "@/context/configuracion-context"
import { guardarSesion } from "@/auth/sesion"
import type { RolNombre } from "@/auth/roles"
import { sesionComo } from "./handlers"
import { tokenDePrueba, usuarioSesion } from "./fixtures"

/**
 * Deja una sesión válida en `localStorage` **y** le avisa a los handlers con
 * qué rol responder. Las dos mitades tienen que coincidir: el frontend lee el
 * rol del `localStorage` y el backend lo saca del token.
 */
export function iniciarSesionComo(rol: RolNombre, extra: { debeCambiarPassword?: boolean } = {}) {
  sesionComo(rol)
  guardarSesion({
    accessToken: tokenDePrueba(),
    user: { ...usuarioSesion(rol), ...extra },
  })
}

function crearQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Sin reintentos: un test que espera un error no tiene por qué esperar a
      // que se agoten, y el fallo real queda oculto detrás de un timeout.
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface Opciones extends Omit<RenderOptions, "wrapper"> {
  /** Ruta inicial del `MemoryRouter`. */
  ruta?: string
  /** Patrón de ruta, para las pantallas que leen `useParams`. */
  patron?: string
}

export function renderConProveedores(ui: ReactElement, { ruta = "/", patron, ...opciones }: Opciones = {}) {
  const queryClient = crearQueryClient()

  function Envoltorio({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[ruta]}>
          <AuthProvider>
            <ConfiguracionProvider>
              {patron ? (
                <Routes>
                  <Route path={patron} element={children} />
                </Routes>
              ) : (
                children
              )}
            </ConfiguracionProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  return {
    // Sin el retardo artificial entre teclas: en jsdom, escribir ocho campos
    // con el default se come varios segundos por test sin probar nada más.
    usuario: userEvent.setup({ delay: null }),
    queryClient,
    ...render(ui, { wrapper: Envoltorio, ...opciones }),
  }
}

export * from "@testing-library/react"
