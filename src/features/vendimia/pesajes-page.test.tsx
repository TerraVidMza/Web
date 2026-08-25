import { describe, expect, it } from "vitest"
import { PesajesPage } from "./pesajes-page"
import { IDS } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen, within } from "@/test/utils"

const PATRON = "/cuarteles/:cuartelId/pesajes"

describe("PesajesPage (HU-26)", () => {
  it("lista los pesajes con su cuadrilla, tarifa y remito", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<PesajesPage />, {
      ruta: `/cuarteles/${IDS.cuartel}/pesajes`,
      patron: PATRON,
    })

    const fila = within((await screen.findByText("Cuadrilla Norte")).closest("tr")!)
    expect(fila.getByText("2.000 kg")).toBeInTheDocument()
    expect(fila.getByText("En remito")).toBeInTheDocument()
    expect(fila.getByRole("link", { name: /ver remito/i })).toBeInTheDocument()
  })

  it("aclara que la carga es de campo y acá es solo lectura", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<PesajesPage />, {
      ruta: `/cuarteles/${IDS.cuartel}/pesajes`,
      patron: PATRON,
    })

    // Decisión D-d: los pesajes se registran desde Mobile.
    expect(
      await screen.findByText(/Se cargan desde la aplicación móvil/i)
    ).toBeInTheDocument()
  })
})
