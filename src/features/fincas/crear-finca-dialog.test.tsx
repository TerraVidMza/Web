import { describe, expect, it, vi } from "vitest"
import { CrearFincaDialog } from "./crear-finca-dialog"
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
describe("CrearFincaDialog", () => {
  it("crea la finca sin mandar empresaId en el body", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos: unknown[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/fincas")) {
        cuerpos.push(await request.clone().json())
      }
    })

    const { usuario } = renderConProveedores(<CrearFincaDialog />)

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

    const { usuario } = renderConProveedores(<CrearFincaDialog />)
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

    const { usuario } = renderConProveedores(<CrearFincaDialog />)
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
    const { usuario } = renderConProveedores(<CrearFincaDialog />)

    await usuario.click(screen.getByRole("button", { name: /nueva finca/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Finca Decimal")
    await usuario.type(screen.getByLabelText(/hectáreas/i), "12.555")
    await usuario.click(screen.getByRole("button", { name: /crear finca/i }))

    expect(await screen.findByText(/Máximo 2 decimales/i)).toBeInTheDocument()
  })
})
