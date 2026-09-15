import { describe, expect, it } from "vitest"
import { RecomendacionesPage } from "./recomendaciones-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"
import { servidor } from "@/test/setup"

async function elegirCuartel(usuario: ReturnType<typeof renderConProveedores>["usuario"]) {
  await usuario.click(await screen.findByRole("combobox", { name: /^finca$/i }))
  await usuario.click(await screen.findByRole("option", { name: "Finca El Rosal" }))
  await usuario.click(screen.getByRole("combobox", { name: /^cuartel$/i }))
  await usuario.click(await screen.findByRole("option", { name: "Cuartel 1" }))
}

describe("RecomendacionesPage (HU-30)", () => {
  it("arranca mostrando solo las activas", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<RecomendacionesPage />)
    await elegirCuartel(usuario)

    expect(await screen.findByText(/Revisar el sistema de riego/i)).toBeInTheDocument()
    // La ya aplicada no está hasta cambiar de pestaña.
    expect(screen.queryByText(/Verificar la calibración del nodo/i)).not.toBeInTheDocument()

    await usuario.click(screen.getByRole("tab", { name: /todas/i }))
    expect(await screen.findByText(/Verificar la calibración del nodo/i)).toBeInTheDocument()
  })

  it("la severidad va con etiqueta, no solo con color", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<RecomendacionesPage />)
    await elegirCuartel(usuario)

    expect(await screen.findByText("Severidad alta")).toBeInTheDocument()
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
    await elegirCuartel(usuario)
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
    await elegirCuartel(usuario)
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
    const { usuario } = renderConProveedores(<RecomendacionesPage />)
    await elegirCuartel(usuario)

    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })
})
