import { describe, expect, it, vi } from "vitest"
import { CatalogoPanel } from "./catalogo-panel"
import { INSUMOS, TIPOS_LABOR } from "./config"
import { clasificarVigencias } from "./use-catalogo-costeable"
import { costosSchema } from "@/api/schemas/operaciones"
import { COSTOS_INSUMO } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

describe("CatalogoPanel (HU-16)", () => {
  it("lista los insumos con su unidad", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<CatalogoPanel config={INSUMOS} />)

    expect(await screen.findByText("Fertilizante NPK")).toBeInTheDocument()
    expect(screen.getByText("kg")).toBeInTheDocument()
  })

  it("la misma pantalla sirve para tipos de labor", async () => {
    // Es una sola implementación con dos configuraciones: `insumos` y
    // `tipo_labor` son la misma entidad con otro nombre en el backend.
    iniciarSesionComo("Propietario")
    renderConProveedores(<CatalogoPanel config={TIPOS_LABOR} />)

    expect(await screen.findByText("Poda de invierno")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /nuevo tipo de labor/i })).toBeInTheDocument()
  })

  it("crea un insumo con su costo inicial", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/insumos")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<CatalogoPanel config={INSUMOS} />)
    await screen.findByText("Fertilizante NPK")

    await usuario.click(screen.getByRole("button", { name: /nuevo insumo/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Azufre")
    await usuario.type(screen.getByLabelText(/costo unitario inicial/i), "980.50")
    await usuario.click(screen.getByRole("button", { name: /^crear$/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).toEqual({
      nombre: "Azufre",
      unidadMedida: "kg",
      costoUnitarioInicial: 980.5,
    })
  })

  it("el costo inicial acepta 0, que el de cambio no", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/insumos")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<CatalogoPanel config={INSUMOS} />)
    await screen.findByText("Fertilizante NPK")

    await usuario.click(screen.getByRole("button", { name: /nuevo insumo/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Abono propio")
    await usuario.type(screen.getByLabelText(/costo unitario inicial/i), "0")
    await usuario.click(screen.getByRole("button", { name: /^crear$/i }))

    // `@Min(0)` al crear: un insumo propio o donado tiene costo cero.
    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0].costoUnitarioInicial).toBe(0)
  })

  it("al editar no ofrece el campo de costo", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<CatalogoPanel config={INSUMOS} />)

    await screen.findByText("Fertilizante NPK")
    await usuario.click(screen.getByRole("button", { name: /Acciones de Fertilizante NPK/i }))
    await usuario.click(await screen.findByRole("menuitem", { name: /editar/i }))

    // El costo no se sobrescribe: se agrega una vigencia nueva.
    expect(await screen.findByLabelText(/^nombre$/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/costo unitario inicial/i)).not.toBeInTheDocument()
  })

  it("marca cuál costo rige hoy y cuál está programado", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<CatalogoPanel config={INSUMOS} />)

    await screen.findByText("Fertilizante NPK")
    await usuario.click(screen.getByRole("button", { name: /Costos de Fertilizante NPK/i }))

    // El historial viene ordenado por fecha descendente, así que el de 2099
    // encabeza la lista sin ser el vigente.
    expect(await screen.findByText("Programado")).toBeInTheDocument()
    const vigente = screen.getByText("Vigente").closest("li")!
    expect(vigente).toHaveTextContent("$ 1.500")
  })

  it("rechaza una vigencia retroactiva antes de mandarla", async () => {
    iniciarSesionComo("Propietario")
    const enviadas = vi.fn<() => void>()
    servidor.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.includes("/costos")) enviadas()
    })

    const { usuario } = renderConProveedores(<CatalogoPanel config={INSUMOS} />)
    await screen.findByText("Fertilizante NPK")
    await usuario.click(screen.getByRole("button", { name: /Costos de Fertilizante NPK/i }))
    await usuario.click(await screen.findByRole("button", { name: /nuevo costo/i }))

    await usuario.type(screen.getByLabelText(/nuevo costo/i), "1900")
    await usuario.clear(screen.getByLabelText(/rige desde/i))
    await usuario.type(screen.getByLabelText(/rige desde/i), "2020-01-01")
    await usuario.click(screen.getByRole("button", { name: /registrar costo/i }))

    expect(await screen.findByText(/no puede ser retroactiva/i)).toBeInTheDocument()
    expect(enviadas).not.toHaveBeenCalled()
  })

  it("el Capataz ve el catálogo pero no sus costos", async () => {
    // `GET /insumos` es `@Roles(P, A, C)`; `/:id/costos` es `@Roles(P, A)`.
    iniciarSesionComo("Capataz")
    const { usuario } = renderConProveedores(<CatalogoPanel config={INSUMOS} />)

    expect(await screen.findByText("Fertilizante NPK")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /nuevo insumo/i })).not.toBeInTheDocument()

    await usuario.click(screen.getByRole("button", { name: /Costos de Fertilizante NPK/i }))
    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })
})

describe("clasificarVigencias", () => {
  const costos = costosSchema.parse(COSTOS_INSUMO)

  it("el vigente es el más reciente que ya empezó, no el primero de la lista", () => {
    const clasificados = clasificarVigencias(costos, "2026-08-25")

    expect(clasificados.find((c) => c.esVigente)?.costoUnitario).toBe(1500)
    expect(clasificados.filter((c) => c.esFuturo)).toHaveLength(1)
  })

  it("sin ningún costo ya vigente, ninguno se marca como tal", () => {
    const clasificados = clasificarVigencias(costos, "2020-01-01")
    expect(clasificados.some((c) => c.esVigente)).toBe(false)
    expect(clasificados.every((c) => c.esFuturo)).toBe(true)
  })
})
