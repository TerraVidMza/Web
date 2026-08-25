import { describe, expect, it, vi } from "vitest"
import { CuadrillasPage } from "./cuadrillas-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

/** El listado exige finca: `GET /cuadrillas` recibe `fincaId` obligatorio. */
async function elegirFinca(usuario: ReturnType<typeof renderConProveedores>["usuario"]) {
  await usuario.click(await screen.findByRole("combobox", { name: /finca/i }))
  await usuario.click(await screen.findByRole("option", { name: "Finca El Rosal" }))
}

describe("CuadrillasPage (HU-23)", () => {
  it("pide elegir una finca antes de listar", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<CuadrillasPage />)

    expect(
      await screen.findByText(/Elegí una finca para ver sus cuadrillas/i)
    ).toBeInTheDocument()
  })

  it("lista las cuadrillas de la finca elegida", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<CuadrillasPage />)
    await elegirFinca(usuario)

    expect(await screen.findByText("Cuadrilla Norte")).toBeInTheDocument()
    expect(screen.getByText("8")).toBeInTheDocument()
  })

  it("crea la cuadrilla sin tarifa: la fija después el Propietario", async () => {
    iniciarSesionComo("Capataz")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/cuadrillas")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<CuadrillasPage />)
    await elegirFinca(usuario)
    await screen.findByText("Cuadrilla Norte")

    await usuario.click(screen.getByRole("button", { name: /nueva cuadrilla/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Cuadrilla Sur")
    await usuario.type(screen.getByLabelText(/integrantes/i), "5")
    await usuario.click(screen.getByRole("button", { name: /^crear$/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    // El service descarta `tarifaPorKgInicial` si no lo manda un Propietario,
    // así que ni se envía: la pantalla no ofrece un campo inerte.
    expect(cuerpos[0]).not.toHaveProperty("tarifaPorKgInicial")
    expect(cuerpos[0].cantidadIntegrantes).toBe(5)
  })

  it("el Capataz no ve las tarifas ni puede dar de baja", async () => {
    iniciarSesionComo("Capataz")
    const { usuario } = renderConProveedores(<CuadrillasPage />)
    await elegirFinca(usuario)
    await screen.findByText("Cuadrilla Norte")

    // `:id/tarifas` es `@Roles(P, A)` y `desactivar` es `@Roles(P)`.
    expect(
      screen.queryByRole("button", { name: /Tarifas de Cuadrilla Norte/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Acciones de Cuadrilla Norte/i })
    ).not.toBeInTheDocument()
  })

  it("marca cuál tarifa rige y cuál está programada", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<CuadrillasPage />)
    await elegirFinca(usuario)
    await screen.findByText("Cuadrilla Norte")

    await usuario.click(screen.getByRole("button", { name: /Tarifas de Cuadrilla Norte/i }))

    // La de 2099 encabeza la lista por venir ordenada DESC, pero no rige.
    expect(await screen.findByText("Programada")).toBeInTheDocument()
    expect(screen.getByText("Vigente").closest("li")).toHaveTextContent("$ 80")
  })

  it("el Agrónomo ve las tarifas pero no puede fijarlas", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<CuadrillasPage />)
    await elegirFinca(usuario)
    await screen.findByText("Cuadrilla Norte")

    await usuario.click(screen.getByRole("button", { name: /Tarifas de Cuadrilla Norte/i }))

    // `setTarifa` es `@Roles(PROPIETARIO)`: la tarifa a destajo la fija él solo.
    expect(await screen.findByText("Vigente")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /nueva tarifa/i })).not.toBeInTheDocument()
  })

  it("rechaza una vigencia retroactiva de tarifa", async () => {
    iniciarSesionComo("Propietario")
    const enviadas = vi.fn<() => void>()
    servidor.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.includes("/tarifas")) enviadas()
    })

    const { usuario } = renderConProveedores(<CuadrillasPage />)
    await elegirFinca(usuario)
    await screen.findByText("Cuadrilla Norte")

    await usuario.click(screen.getByRole("button", { name: /Tarifas de Cuadrilla Norte/i }))
    await usuario.click(await screen.findByRole("button", { name: /nueva tarifa/i }))
    await usuario.type(screen.getByLabelText(/nueva tarifa/i), "120")
    await usuario.clear(screen.getByLabelText(/rige desde/i))
    await usuario.type(screen.getByLabelText(/rige desde/i), "2020-01-01")
    await usuario.click(screen.getByRole("button", { name: /registrar tarifa/i }))

    // Cambiaría lo ya liquidado a la cuadrilla en pesajes históricos.
    expect(await screen.findByText(/no puede ser retroactiva/i)).toBeInTheDocument()
    expect(enviadas).not.toHaveBeenCalled()
  })
})
