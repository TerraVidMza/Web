import { describe, expect, it, vi } from "vitest"
import { FincaDialog } from "./finca-dialog"
import { Button } from "@/components/ui/button"
import { FINCAS } from "@/test/fixtures"
import { fincaSchema } from "@/api/schemas/finca"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

/**
 * B2: `empresaId` en el body ahora es un 400.
 *
 * El backend la saca del token y borró el campo del DTO porque recibirla
 * permitía crear fincas en otra empresa. Como el `ValidationPipe` corre con
 * `forbidNonWhitelisted: true`, mandarla no se ignora: **rechaza el alta
 * entera** con `property empresaId should not exist`.
 *
 * El handler de MSW reproduce esa regla, así que el test detecta la regresión
 * si alguien vuelve a agregar el campo.
 */
/** El disparador ahora lo provee quien usa el diálogo. */
function Alta() {
  return (
    <FincaDialog>
      <Button>Nueva finca</Button>
    </FincaDialog>
  )
}

describe("FincaDialog", () => {
  it("crea la finca sin mandar empresaId en el body", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos: unknown[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/fincas")) {
        cuerpos.push(await request.clone().json())
      }
    })

    const { usuario } = renderConProveedores(<Alta />)

    await usuario.click(screen.getByRole("button", { name: /nueva finca/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Finca Nueva")
    await usuario.type(screen.getByLabelText(/hectáreas/i), "12.5")
    await usuario.click(screen.getByRole("button", { name: /crear finca/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).toEqual({ nombre: "Finca Nueva", hectareas: 12.5 })
    expect(cuerpos[0]).not.toHaveProperty("empresaId")
  })

  it("manda las hectáreas como número, no como el string del input", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/fincas")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<Alta />)
    await usuario.click(screen.getByRole("button", { name: /nueva finca/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Finca Nueva")
    await usuario.type(screen.getByLabelText(/hectáreas/i), "12.5")
    await usuario.click(screen.getByRole("button", { name: /crear finca/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(typeof cuerpos[0].hectareas).toBe("number")
  })

  it("rechaza 0 hectáreas con la misma regla que el backend (@Min(0.01))", async () => {
    iniciarSesionComo("Propietario")
    const enviadas = vi.fn<() => void>()
    servidor.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/fincas")) enviadas()
    })

    const { usuario } = renderConProveedores(<Alta />)
    await usuario.click(screen.getByRole("button", { name: /nueva finca/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Finca Cero")
    await usuario.type(screen.getByLabelText(/hectáreas/i), "0")
    await usuario.click(screen.getByRole("button", { name: /crear finca/i }))

    // Una finca de cero hectáreas divide por cero en todos los indicadores por
    // hectárea, así que se corta en el cliente y ni se manda.
    expect(await screen.findByText(/Las hectáreas deben ser mayores que 0/i)).toBeInTheDocument()
    expect(enviadas).not.toHaveBeenCalled()
  })

  it("rechaza más de 2 decimales, como @IsNumber({ maxDecimalPlaces: 2 })", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<Alta />)

    await usuario.click(screen.getByRole("button", { name: /nueva finca/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Finca Decimal")
    await usuario.type(screen.getByLabelText(/hectáreas/i), "12.555")
    await usuario.click(screen.getByRole("button", { name: /crear finca/i }))

    expect(await screen.findByText(/Máximo 2 decimales/i)).toBeInTheDocument()
  })

  it("en edición precarga los valores y manda un PATCH sin empresaId", async () => {
    iniciarSesionComo("Propietario")
    // Se parsea el fixture crudo con el schema real: así el test también
    // comprueba que `hectareas: "25.50"` llega al input como "25.5" y no como
    // el string del driver de Postgres.
    const finca = fincaSchema.parse(FINCAS[0])

    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "PATCH" && request.url.includes("/fincas/")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(
      <FincaDialog finca={finca}>
        <Button>Editar</Button>
      </FincaDialog>
    )

    await usuario.click(screen.getByRole("button", { name: "Editar" }))
    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue("Finca El Rosal")
    expect(screen.getByLabelText(/hectáreas/i)).toHaveValue(25.5)

    await usuario.clear(screen.getByLabelText(/^nombre$/i))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Finca Renombrada")
    await usuario.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0].nombre).toBe("Finca Renombrada")
    expect(cuerpos[0]).not.toHaveProperty("empresaId")
    expect(cuerpos[0]).not.toHaveProperty("id")
  })
})
