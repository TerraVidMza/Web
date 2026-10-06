import { describe, expect, it } from "vitest"
import { FincasPage } from "./fincas-page"
import { iniciarSesionComo, renderConProveedores, screen } from "@/test/utils"

describe("FincasPage (HU-08)", () => {
  it("lista las fincas de la empresa con sus datos", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<FincasPage />)

    const fila = (await screen.findByText("Finca El Rosal")).closest("tr")!
    expect(fila).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /nueva finca/i })).toBeInTheDocument()
  })

  it("filtra por nombre al escribir en el buscador", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<FincasPage />)

    await screen.findByText("Finca El Rosal")
    await usuario.type(screen.getByPlaceholderText(/buscar finca/i), "inexistente-xyz")

    expect(await screen.findByText(/Ninguna finca coincide con/i)).toBeInTheDocument()
  })

  it("no ofrece 'Nueva finca' a un rol sin permiso de escritura", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<FincasPage />)

    await screen.findByText("Finca El Rosal")
    expect(screen.queryByRole("button", { name: /nueva finca/i })).not.toBeInTheDocument()
  })
})
