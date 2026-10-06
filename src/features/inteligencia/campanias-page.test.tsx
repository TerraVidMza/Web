import { describe, expect, it, vi } from "vitest"
import { CampaniasPage } from "./campanias-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"
import { servidor } from "@/test/setup"

const ANIO = new Date().getFullYear()

describe("CampaniasPage (D-014)", () => {
  it("marca cuál es la campaña actual", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<CampaniasPage />)

    // La abierta que contiene hoy es la que el resto del sistema usa de corte.
    const fila = within((await screen.findByText(`${ANIO}/${ANIO + 1}`)).closest("tr")!)
    expect(fila.getByText("Actual")).toBeInTheDocument()
    expect(fila.getByText("Abierta")).toBeInTheDocument()

    const anterior = within(screen.getByText(`${ANIO - 1}/${ANIO}`).closest("tr")!)
    expect(anterior.getByText("Cerrada")).toBeInTheDocument()
    expect(anterior.queryByText("Actual")).not.toBeInTheDocument()
  })

  it("rechaza un rango invertido antes de mandarlo", async () => {
    iniciarSesionComo("Propietario")
    const enviadas = vi.fn<() => void>()
    servidor.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/campanias")) enviadas()
    })

    const { usuario } = renderConProveedores(<CampaniasPage />)
    await screen.findByText(`${ANIO}/${ANIO + 1}`)

    await usuario.click(screen.getByRole("button", { name: /nueva campaña/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Prueba")
    await usuario.type(screen.getByLabelText(/^desde$/i), "2027-06-01")
    await usuario.type(screen.getByLabelText(/^hasta$/i), "2027-01-01")
    await usuario.click(screen.getByRole("button", { name: /crear campaña/i }))

    // El backend lo valida con un CHECK; adelantarlo ahorra el viaje.
    expect(await screen.findByText(/posterior al inicio/i)).toBeInTheDocument()
    expect(enviadas).not.toHaveBeenCalled()
  })

  it("cierra una campaña y explica qué implica", async () => {
    iniciarSesionComo("Propietario")
    const cierres: string[] = []
    servidor.events.on("request:start", ({ request }) => {
      if (request.url.endsWith("/cerrar")) cierres.push(request.url)
    })

    const { usuario } = renderConProveedores(<CampaniasPage />)
    await screen.findByText(`${ANIO}/${ANIO + 1}`)

    await usuario.click(
      screen.getByRole("button", { name: `Acciones de ${ANIO}/${ANIO + 1}` })
    )
    await usuario.click(await screen.findByRole("menuitem", { name: /cerrar campaña/i }))

    const dialogo = await screen.findByRole("alertdialog")
    expect(dialogo).toHaveTextContent(/deja de ser «la actual»/i)

    await usuario.click(within(dialogo).getByRole("button", { name: "Cerrar campaña" }))
    await waitFor(() => expect(cierres).toHaveLength(1))
  })

  it("el Agrónomo lee las campañas pero no las administra", async () => {
    // `GET /campanias` es `@AnyRole()`; la escritura, `@Roles(PROPIETARIO)`.
    iniciarSesionComo("Agronomo")
    renderConProveedores(<CampaniasPage />)

    expect(await screen.findByText(`${ANIO}/${ANIO + 1}`)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /nueva campaña/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Acciones de/i })
    ).not.toBeInTheDocument()
  })

  it("carga la meta de cosecha de un cuartel (D-027 del backend)", async () => {
    iniciarSesionComo("Propietario")
    const metas: Array<{ url: string; cuerpo: unknown }> = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "PUT" && request.url.includes("/metas/")) {
        metas.push({ url: request.url, cuerpo: await request.clone().json() })
      }
    })
    const { usuario } = renderConProveedores(<CampaniasPage />)

    const fila = within((await screen.findByText(`${ANIO}/${ANIO + 1}`)).closest("tr")!)
    await usuario.click(fila.getByRole("button", { name: /acciones de/i }))
    await usuario.click(await screen.findByRole("menuitem", { name: /metas de cosecha/i }))

    const campo = await screen.findByLabelText(/meta en kg de cuartel 1/i)
    expect(campo).toHaveValue(8000)
    await usuario.clear(campo)
    await usuario.type(campo, "9500")
    await usuario.click(screen.getByRole("button", { name: /^guardar$/i }))

    await waitFor(() => expect(metas).toHaveLength(1))
    expect(metas[0].cuerpo).toEqual({ metaKg: 9500 })
  })
})
