import { describe, expect, it } from "vitest"
import { AccionesFinca } from "./acciones-finca"
import { fincaSchema } from "@/api/schemas/finca"
import { FINCAS } from "@/test/fixtures"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"

/** `FINCAS[0]` tiene 3 cuarteles activos; `FINCAS[1]`, ninguno. */
const conCuarteles = fincaSchema.parse(FINCAS[0])
const sinCuarteles = fincaSchema.parse(FINCAS[1])

async function abrirBaja(finca: typeof conCuarteles) {
  const { usuario } = renderConProveedores(<AccionesFinca finca={finca} />)
  await usuario.click(screen.getByRole("button", { name: `Acciones de ${finca.nombre}` }))
  await usuario.click(await screen.findByRole("menuitem", { name: /dar de baja/i }))
  return usuario
}

describe("AccionesFinca", () => {
  it("da de baja una finca sin cuarteles activos", async () => {
    iniciarSesionComo("Propietario")
    const usuario = await abrirBaja(sinCuarteles)

    expect(
      await screen.findByRole("alertdialog", { name: /¿Dar de baja Finca La Consulta\?/i })
    ).toBeInTheDocument()

    await usuario.click(screen.getByRole("button", { name: "Dar de baja" }))

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    })
  })

  /**
   * El caso que justifica todo el diálogo: el backend responde 409 con un
   * mensaje que **dice qué hacer**. Mandarlo a un toast que se va solo
   * desperdicia la única indicación útil que recibe el usuario.
   */
  it("muestra el 409 dentro del diálogo y no lo cierra", async () => {
    iniciarSesionComo("Propietario")
    const usuario = await abrirBaja(conCuarteles)

    await usuario.click(screen.getByRole("button", { name: "Dar de baja" }))

    const alerta = await screen.findByRole("alert")
    expect(alerta).toHaveTextContent(/3 cuartel\(es\) activo\(s\)/i)
    expect(alerta).toHaveTextContent(/Dales de baja primero/i)
    // Sigue abierto: cerrarlo obligaría a volver a abrirlo para leer el motivo.
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  it("ofrece editar la finca desde el mismo menú", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<AccionesFinca finca={conCuarteles} />)

    await usuario.click(screen.getByRole("button", { name: /Acciones de Finca El Rosal/i }))
    await usuario.click(await screen.findByRole("menuitem", { name: /editar/i }))

    expect(await screen.findByRole("dialog", { name: /Editar Finca El Rosal/i })).toBeInTheDocument()
  })
})
