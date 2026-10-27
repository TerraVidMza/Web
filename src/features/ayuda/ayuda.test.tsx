import { describe, expect, it, vi } from "vitest"
import { ManualPage } from "./manual-page"
import { SoportePage } from "./soporte-page"
import { AyudaLayout } from "./ayuda-layout"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

describe("ManualPage (HU-36, W-034)", () => {
  it("muestra el manual del rol de la sesión, no el de otro", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<ManualPage />)

    expect(await screen.findByRole("heading", { name: "Manual del Capataz" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "App móvil: Registrar una labor" })
    ).toBeInTheDocument()
    // Usuarios es del Propietario: al Capataz no le sirve.
    expect(screen.queryByRole("heading", { name: "Usuarios" })).not.toBeInTheDocument()
  })

  it("el Propietario ve sus secciones de administración", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<ManualPage />)

    expect(await screen.findByRole("heading", { name: "Manual del Propietario" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Usuarios" })).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: /índice del manual/i })).toBeInTheDocument()
  })

  it("el Administrador de plataforma tiene su manual", async () => {
    iniciarSesionComo("Administrador")
    renderConProveedores(<ManualPage />)

    expect(
      await screen.findByRole("heading", { name: "Manual del Administrador de plataforma" })
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Empresas" })).toBeInTheDocument()
  })

  it("la búsqueda deja solo las secciones que mencionan la palabra, sin importar tildes", async () => {
    iniciarSesionComo("Auditor")
    const { usuario } = renderConProveedores(<ManualPage />)
    await screen.findByRole("heading", { name: "Manual del Auditor" })

    await usuario.type(screen.getByLabelText(/buscar en el manual/i), "auditoria")

    expect(screen.getByRole("heading", { name: "Log de auditoría" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Mi perfil" })).not.toBeInTheDocument()
  })

  it("avisa cuando ninguna sección coincide", async () => {
    iniciarSesionComo("Auditor")
    const { usuario } = renderConProveedores(<ManualPage />)
    await screen.findByRole("heading", { name: "Manual del Auditor" })

    await usuario.type(screen.getByLabelText(/buscar en el manual/i), "zzzz")

    expect(screen.getByText(/Ninguna sección menciona eso/i)).toBeInTheDocument()
  })

  it("agrega al final las preguntas frecuentes cargadas por la empresa", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<ManualPage />)

    expect(await screen.findByText(/¿Por qué no puedo aprobar un remito\?/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Más preguntas frecuentes" })).toBeInTheDocument()
  })
})

describe("AyudaLayout", () => {
  it("al Administrador le muestra el manual pero no «Pedir ayuda»: no tiene empresa", () => {
    iniciarSesionComo("Administrador")
    renderConProveedores(<AyudaLayout />)

    expect(screen.getByRole("link", { name: "Manual de usuario" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Pedir ayuda" })).not.toBeInTheDocument()
  })

  it("a un rol de empresa le muestra las dos pestañas", () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AyudaLayout />)

    expect(screen.getByRole("link", { name: "Pedir ayuda" })).toBeInTheDocument()
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
