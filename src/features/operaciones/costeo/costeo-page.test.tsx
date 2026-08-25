import { describe, expect, it } from "vitest"
import { CosteoPage } from "./costeo-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"
import { servidor } from "@/test/setup"

function filaDe(nombre: string) {
  return screen.getByText(nombre).closest("tr")!
}

describe("CosteoPage (HU-15)", () => {
  it("muestra el costo y el margen de cada cuartel", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<CosteoPage />)

    const fila = within(await screen.findByText("Cuartel 1").then(() => filaDe("Cuartel 1")))
    expect(fila.getByText("$ 1.200.000")).toBeInTheDocument()
    expect(fila.getByText("$ 800.000")).toBeInTheDocument()
  })

  /**
   * La aserción que da sentido a todo el schema: el backend manda `null` —y no
   * 0— cuando falta la superficie o no hay liquidaciones. Un `$ 0` diría "no
   * cuesta nada por hectárea" y "no ganó nada", que son afirmaciones distintas
   * de "todavía no se sabe".
   */
  it("distingue el dato desconocido del cero", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<CosteoPage />)

    await screen.findByText("Cuartel 2")
    const fila = within(filaDe("Cuartel 2"))

    expect(
      fila.getByText(/No se puede calcular sin la superficie del cuartel/i)
    ).toBeInTheDocument()
    expect(
      fila.getByText(/Sin liquidaciones de bodega cargadas todavía/i)
    ).toBeInTheDocument()

    // Y el costo, que sí se conoce, se muestra como número.
    expect(fila.getByText("$ 175.000")).toBeInTheDocument()
  })

  it("muestra la fila de totales", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<CosteoPage />)

    await screen.findByText("Cuartel 1")
    const totales = within(screen.getByText("Totales").closest("tr")!)
    expect(totales.getByText("$ 1.375.000")).toBeInTheDocument()
    expect(totales.getByText("$ 625.000")).toBeInTheDocument()
  })

  it("manda el rango de fechas al backend", async () => {
    iniciarSesionComo("Propietario")
    const urls: URL[] = []
    servidor.events.on("request:start", ({ request }) => {
      const url = new URL(request.url)
      if (url.pathname.endsWith("/registro-labor/costeo")) urls.push(url)
    })

    const { usuario } = renderConProveedores(<CosteoPage />)
    await screen.findByText("Cuartel 1")
    await usuario.type(screen.getByLabelText(/^desde$/i), "2026-06-01")

    await waitFor(() => {
      expect(urls.at(-1)!.searchParams.get("desde")).toBe("2026-06-01")
    })
  })

  it("le niega el costeo al Capataz, que no tiene alcance económico", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<CosteoPage />)

    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })
})
