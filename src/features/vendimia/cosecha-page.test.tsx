import { describe, expect, it } from "vitest"
import { CosechaPage } from "./cosecha-page"
import { iniciarSesionComo, renderConProveedores, screen, within } from "@/test/utils"

async function elegirFinca(usuario: ReturnType<typeof renderConProveedores>["usuario"]) {
  await usuario.click(await screen.findByRole("combobox", { name: /finca/i }))
  await usuario.click(await screen.findByRole("option", { name: "Finca El Rosal" }))
}

describe("CosechaPage (HU-28)", () => {
  it("abre los kilos por estado del pesaje", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<CosechaPage />)
    await elegirFinca(usuario)

    const fila = within((await screen.findByText("Cuartel 1")).closest("tr")!)
    expect(fila.getByText("5.500 kg")).toBeInTheDocument()
    expect(fila.getByText("3.500 kg")).toBeInTheDocument()
    // Los observados vienen de un remito rechazado: no vuelven solos a la cola.
    expect(fila.getByText("2.000 kg")).toBeInTheDocument()
  })

  it("no inventa un rendimiento cuando falta la superficie", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<CosechaPage />)
    await elegirFinca(usuario)

    await screen.findByText("Cuartel 2")
    const fila = within(screen.getByText("Cuartel 2").closest("tr")!)
    expect(fila.getByText(/no tiene superficie cargada/i)).toBeInTheDocument()
  })

  it("aclara que lo pagado a cuadrillas es costo, no ingreso", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<CosechaPage />)
    await elegirFinca(usuario)

    // El ingreso es la liquidación de bodega, que es otra entidad (D-005).
    expect(await screen.findByText(/Costo de cosecha, no ingreso/i)).toBeInTheDocument()
  })
})
