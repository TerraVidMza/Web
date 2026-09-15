import { describe, expect, it, vi } from "vitest"
import { ManualPage } from "./manual-page"
import { SoportePage } from "./soporte-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

describe("ManualPage (HU-36)", () => {
  it("lista manual y FAQ para cualquier rol", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<ManualPage />)

    expect(await screen.findByText(/Cómo dar de alta una finca/i)).toBeInTheDocument()
    expect(screen.getByText(/¿Por qué no puedo aprobar un remito\?/i)).toBeInTheDocument()
  })

  it("despliega el contenido de un artículo", async () => {
    iniciarSesionComo("Capataz")
    const { usuario } = renderConProveedores(<ManualPage />)

    const disparador = await screen.findByRole("button", {
      name: /Cómo dar de alta una finca/i,
    })
    expect(disparador).toHaveAttribute("aria-expanded", "false")

    await usuario.click(disparador)
    expect(await screen.findByText(/usá el botón «Nueva finca»/i)).toBeInTheDocument()
  })

  it("manda el filtro de módulo al backend, que ahora lo valida", async () => {
    iniciarSesionComo("Capataz")
    const urls: URL[] = []
    servidor.events.on("request:start", ({ request }) => {
      const url = new URL(request.url)
      if (url.pathname.endsWith("/ayuda/articulos")) urls.push(url)
    })

    const { usuario } = renderConProveedores(<ManualPage />)
    await screen.findByText(/Cómo dar de alta una finca/i)

    await usuario.click(screen.getByRole("combobox", { name: /módulo/i }))
    await usuario.click(await screen.findByRole("option", { name: "Vendimia" }))

    // Antes llegaba crudo: `?modulo=vendmia` daba 200 con lista vacía y el
    // usuario veía un centro de ayuda sin artículos, sin saber por qué.
    await waitFor(() => expect(urls.at(-1)?.searchParams.get("modulo")).toBe("vendimia"))
  })

  it("la búsqueda por texto filtra en el cliente", async () => {
    iniciarSesionComo("Capataz")
    const { usuario } = renderConProveedores(<ManualPage />)
    await screen.findByText(/Cómo dar de alta una finca/i)

    await usuario.type(screen.getByLabelText(/buscar/i), "remito")

    expect(screen.queryByText(/Cómo dar de alta una finca/i)).not.toBeInTheDocument()
    expect(screen.getByText(/¿Por qué no puedo aprobar un remito\?/i)).toBeInTheDocument()
  })
})

describe("SoportePage (HU-36)", () => {
  it("exige una descripción de al menos 10 caracteres", async () => {
    iniciarSesionComo("Capataz")
    const enviadas = vi.fn<() => void>()
    servidor.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/tickets")) enviadas()
    })

    const { usuario } = renderConProveedores(<SoportePage />)
    await usuario.type(screen.getByLabelText(/qué pasó/i), "no anda")
    await usuario.click(screen.getByRole("button", { name: /enviar pedido/i }))

    expect(await screen.findByText(/al menos 10 caracteres/i)).toBeInTheDocument()
    expect(enviadas).not.toHaveBeenCalled()
  })

  it("envía el pedido con su módulo", async () => {
    iniciarSesionComo("Capataz")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/tickets")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<SoportePage />)
    await usuario.type(
      screen.getByLabelText(/qué pasó/i),
      "El listado de cuarteles no muestra la variedad."
    )
    await usuario.click(screen.getByRole("button", { name: /enviar pedido/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0].modulo).toBe("fincas")
  })

  it("el Capataz no ve los pedidos de la empresa", async () => {
    // `GET /ayuda/tickets` es `@Roles(PROPIETARIO)`.
    iniciarSesionComo("Capataz")
    renderConProveedores(<SoportePage />)

    expect(await screen.findByRole("button", { name: /enviar pedido/i })).toBeInTheDocument()
    expect(screen.queryByText(/Pedidos de tu empresa/i)).not.toBeInTheDocument()
  })

  it("al Propietario le avisa cuando el correo del pedido no salió", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<SoportePage />)

    // El ticket quedó registrado, pero nadie del otro lado se enteró todavía.
    expect(await screen.findByText(/El aviso por correo no salió/i)).toBeInTheDocument()
    expect(screen.getByText(/El sensor SEN-02 no reporta/i)).toBeInTheDocument()
  })
})
