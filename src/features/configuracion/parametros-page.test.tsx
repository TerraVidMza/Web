import { describe, expect, it } from "vitest"
import { ParametrosPage } from "./parametros-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

function capturarGuardados() {
  const cuerpos: Record<string, unknown>[] = []
  servidor.events.on("request:start", async ({ request }) => {
    if (request.method === "PUT" && request.url.endsWith("/configuracion")) {
      cuerpos.push((await request.clone().json()) as Record<string, unknown>)
    }
  })
  return cuerpos
}

describe("ParametrosPage (HU-33)", () => {
  it("precarga los valores guardados", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<ParametrosPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre$/i)).toHaveValue("Bodega Demo")
    })
    expect(screen.getByLabelText(/^moneda$/i)).toHaveValue("ARS")
    expect(screen.getByLabelText(/^host$/i)).toHaveValue("smtp.terravid.demo")
  })

  /**
   * El bug que este test existe para impedir: `GET /configuracion` devuelve
   * `smtp_pass` como `********`. Si la pantalla precargara ese valor y lo
   * reenviara, guardaría ocho asteriscos como contraseña y dejaría el correo
   * saliente roto sin que nadie se entere hasta el próximo alta de usuario.
   */
  it("no precarga la contraseña enmascarada ni la puede reenviar", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<ParametrosPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/^host$/i)).toHaveValue("smtp.terravid.demo")
    })

    const password = screen.getByLabelText(/^contraseña$/i)
    expect(password).toHaveValue("")
    expect(password).toHaveAttribute(
      "placeholder",
      expect.stringContaining("Ya configurada")
    )

    // Y su botón «Guardar» está deshabilitado mientras el campo esté vacío.
    const fila = password.closest("div.grid")!
    const guardar = fila.querySelector("button")!
    expect(guardar).toBeDisabled()
  })

  it("guarda la contraseña solo cuando se escribe una nueva", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos = capturarGuardados()
    const { usuario } = renderConProveedores(<ParametrosPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/^host$/i)).toHaveValue("smtp.terravid.demo")
    })

    await usuario.type(screen.getByLabelText(/^contraseña$/i), "clave-nueva-123")
    const fila = screen.getByLabelText(/^contraseña$/i).closest("div.grid")!
    await usuario.click(fila.querySelector("button")!)

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).toEqual({ clave: "smtp_pass", valor: "clave-nueva-123" })
  })

  it("el botón de un campo sin cambios está deshabilitado", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<ParametrosPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/^moneda$/i)).toHaveValue("ARS")
    })
    const fila = screen.getByLabelText(/^moneda$/i).closest("div.grid")!
    expect(fila.querySelector("button")).toBeDisabled()
  })
})
