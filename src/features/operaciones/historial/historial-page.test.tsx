import { describe, expect, it } from "vitest"
import { HistorialPage } from "./historial-page"
import { costoDeLabor, registroLaborSchema } from "@/api/schemas/operaciones"
import { IDS, REGISTROS_LABOR } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen, within } from "@/test/utils"

const RUTA = `/cuarteles/${IDS.cuartel}/historial`
const PATRON = "/cuarteles/:cuartelId/historial"

function render() {
  return renderConProveedores(<HistorialPage />, { ruta: RUTA, patron: PATRON })
}

describe("HistorialPage (HU-17)", () => {
  it("muestra la labor con su responsable y los insumos consumidos", async () => {
    iniciarSesionComo("Agronomo")
    render()

    const fila = (await screen.findByText("Poda de invierno")).closest("tr")!
    expect(within(fila).getByText("Carla Capataz")).toBeInTheDocument()
    expect(within(fila).getByText("Fertilizante NPK")).toBeInTheDocument()
    // 20 kg × $1200 del costo congelado al sincronizar.
    expect(within(fila).getByText(/\$ 24\.000/)).toBeInTheDocument()
  })

  it("suma mano de obra e insumos en el costo de la labor", async () => {
    iniciarSesionComo("Agronomo")
    render()

    const fila = (await screen.findByText("Poda de invierno")).closest("tr")!
    // 3 jornales × $45.000 = 135.000, más 20 kg × $1.200 = 24.000.
    expect(within(fila).getByText("$ 159.000")).toBeInTheDocument()
  })

  it("marca el registro que usó un ítem de catálogo dado de baja", async () => {
    iniciarSesionComo("Agronomo")
    render()

    // El backend lo acepta igual —el trabajo físico ocurrió— pero lo marca
    // para que alguien lo revise.
    expect(await screen.findByText("Revisar")).toBeInTheDocument()
  })

  it("le avisa al Capataz que ve solo sus registros del día", async () => {
    iniciarSesionComo("Capataz")
    render()

    // La restricción la aplica el backend después de los filtros; sin avisarlo
    // parecería que faltan datos.
    expect(
      await screen.findByText(/ves únicamente los registros que cargaste vos hoy/i)
    ).toBeInTheDocument()
    // Y los filtros de fecha quedan deshabilitados, porque no cambian nada.
    expect(screen.getByLabelText(/^desde$/i)).toBeDisabled()
  })

  it("al Capataz no le muestra la columna de costo", async () => {
    iniciarSesionComo("Capataz")
    render()

    await screen.findByText("Poda de invierno")
    expect(screen.queryByRole("columnheader", { name: /costo/i })).not.toBeInTheDocument()
  })

  it("el Auditor entra: es su segundo recurso además del log", async () => {
    iniciarSesionComo("Auditor")
    render()

    expect(await screen.findByText("Poda de invierno")).toBeInTheDocument()
    // Pero sin costos: son dato económico y su alcance no los incluye.
    expect(screen.queryByRole("columnheader", { name: /costo/i })).not.toBeInTheDocument()
  })
})

describe("costoDeLabor", () => {
  it("suma la mano de obra y cada insumo con su costo congelado", () => {
    const registro = registroLaborSchema.parse(REGISTROS_LABOR[0])
    expect(costoDeLabor(registro)).toBe(3 * 45000 + 20 * 1200)
  })

  it("trata como cero el costo que no se registró, sin producir NaN", () => {
    const registro = registroLaborSchema.parse({
      ...REGISTROS_LABOR[0],
      costoUnitarioAlSync: null,
      detalles: [{ ...REGISTROS_LABOR[0].detalles[0], costoUnitarioAlSync: null }],
    })
    expect(costoDeLabor(registro)).toBe(0)
  })
})
