import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { MapaPage } from "./mapa-page"
import { FINCAS } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen } from "@/test/utils"
import { servidor } from "@/test/setup"

/**
 * El caso que hoy es el normal, no la excepción: en el seed del backend todas
 * las latitudes y longitudes son `null`. Un mapa vacío sin explicación se lee
 * como que el mapa está roto.
 */
describe("MapaPage (HU-10)", () => {
  it("explica que faltan coordenadas en vez de mostrar un mapa vacío", async () => {
    iniciarSesionComo("Agronomo")
    servidor.use(
      http.get("http://localhost:3000/api/fincas", () =>
        HttpResponse.json(FINCAS.map((f) => ({ ...f, latitud: null, longitud: null })))
      )
    )

    renderConProveedores(<MapaPage />)

    expect(
      await screen.findByText(/Ninguna finca tiene coordenadas cargadas/i)
    ).toBeInTheDocument()
    // Y dice dónde se cargan: es una tarea pendiente concreta, no un error.
    expect(screen.getByRole("link", { name: /editando la finca/i })).toHaveAttribute(
      "href",
      "/fincas"
    )
  })

  it("avisa cuántas quedaron fuera cuando solo algunas tienen coordenadas", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<MapaPage />)

    // En los fixtures, «Finca El Rosal» no tiene coordenadas y «La Consulta» sí.
    expect(
      await screen.findByText(/1 sin coordenadas cargadas/i)
    ).toBeInTheDocument()
  })

  it("permite pasar de las fincas a los cuarteles de una", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<MapaPage />)

    await screen.findByText(/1 sin coordenadas cargadas/i)
    await usuario.click(screen.getByRole("combobox", { name: /^ver$/i }))
    await usuario.click(await screen.findByRole("option", { name: /Cuarteles de Finca El Rosal/i }))

    // El cuartel de los fixtures tampoco tiene coordenadas.
    expect(
      await screen.findByText(/Ningún cuartel de esta finca tiene coordenadas/i)
    ).toBeInTheDocument()
  })

  it("el Auditor también ve el mapa: puede listar fincas (D-021 del backend)", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<MapaPage />)

    expect(await screen.findByText(/1 sin coordenadas cargadas/i)).toBeInTheDocument()
  })
})
