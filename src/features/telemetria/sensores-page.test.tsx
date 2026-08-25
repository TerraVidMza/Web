import { describe, expect, it } from "vitest"
import { SensoresPage } from "./sensores-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"
import { servidor } from "@/test/setup"

async function elegirFinca(usuario: ReturnType<typeof renderConProveedores>["usuario"]) {
  await usuario.click(await screen.findByRole("combobox", { name: /finca/i }))
  await usuario.click(await screen.findByRole("option", { name: "Finca El Rosal" }))
}

describe("SensoresPage (HU-18)", () => {
  it("muestra la última lectura de cada sensor", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<SensoresPage />)
    await elegirFinca(usuario)

    const fila = within((await screen.findByText("SEN-01")).closest("tr")!)
    expect(fila.getByText("31,4 C")).toBeInTheDocument()
    expect(fila.getByText("Temperatura")).toBeInTheDocument()
  })

  it("distingue el nodo que todavía no reportó de uno que midió cero", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<SensoresPage />)
    await elegirFinca(usuario)

    const fila = within((await screen.findByText("SEN-02")).closest("tr")!)
    expect(fila.getByText(/Todavía no reportó/i)).toBeInTheDocument()
  })

  it("crea un sensor con su código y tipo", async () => {
    iniciarSesionComo("Agronomo")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/sensores")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<SensoresPage />)
    await elegirFinca(usuario)
    await screen.findByText("SEN-01")

    await usuario.click(screen.getByRole("button", { name: /nuevo sensor/i }))
    await usuario.type(screen.getByLabelText(/código/i), "SEN-09")
    await usuario.click(screen.getByRole("button", { name: /crear sensor/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0].codigo).toBe("SEN-09")
    expect(cuerpos[0].tipo).toBe("temperatura")
  })

  /**
   * `UpdateSensorDto` solo acepta `codigo` y `descripcion`. Tiene sentido: las
   * lecturas ya ingeridas se interpretaron con el tipo original, y cambiarlo
   * dejaría un histórico de temperaturas etiquetado como humedad.
   */
  it("al editar no deja cambiar el tipo y lo explica", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<SensoresPage />)
    await elegirFinca(usuario)
    await screen.findByText("SEN-01")

    await usuario.click(screen.getByRole("button", { name: /Acciones de SEN-01/i }))
    await usuario.click(await screen.findByRole("menuitem", { name: /editar/i }))

    expect(await screen.findByRole("combobox", { name: /tipo/i })).toBeDisabled()
    expect(screen.getByText(/las lecturas ya ingeridas se interpretaron/i)).toBeInTheDocument()
  })

  it("no manda el tipo al editar, porque el DTO no lo acepta", async () => {
    iniciarSesionComo("Agronomo")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "PATCH" && /\/sensores\/[^/]+$/.test(new URL(request.url).pathname)) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<SensoresPage />)
    await elegirFinca(usuario)
    await screen.findByText("SEN-01")

    await usuario.click(screen.getByRole("button", { name: /Acciones de SEN-01/i }))
    await usuario.click(await screen.findByRole("menuitem", { name: /editar/i }))
    await usuario.clear(screen.getByLabelText(/código/i))
    await usuario.type(screen.getByLabelText(/código/i), "SEN-01B")
    await usuario.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).not.toHaveProperty("tipo")
    expect(cuerpos[0].codigo).toBe("SEN-01B")
  })

  it("le niega los sensores al Capataz, como hace el backend", async () => {
    iniciarSesionComo("Capataz")
    const { usuario } = renderConProveedores(<SensoresPage />)
    await elegirFinca(usuario)

    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })
})
