import { describe, expect, it, vi } from "vitest"
import { RecomendacionesPage } from "./recomendaciones-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"
import { servidor } from "@/test/setup"

// Los avisos son toasts de sonner, que no se montan en los tests: se espían.
const avisos = vi.hoisted(() => ({
  success: vi.fn<(mensaje: string) => void>(),
  info: vi.fn<(mensaje: string) => void>(),
  error: vi.fn<(mensaje: string) => void>(),
  warning: vi.fn<(mensaje: string) => void>(),
}))
vi.mock("sonner", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("sonner")>()),
  toast: avisos,
}))

describe("RecomendacionesPage (HU-30)", () => {
  it("lista las activas de toda la empresa, indicando finca, cuartel y por qué", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<RecomendacionesPage />)

    expect(await screen.findByText(/Revisar el sistema de riego/i)).toBeInTheDocument()
    expect(screen.getByText("Finca El Rosal · Cuartel 1")).toBeInTheDocument()
    expect(screen.getByText(/humedad de suelo estuvo bajo el umbral/i)).toBeInTheDocument()
    // La ya aplicada no está hasta cambiar de pestaña.
    expect(screen.queryByText(/Verificar la calibración del nodo/i)).not.toBeInTheDocument()
  })

  it("«Todas» suma las ya resueltas", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<RecomendacionesPage />)
    await screen.findByText(/Revisar el sistema de riego/i)

    await usuario.click(screen.getByRole("tab", { name: /todas/i }))

    expect(await screen.findByText(/Verificar la calibración del nodo/i)).toBeInTheDocument()
  })

  it("la severidad va con etiqueta, no solo con color", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<RecomendacionesPage />)

    expect(await screen.findByText("Severidad alta")).toBeInTheDocument()
  })

  it("«Buscar nuevas» evalúa y cuenta lo que apareció", async () => {
    iniciarSesionComo("Agronomo")
    const llamadas: string[] = []
    servidor.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/recomendaciones/evaluar")) {
        llamadas.push(request.url)
      }
    })

    const { usuario } = renderConProveedores(<RecomendacionesPage />)
    await screen.findByText(/Revisar el sistema de riego/i)
    await usuario.click(screen.getByRole("button", { name: /buscar nuevas/i }))

    await waitFor(() => expect(llamadas).toHaveLength(1))
    await waitFor(() => expect(avisos.success).toHaveBeenCalled())
    expect(avisos.success.mock.calls[0][0]).toMatch(/1 recomendación nueva en 5 cuarteles/)
    expect(avisos.success.mock.calls[0][0]).toMatch(/2 todavía sin histórico suficiente/)
  })

  it("resuelve una recomendación con nota", async () => {
    iniciarSesionComo("Agronomo")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "PATCH" && request.url.includes("/recomendaciones/")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<RecomendacionesPage />)
    await screen.findByText(/Revisar el sistema de riego/i)

    await usuario.click(screen.getByRole("button", { name: /resolver/i }))
    await usuario.type(
      screen.getByRole("textbox", { name: /nota de la resolución/i }),
      "Se reparó el gotero del sector 3."
    )
    await usuario.click(screen.getByRole("button", { name: /aplicada/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0].estado).toBe("aplicada")
    expect(cuerpos[0].nota).toMatch(/gotero/)
  })

  it("una resuelta no ofrece reabrirse", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<RecomendacionesPage />)
    await screen.findByText(/Revisar el sistema de riego/i)
    await usuario.click(screen.getByRole("tab", { name: /todas/i }))

    // Reabrirla borraría quién y cuándo la resolvió; si la condición vuelve, la
    // regla genera una nueva.
    const aplicada = within(
      (await screen.findByText(/Verificar la calibración del nodo/i)).closest("li")!
    )
    expect(aplicada.getByText("Aplicada")).toBeInTheDocument()
    expect(aplicada.queryByRole("button", { name: /resolver/i })).not.toBeInTheDocument()
  })

  it("le niega las recomendaciones al Capataz", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<RecomendacionesPage />)

    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })
})
