import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { CorrelacionPage } from "./correlacion-page"
import { iniciarSesionComo, renderConProveedores, screen } from "@/test/utils"
import { servidor } from "@/test/setup"
import { CORRELACION } from "@/test/fixtures-inteligencia"

async function elegirTodo(usuario: ReturnType<typeof renderConProveedores>["usuario"]) {
  await usuario.click(await screen.findByRole("combobox", { name: /^finca$/i }))
  await usuario.click(await screen.findByRole("option", { name: "Finca El Rosal" }))
  await usuario.click(screen.getByRole("combobox", { name: /^cuartel$/i }))
  await usuario.click(await screen.findByRole("option", { name: "Cuartel 1" }))
  await usuario.click(screen.getByRole("combobox", { name: /^sensor$/i }))
  await usuario.click(await screen.findByRole("option", { name: /SEN-01/ }))
}

describe("CorrelacionPage (HU-29)", () => {
  it("no consulta hasta tener cuartel, sensor y fechas", async () => {
    iniciarSesionComo("Agronomo")
    const pedidos: string[] = []
    servidor.events.on("request:start", ({ request }) => {
      if (request.url.includes("/correlacion/")) pedidos.push(request.url)
    })

    renderConProveedores(<CorrelacionPage />)
    await screen.findByText(/Elegí un cuartel y un sensor/i)

    // Sin esos parámetros el backend responde 400; pedirlo igual seria gastar
    // un viaje para recibir un error previsible.
    expect(pedidos).toHaveLength(0)
  })

  it("avisa que los datos no alcanzan en vez de presentar un veredicto", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<CorrelacionPage />)
    await elegirTodo(usuario)

    // El coeficiente viene igual (0,98) pero no se puede leer como conclusión:
    // son 3 días de 7. El mensaje y el umbral los emite el backend.
    expect(await screen.findByText(/No hay suficientes datos/i)).toBeInTheDocument()
    expect(screen.getByText(/3 de 7 días necesarios/i)).toBeInTheDocument()
    expect(screen.getByText("0,98")).toBeInTheDocument()
  })

  it("sin coeficiente calculable muestra un guion y no un error (W-035)", async () => {
    // El backend manda `null` con menos de dos días en común o una serie sin
    // variación. La Web lo validaba como número y la pantalla entera fallaba.
    servidor.use(
      http.get("http://localhost:3000/api/inteligencia-agronomica/correlacion/:cuartelId", () =>
        HttpResponse.json({
          ...CORRELACION,
          coeficienteCorrelacion: null,
          interpretacion: "Sin datos suficientes",
        })
      )
    )
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<CorrelacionPage />)
    await elegirTodo(usuario)

    expect(await screen.findByText("Sin datos suficientes")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
    expect(screen.getByText(/No hay suficientes datos/i)).toBeInTheDocument()
  })

  /**
   * La regla que evita el peor error posible de esta pantalla: dos magnitudes
   * de escalas distintas en un solo gráfico con dos ejes Y inventarían una
   * correlación visual que el dato no respalda.
   */
  it("dibuja las dos series en gráficos separados y lo explica", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<CorrelacionPage />)
    await elegirTodo(usuario)

    await screen.findByText(/Las dos series, día por día/i)
    const figuras = screen.getAllByRole("figure")
    expect(figuras).toHaveLength(2)
    expect(screen.getByText(/Costo diario del cuartel/i)).toBeInTheDocument()
    expect(screen.getByText(/magnitudes de escalas distintas/i)).toBeInTheDocument()
  })

  it("le niega la correlación al Capataz", async () => {
    iniciarSesionComo("Capataz")
    const { usuario } = renderConProveedores(<CorrelacionPage />)
    await usuario.click(await screen.findByRole("combobox", { name: /^finca$/i }))
    await usuario.click(await screen.findByRole("option", { name: "Finca El Rosal" }))

    // Ni siquiera puede listar los sensores: `GET /sensores` es `@Roles(P, A)`.
    expect(screen.getByRole("combobox", { name: /^sensor$/i })).toBeInTheDocument()
  })
})
