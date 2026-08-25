import { describe, expect, it, vi } from "vitest"
import { SensorDetallePage } from "./sensor-detalle-page"
import { IDS } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"
import { servidor } from "@/test/setup"

const PATRON = "/sensores/:sensorId"

function render() {
  return renderConProveedores(<SensorDetallePage />, {
    ruta: `/sensores/${IDS.sensor}`,
    patron: PATRON,
  })
}

describe("SensorDetallePage (HU-20, HU-21)", () => {
  it("muestra el sensor y el rango de alerta configurado", async () => {
    iniciarSesionComo("Agronomo")
    render()

    expect(await screen.findByRole("heading", { name: "SEN-01" })).toBeInTheDocument()
    // Los umbrales llegan como string decimal y se muestran ya coercionados.
    expect(await screen.findByText(/Alerta fuera de 12 – 32/)).toBeInTheDocument()
  })

  /**
   * El gráfico trae una vista de tabla al lado. No es un extra: es el relevo
   * de accesibilidad para quien no puede leer la forma.
   */
  it("ofrece la serie también como tabla, con promedio, mínimo y máximo", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = render()

    await screen.findByRole("heading", { name: "SEN-01" })
    await usuario.click(screen.getByRole("tab", { name: /tabla/i }))

    const tabla = await screen.findByRole("table")
    expect(within(tabla).getByText("24,5")).toBeInTheDocument()
    expect(within(tabla).getByText("22,1")).toBeInTheDocument()
    expect(within(tabla).getByText("27,3")).toBeInTheDocument()
  })

  it("cambiar el período cambia la granularidad que se pide", async () => {
    iniciarSesionComo("Agronomo")
    const urls: URL[] = []
    servidor.events.on("request:start", ({ request }) => {
      const url = new URL(request.url)
      if (url.pathname.endsWith("/serie")) urls.push(url)
    })

    const { usuario } = render()
    await screen.findByRole("heading", { name: "SEN-01" })
    await waitFor(() => expect(urls.at(-1)?.searchParams.get("granularidad")).toBe("hora"))

    await usuario.click(screen.getByRole("combobox", { name: /período/i }))
    await usuario.click(await screen.findByRole("option", { name: "90 días" }))

    // Un trimestre por hora serían ~2.000 puntos: por eso el rango largo va
    // agregado por día.
    await waitFor(() => expect(urls.at(-1)?.searchParams.get("granularidad")).toBe("dia"))
  })

  it("un umbral vacío se manda como null, que borra el límite", async () => {
    iniciarSesionComo("Agronomo")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "PUT" && request.url.endsWith("/umbral")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = render()
    await screen.findByRole("heading", { name: "SEN-01" })

    await usuario.click(screen.getByRole("button", { name: /umbrales/i }))
    await waitFor(() => expect(screen.getByLabelText(/mínimo/i)).toHaveValue(12))
    await usuario.clear(screen.getByLabelText(/mínimo/i))
    await usuario.click(screen.getByRole("button", { name: /guardar umbrales/i }))

    // El DTO usa `@ValidateIf` justamente para distinguir "no lo mandes" de
    // "borralo": vacío tiene que viajar como `null` explícito.
    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0].umbralMinimo).toBeNull()
    expect(cuerpos[0].umbralMaximo).toBe(32)
  })

  it("rechaza un mínimo mayor que el máximo antes de mandarlo", async () => {
    iniciarSesionComo("Agronomo")
    const enviadas = vi.fn<() => void>()
    servidor.events.on("request:start", ({ request }) => {
      if (request.method === "PUT" && request.url.endsWith("/umbral")) enviadas()
    })

    const { usuario } = render()
    await screen.findByRole("heading", { name: "SEN-01" })

    await usuario.click(screen.getByRole("button", { name: /umbrales/i }))
    await waitFor(() => expect(screen.getByLabelText(/mínimo/i)).toHaveValue(12))
    await usuario.clear(screen.getByLabelText(/mínimo/i))
    await usuario.type(screen.getByLabelText(/mínimo/i), "99")
    await usuario.click(screen.getByRole("button", { name: /guardar umbrales/i }))

    expect(await screen.findByText(/mínimo tiene que ser menor que el máximo/i)).toBeInTheDocument()
    expect(enviadas).not.toHaveBeenCalled()
  })
})
