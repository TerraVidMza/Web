import { describe, expect, it } from "vitest"
import { CrearCuartelDialog } from "./crear-cuartel-dialog"
import { IDS } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

function capturarAltas() {
  const cuerpos: Record<string, unknown>[] = []
  servidor.events.on("request:start", async ({ request }) => {
    if (request.method === "POST" && request.url.endsWith("/cuarteles")) {
      cuerpos.push((await request.clone().json()) as Record<string, unknown>)
    }
  })
  return cuerpos
}

async function completarMinimo(usuario: ReturnType<typeof renderConProveedores>["usuario"]) {
  await usuario.click(screen.getByRole("button", { name: /nuevo cuartel/i }))
  await usuario.type(screen.getByLabelText(/^nombre$/i), "Cuartel 7")
  await usuario.click(await screen.findByRole("combobox", { name: /variedad/i }))
  await usuario.click(await screen.findByRole("option", { name: "Malbec" }))
  await usuario.click(screen.getByRole("combobox", { name: /sistema de conducción/i }))
  await usuario.click(await screen.findByRole("option", { name: "Espaldero" }))
}

describe("CrearCuartelDialog", () => {
  it("manda los números como números y omite los campos vacíos", async () => {
    iniciarSesionComo("Agronomo")
    const cuerpos = capturarAltas()
    const { usuario } = renderConProveedores(<CrearCuartelDialog fincaId={IDS.finca} />)

    await completarMinimo(usuario)
    await usuario.type(screen.getByLabelText(/hectáreas/i), "6")
    await usuario.type(screen.getByLabelText(/año de implantación/i), "2015")
    await usuario.click(screen.getByRole("button", { name: /crear cuartel/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).toEqual({
      nombre: "Cuartel 7",
      variedadId: IDS.variedad,
      sistemaConduccionId: IDS.sistema,
      hectareas: 6,
      anioImplantacion: 2015,
      fincaId: IDS.finca,
    })
    // Los opcionales sin completar no viajan como `""`: el backend los valida
    // con `@IsNumber`/`@Length` y un string vacío sería un 400.
    expect(cuerpos[0]).not.toHaveProperty("clon")
    expect(cuerpos[0]).not.toHaveProperty("latitud")
  })

  it("rechaza un año de implantación futuro, como @EsAnioImplantacionValido", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<CrearCuartelDialog fincaId={IDS.finca} />)

    await completarMinimo(usuario)
    await usuario.type(
      screen.getByLabelText(/año de implantación/i),
      String(new Date().getFullYear() + 1)
    )
    await usuario.click(screen.getByRole("button", { name: /crear cuartel/i }))

    expect(await screen.findByText(/El año no puede ser futuro/i)).toBeInTheDocument()
  })

  it("rechaza una latitud fuera de rango, como @Min(-90) @Max(90)", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<CrearCuartelDialog fincaId={IDS.finca} />)

    await completarMinimo(usuario)
    await usuario.type(screen.getByLabelText(/latitud/i), "120")
    await usuario.click(screen.getByRole("button", { name: /crear cuartel/i }))

    expect(await screen.findByText(/La latitud va de -90 a 90/i)).toBeInTheDocument()
  })

  it("exige seleccionar variedad y sistema de conducción", async () => {
    iniciarSesionComo("Agronomo")
    const { usuario } = renderConProveedores(<CrearCuartelDialog fincaId={IDS.finca} />)

    await usuario.click(screen.getByRole("button", { name: /nuevo cuartel/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Cuartel 7")
    await usuario.click(screen.getByRole("button", { name: /crear cuartel/i }))

    // Los mensajes de error dicen algo distinto del placeholder a propósito:
    // repetirlo no distingue "todavía no elegiste" de "esto está mal".
    expect(await screen.findByText(/Falta elegir la variedad/i)).toBeInTheDocument()
    expect(screen.getByText(/Falta elegir el sistema de conducción/i)).toBeInTheDocument()
  })
})
