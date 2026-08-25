import { describe, expect, it } from "vitest"
import { EditarUsuarioDialog } from "./editar-usuario-dialog"
import { usuarioSchema } from "@/api/schemas/usuario"
import { IDS, USUARIOS } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"
import { Button } from "@/components/ui/button"

/** `USUARIOS[0]` es la Propietaria de la sesión; `USUARIOS[1]`, el Agrónomo. */
const propietaria = usuarioSchema.parse(USUARIOS[0])
const agronomo = usuarioSchema.parse(USUARIOS[1])
const inactivo = usuarioSchema.parse({ ...USUARIOS[2], activo: false })

function capturarPatches() {
  const cuerpos: Record<string, unknown>[] = []
  servidor.events.on("request:start", async ({ request }) => {
    if (request.method === "PATCH" && /\/usuarios\/[^/]+$/.test(new URL(request.url).pathname)) {
      cuerpos.push((await request.clone().json()) as Record<string, unknown>)
    }
  })
  return cuerpos
}

async function abrir(usuario: typeof agronomo) {
  const utils = renderConProveedores(
    <EditarUsuarioDialog usuario={usuario}>
      <Button>Editar</Button>
    </EditarUsuarioDialog>
  )
  await utils.usuario.click(screen.getByRole("button", { name: "Editar" }))
  return utils.usuario
}

describe("EditarUsuarioDialog (HU-06)", () => {
  it("cambia el rol de otro usuario", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos = capturarPatches()
    const usuario = await abrir(agronomo)

    await usuario.click(screen.getByRole("combobox", { name: /rol/i }))
    await usuario.click(await screen.findByRole("option", { name: "Capataz" }))
    await usuario.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0].rolId).toBe(IDS.rolCapataz)
  })

  it("no deja cambiarse el rol a uno mismo", async () => {
    iniciarSesionComo("Propietario")
    // El backend responde 403; adelantarlo evita que el usuario descubra la
    // regla recién después de guardar.
    await abrir(propietaria)

    expect(screen.getByRole("combobox", { name: /rol/i })).toBeDisabled()
    expect(screen.getByText(/No podés cambiar tu propio rol/i)).toBeInTheDocument()
  })

  it("reactiva a un usuario dado de baja", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos = capturarPatches()
    const usuario = await abrir(inactivo)

    await usuario.click(screen.getByRole("combobox", { name: /^estado$/i }))
    await usuario.click(await screen.findByRole("option", { name: "Activo" }))
    await usuario.click(screen.getByRole("button", { name: /guardar cambios/i }))

    // Es el único camino de vuelta: `:id/desactivar` solo va en una dirección.
    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0].activo).toBe(true)
  })

  it("precarga los datos actuales", async () => {
    iniciarSesionComo("Propietario")
    await abrir(agronomo)

    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue("Bruno Agronomo")
    expect(screen.getByLabelText(/^email$/i)).toHaveValue("bruno.agronomo@terravid.demo")
  })
})
