import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { RemitoDetallePage } from "./remito-detalle-page"
import { IDS } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

const PATRON = "/remitos/:remitoId"

function render(remitoId: string) {
  return renderConProveedores(<RemitoDetallePage />, {
    ruta: `/remitos/${remitoId}`,
    patron: PATRON,
  })
}

describe("RemitoDetallePage (HU-27)", () => {
  it("muestra el remito con sus pesajes y totales", async () => {
    iniciarSesionComo("Propietario")
    render(IDS.remitoBorrador)

    expect(await screen.findByRole("heading", { name: "REM-2026-00012" })).toBeInTheDocument()
    expect(screen.getByText("Cuadrilla Norte")).toBeInTheDocument()
    expect(screen.getByText("Malbec")).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.textContent === "Totales (1 pesaje)")).toBeInTheDocument()
  })

  it("un borrador no ofrece cargar liquidación: solo se liquida lo aprobado", async () => {
    iniciarSesionComo("Propietario")
    render(IDS.remitoBorrador)

    await screen.findByRole("heading", { name: "REM-2026-00012" })
    expect(screen.queryByRole("button", { name: /liquidación/i })).not.toBeInTheDocument()
    // Pero sí las acciones de aprobación, porque está en borrador.
    expect(screen.getByRole("button", { name: /Aprobar REM-2026-00012/i })).toBeInTheDocument()
  })

  it("muestra la liquidación con el desglose de bruto y descuentos", async () => {
    iniciarSesionComo("Propietario")
    render(IDS.remitoAprobado)

    expect(await screen.findByText("Bodega La Consulta")).toBeInTheDocument()
    // Neto persistido por el backend: 3400 × 260 − 40.000 = 844.000.
    expect(screen.getByText("$ 844.000")).toBeInTheDocument()
    // Los kilos aceptados son menos que los despachados y se avisa.
    expect(screen.getByText(/Despachados 3\.500 kg/i)).toBeInTheDocument()
  })

  it("al Capataz le oculta la liquidación, que es dato económico", async () => {
    iniciarSesionComo("Capataz")
    render(IDS.remitoAprobado)

    await screen.findByRole("heading", { name: "REM-2026-00011" })
    expect(screen.queryByText(/Liquidación de la bodega/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /cargar liquidación/i })).not.toBeInTheDocument()
  })

  it("rechaza descuentos mayores al bruto antes de mandarlos", async () => {
    iniciarSesionComo("Agronomo")
    const enviadas: unknown[] = []
    servidor.events.on("request:start", ({ request }) => {
      if (request.method === "PUT" && request.url.endsWith("/liquidacion")) enviadas.push(1)
    })

    const { usuario } = render(IDS.remitoAprobado)
    await screen.findByRole("heading", { name: "REM-2026-00011" })

    await usuario.click(await screen.findByRole("button", { name: /editar liquidación/i }))
    await usuario.clear(screen.getByLabelText(/descuentos/i))
    await usuario.type(screen.getByLabelText(/descuentos/i), "99999999")
    await usuario.click(screen.getByRole("button", { name: /guardar cambios/i }))

    // El backend responde 400; adelantarlo evita el viaje de ida y vuelta.
    expect(
      await screen.findByText(/Los descuentos no pueden superar el importe bruto/i)
    ).toBeInTheDocument()
    expect(enviadas).toHaveLength(0)
  })

  it("precarga la liquidación existente para corregirla", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = render(IDS.remitoAprobado)
    await screen.findByRole("heading", { name: "REM-2026-00011" })

    await usuario.click(await screen.findByRole("button", { name: /editar liquidación/i }))

    // El `PUT` corrige en vez de duplicar, así que partir de lo cargado es lo
    // que hace usable una corrección.
    await waitFor(() => {
      expect(screen.getByLabelText(/bodega/i)).toHaveValue("Bodega La Consulta")
    })
    expect(screen.getByLabelText(/kilos aceptados/i)).toHaveValue(3400)
  })

  it("sin liquidación cargada avisa que el margen es desconocido, no cero", async () => {
    iniciarSesionComo("Propietario")
    // El endpoint devuelve `null` mientras la bodega no liquidó. Es justo el
    // caso que deja el margen bruto del costeo en "no se sabe".
    servidor.use(
      http.get("http://localhost:3000/api/remitos/:id/liquidacion", () =>
        HttpResponse.json(null)
      )
    )

    render(IDS.remitoAprobado)

    expect(await screen.findByText(/figura como desconocido/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cargar liquidación/i })).toBeInTheDocument()
  })
})
