import { describe, expect, it } from "vitest"
import { DashboardPage } from "./dashboard-page"
import { iniciarSesionComo, renderConProveedores, screen } from "@/test/utils"

/**
 * B3: el dashboard es una unión discriminada por rol.
 *
 * La aserción que importa es la negativa. `Intl.NumberFormat.format(undefined)`
 * devuelve **`"NaN"`** en vez de lanzar, así que el Auditor —cuya respuesta es
 * `{ rol, eventosRecientes }` y nada más— veía seis tarjetas que decían NaN sin
 * un solo error en consola.
 */
describe("DashboardPage por rol", () => {
  it("el Propietario ve los indicadores operativos y los económicos", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<DashboardPage />)

    expect(await screen.findByText("Fincas activas")).toBeInTheDocument()
    expect(screen.getByText("Costo operativo total")).toBeInTheDocument()
    expect(screen.getByText("Costo por finca")).toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it("el Auditor ve su actividad reciente y ninguna tarjeta en NaN", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<DashboardPage />)

    expect(await screen.findByText(/Actividad de las últimas 24 horas/i)).toBeInTheDocument()
    expect(screen.getByText("CREAR_FINCA")).toBeInTheDocument()

    // Lo que rompía:
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    // Y no debe recibir métricas económicas: su alcance es el log de auditoría.
    expect(screen.queryByText("Costo operativo total")).not.toBeInTheDocument()
    expect(screen.queryByText("Fincas activas")).not.toBeInTheDocument()
  })

  it("el Capataz ve su tablero de campo y no los costos de la empresa", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<DashboardPage />)

    expect(await screen.findByText("Registros sin sincronizar")).toBeInTheDocument()
    expect(screen.getByText("Cuarteles en cosecha")).toBeInTheDocument()
    expect(screen.queryByText("Costo operativo total")).not.toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it("nombra la campaña que acota los kilos en vez de asumir el año calendario", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<DashboardPage />)

    expect(await screen.findByText("Campaña 2026")).toBeInTheDocument()
  })
})
