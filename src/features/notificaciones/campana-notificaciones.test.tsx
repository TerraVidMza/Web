import { describe, expect, it } from "vitest"
import { CampanaNotificaciones } from "./campana-notificaciones"
import { iniciarSesionComo, renderConProveedores, screen } from "@/test/utils"

/**
 * HU-35. El badge sale de `noLeidas`, que el backend agrega al envelope
 * justamente para que el cliente no tenga que traerse la lista completa —
 * paginada de a 20— solo para contar.
 */
describe("CampanaNotificaciones", () => {
  it("anuncia la cantidad sin leer en el nombre accesible del botón", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<CampanaNotificaciones />)

    expect(
      await screen.findByRole("button", { name: /Notificaciones: 1 sin leer/i })
    ).toBeInTheDocument()
  })

  it("abre el panel con las notificaciones y el enlace a la pantalla completa", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<CampanaNotificaciones />)

    await usuario.click(await screen.findByRole("button", { name: /Notificaciones/i }))

    expect(await screen.findByText("Temperatura fuera de umbral")).toBeInTheDocument()
    expect(screen.getByText("Remito pendiente de aprobación")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /ver todas/i })).toBeInTheDocument()
  })
})
