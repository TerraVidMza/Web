import { describe, expect, it } from "vitest"
import { ComparacionPage } from "./comparacion-page"
import { iniciarSesionComo, renderConProveedores, screen, within } from "@/test/utils"

const ANIO = new Date().getFullYear()

async function elegirTodo(usuario: ReturnType<typeof renderConProveedores>["usuario"]) {
  await usuario.click(await screen.findByRole("combobox", { name: /^finca$/i }))
  await usuario.click(await screen.findByRole("option", { name: "Finca El Rosal" }))
  await usuario.click(screen.getByRole("combobox", { name: /^cuartel$/i }))
  await usuario.click(await screen.findByRole("option", { name: "Cuartel 1" }))
  await usuario.click(screen.getByRole("combobox", { name: /campaña a/i }))
  await usuario.click(await screen.findByRole("option", { name: `${ANIO - 1}/${ANIO}` }))
  await usuario.click(screen.getByRole("combobox", { name: /campaña b/i }))
  await usuario.click(await screen.findByRole("option", { name: `${ANIO}/${ANIO + 1}` }))
}

function filaDe(indicador: string) {
  return within(screen.getByText(indicador).closest("tr")!)
}

describe("ComparacionPage (HU-31)", () => {
  it("pide cuartel y dos campañas antes de comparar", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<ComparacionPage />)

    expect(await screen.findByText(/Elegí un cuartel y dos campañas/i)).toBeInTheDocument()
  })

  /**
   * Lo que hace legible la comparación: el sentido del indicador. Un costo que
   * sube es malo y unos kilos que suben son buenos, y eso viene del backend en
   * `sentidoIndicadores` — no se deduce del signo.
   */
  it("pinta la variación según el sentido del indicador, no según el signo", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<ComparacionPage />)
    await elegirTodo(usuario)

    await screen.findByText("Kilos cosechados")

    // +15 % de kilos: mejora, aunque el signo sea el mismo que el del costo.
    const kilos = filaDe("Kilos cosechados").getByText(/\+15/)
    expect(kilos).toHaveTextContent(", mejora")

    // +22,5 % de costo total: empeora.
    const costo = filaDe("Costo total").getByText(/\+22,5/)
    expect(costo).toHaveTextContent(", empeora")
  })

  it("no compara contra un margen desconocido", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<ComparacionPage />)
    await elegirTodo(usuario)

    await screen.findByText("Margen bruto")
    // El segundo período no tiene liquidaciones: su margen es `null`, y una
    // variación contra un desconocido no significa nada.
    const fila = filaDe("Margen bruto")
    expect(
      fila.getByText(/No se puede comparar: falta el dato/i)
    ).toBeInTheDocument()
    expect(fila.getByText(/Sin liquidaciones de bodega/i)).toBeInTheDocument()
  })

  it("distingue el acumulado de lluvia del promedio de temperatura", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<ComparacionPage />)
    await elegirTodo(usuario)

    await screen.findByText(/Condiciones medidas en cada período/i)

    // Los mm caídos son un acumulado del período; promediarlos daría "mm por
    // lectura", que no significa nada agronómicamente.
    const lluvia = filaDe("Pluviómetro")
    expect(lluvia.getByText("acumulado")).toBeInTheDocument()
    expect(filaDe("Temperatura").getByText("promedio")).toBeInTheDocument()
  })

  it("le niega la comparación al Capataz", async () => {
    iniciarSesionComo("Capataz")
    const { usuario } = renderConProveedores(<ComparacionPage />)
    await elegirTodo(usuario)

    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })
})
