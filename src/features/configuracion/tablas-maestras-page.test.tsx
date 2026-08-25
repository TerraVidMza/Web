import { describe, expect, it } from "vitest"
import { TablasMaestrasPage } from "./tablas-maestras-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

describe("TablasMaestrasPage (HU-34)", () => {
  it("arranca en variedades y lista sus valores", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<TablasMaestrasPage />)

    expect(await screen.findByText("Malbec")).toBeInTheDocument()
  })

  it("cambia de catálogo y pide el tipo correcto", async () => {
    iniciarSesionComo("Propietario")
    const urls: URL[] = []
    servidor.events.on("request:start", ({ request }) => {
      const url = new URL(request.url)
      if (url.pathname.endsWith("/catalogos")) urls.push(url)
    })

    const { usuario } = renderConProveedores(<TablasMaestrasPage />)
    await screen.findByText("Malbec")

    await usuario.click(screen.getByRole("combobox", { name: /catálogo/i }))
    await usuario.click(await screen.findByRole("option", { name: /sistemas de conducción/i }))

    await waitFor(() => {
      expect(urls.at(-1)?.searchParams.get("tipo")).toBe("sistema_conduccion")
    })
    expect(await screen.findByText("Espaldero")).toBeInTheDocument()
  })

  it("aclara que el estado de plantación no es el de cosecha", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<TablasMaestrasPage />)
    await screen.findByText("Malbec")

    await usuario.click(screen.getByRole("combobox", { name: /catálogo/i }))
    await usuario.click(await screen.findByRole("option", { name: /estados de plantación/i }))

    // Son dimensiones independientes (D-013): el de cosecha lo escribe el
    // sistema a partir de los pesajes y no se edita desde acá.
    expect(
      await screen.findByText(/No es el estado de cosecha/i)
    ).toBeInTheDocument()
  })

  it("explica por qué no se puede eliminar un valor en uso", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<TablasMaestrasPage />)
    await screen.findByText("Malbec")

    await usuario.click(screen.getByRole("button", { name: /Acciones de Malbec/i }))
    await usuario.click(await screen.findByRole("menuitem", { name: /eliminar/i }))
    await usuario.click(screen.getByRole("button", { name: "Eliminar" }))

    const alerta = await screen.findByRole("alert")
    expect(alerta).toHaveTextContent(/en uso en 3 registro\(s\) de cuarteles/i)
    expect(alerta).toHaveTextContent(/Puedes desactivarlo/i)
  })

  it("agrega un valor al catálogo elegido", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/catalogos")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<TablasMaestrasPage />)
    await screen.findByText("Malbec")

    await usuario.click(screen.getByRole("button", { name: /agregar valor/i }))
    await usuario.type(screen.getByLabelText(/^nombre$/i), "Bonarda")
    await usuario.click(screen.getByRole("button", { name: /^agregar$/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).toEqual({ tipo: "variedad", nombre: "Bonarda" })
  })
})
