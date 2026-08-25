import { describe, expect, it } from "vitest"
import { AccionesCuartel } from "./acciones-cuartel"
import { cuartelSchema } from "@/api/schemas/cuartel"
import { CUARTELES } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen } from "@/test/utils"

const cuartel = cuartelSchema.parse(CUARTELES[0])

describe("AccionesCuartel", () => {
  it("el Agrónomo puede editar pero no dar de baja", async () => {
    // No es una distinción inventada: `@Roles(PROPIETARIO, AGRONOMO)` en
    // `update` y `@Roles(PROPIETARIO)` en `desactivar`.
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<AccionesCuartel cuartel={cuartel} />)

    await usuario.click(screen.getByRole("button", { name: /Acciones de Cuartel 1/i }))

    expect(await screen.findByRole("menuitem", { name: /editar/i })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: /dar de baja/i })).not.toBeInTheDocument()
  })

  it("el Capataz no ve el menú de acciones", () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<AccionesCuartel cuartel={cuartel} />)

    expect(screen.queryByRole("button", { name: /Acciones de/i })).not.toBeInTheDocument()
  })

  it("explica por qué no se puede dar de baja un cuartel con registros", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<AccionesCuartel cuartel={cuartel} />)

    await usuario.click(screen.getByRole("button", { name: /Acciones de Cuartel 1/i }))
    await usuario.click(await screen.findByRole("menuitem", { name: /dar de baja/i }))
    await usuario.click(screen.getByRole("button", { name: "Dar de baja" }))

    const alerta = await screen.findByRole("alert")
    // El mensaje del backend nombra la campaña, que es el recorte que aplica:
    // un cuartel con una labor de hace cinco años sí se puede dar de baja.
    expect(alerta).toHaveTextContent(/4 labor\(es\) y 2 pesaje\(s\)/i)
    expect(alerta).toHaveTextContent(/campaña actual \("2026"\)/i)
  })
})
