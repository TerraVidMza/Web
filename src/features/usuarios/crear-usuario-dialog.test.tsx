import { describe, expect, it, vi } from "vitest"
import { CrearUsuarioDialog } from "./crear-usuario-dialog"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

function capturarAltas() {
  const cuerpos: Record<string, unknown>[] = []
  servidor.events.on("request:start", async ({ request }) => {
    if (request.method === "POST" && request.url.endsWith("/usuarios")) {
      cuerpos.push((await request.clone().json()) as Record<string, unknown>)
    }
  })
  return cuerpos
}

/**
 * B5 y W6: el alta de usuario.
 *
 * El diálogo anterior exigía contraseña —forzando el camino que HU-05
 * desaconseja— y validaba `min(8)` a secas contra los 8-72 con letra y número
 * del backend, así que `12345678` pasaba acá y lo rechazaba el servidor.
 */
describe("CrearUsuarioDialog", () => {
  it("permite crear sin contraseña, que es el camino recomendado", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos = capturarAltas()
    const { usuario } = renderConProveedores(<CrearUsuarioDialog />)

    await usuario.click(screen.getByRole("button", { name: /nuevo usuario/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Elena Nueva")
    await usuario.type(screen.getByLabelText(/^email$/i), "elena@terravid.demo")
    await usuario.click(await screen.findByRole("combobox", { name: /rol/i }))
    await usuario.click(await screen.findByRole("option", { name: "Agrónomo" }))
    await usuario.click(screen.getByRole("button", { name: /crear usuario/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).not.toHaveProperty("password")
    // Y sin `empresaId`, que el backend rechaza con un 400 (B2).
    expect(cuerpos[0]).not.toHaveProperty("empresaId")
    expect(cuerpos[0].email).toBe("elena@terravid.demo")
  })

  it("rechaza una contraseña sin números, igual que el backend", async () => {
    iniciarSesionComo("Propietario")
    const enviadas = vi.fn<() => void>()
    servidor.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/usuarios")) enviadas()
    })
    const { usuario } = renderConProveedores(<CrearUsuarioDialog />)

    await usuario.click(screen.getByRole("button", { name: /nuevo usuario/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Elena Nueva")
    await usuario.type(screen.getByLabelText(/^email$/i), "elena@terravid.demo")
    await usuario.click(await screen.findByRole("combobox", { name: /rol/i }))
    await usuario.click(await screen.findByRole("option", { name: "Agrónomo" }))
    await usuario.type(screen.getByLabelText(/contraseña/i), "solotexto")
    await usuario.click(screen.getByRole("button", { name: /crear usuario/i }))

    expect(await screen.findByText(/al menos una letra y un número/i)).toBeInTheDocument()
    expect(enviadas).not.toHaveBeenCalled()
  })

  it("rechaza 12345678, que la regla vieja dejaba pasar", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<CrearUsuarioDialog />)

    await usuario.click(screen.getByRole("button", { name: /nuevo usuario/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Elena Nueva")
    await usuario.type(screen.getByLabelText(/^email$/i), "elena@terravid.demo")
    await usuario.click(await screen.findByRole("combobox", { name: /rol/i }))
    await usuario.click(await screen.findByRole("option", { name: "Agrónomo" }))
    await usuario.type(screen.getByLabelText(/contraseña/i), "12345678")
    await usuario.click(screen.getByRole("button", { name: /crear usuario/i }))

    expect(await screen.findByText(/al menos una letra y un número/i)).toBeInTheDocument()
  })
})
