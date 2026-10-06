import { describe, expect, it } from "vitest"
import { EmpresasPage } from "./empresas-page"
import { AppRouter } from "@/routes/app-router"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"
import { servidor } from "@/test/setup"

function capturar(metodo: string, sufijo: RegExp) {
  const cuerpos: Array<{ url: string; cuerpo: unknown }> = []
  servidor.events.on("request:start", async ({ request }) => {
    if (request.method === metodo && sufijo.test(request.url)) {
      const texto = await request.clone().text()
      cuerpos.push({ url: request.url, cuerpo: texto ? JSON.parse(texto) : null })
    }
  })
  return cuerpos
}

/** Empresas (D-025 del backend): la pantalla del Administrador de plataforma. */
describe("EmpresasPage", () => {
  it("lista las empresas con su estado y usuarios activos", async () => {
    iniciarSesionComo("Administrador")
    renderConProveedores(<EmpresasPage />)

    const fila = (await screen.findByRole("cell", { name: "Bodega Los Andes" })).closest("tr")!
    expect(within(fila).getByText("Desactivada")).toBeInTheDocument()
    expect(within(fila).getByRole("button", { name: /activar/i })).toBeInTheDocument()
  })

  it("crea la empresa con su Propietario y sin contraseña", async () => {
    iniciarSesionComo("Administrador")
    const altas = capturar("POST", /\/empresas$/)
    const { usuario } = renderConProveedores(<EmpresasPage />)

    await usuario.click(await screen.findByRole("button", { name: /nueva empresa/i }))
    await usuario.type(screen.getByLabelText(/nombre de la empresa/i), "Bodega Nueva")
    await usuario.type(screen.getByLabelText(/^cuit$/i), "30-70000000-1")
    await usuario.type(screen.getByLabelText(/nombre del propietario/i), "Ana Dueña")
    await usuario.type(screen.getByLabelText(/email del propietario/i), "ana@bodega.com")
    await usuario.click(screen.getByRole("button", { name: /crear empresa/i }))

    await waitFor(() => expect(altas).toHaveLength(1))
    expect(altas[0].cuerpo).toEqual({
      nombre: "Bodega Nueva",
      cuit: "30-70000000-1",
      propietario: { nombre: "Ana Dueña", email: "ana@bodega.com" },
    })
  })

  it("valida el formato del CUIT antes de enviar", async () => {
    iniciarSesionComo("Administrador")
    const altas = capturar("POST", /\/empresas$/)
    const { usuario } = renderConProveedores(<EmpresasPage />)

    await usuario.click(await screen.findByRole("button", { name: /nueva empresa/i }))
    await usuario.type(screen.getByLabelText(/nombre de la empresa/i), "Bodega")
    await usuario.type(screen.getByLabelText(/^cuit$/i), "30700000001")
    await usuario.type(screen.getByLabelText(/nombre del propietario/i), "Ana")
    await usuario.type(screen.getByLabelText(/email del propietario/i), "ana@bodega.com")
    await usuario.click(screen.getByRole("button", { name: /crear empresa/i }))

    expect(await screen.findByText(/formato 30-12345678-9/i)).toBeInTheDocument()
    expect(altas).toHaveLength(0)
  })

  it("muestra el 409 del backend si el CUIT ya existe", async () => {
    iniciarSesionComo("Administrador")
    const { usuario } = renderConProveedores(<EmpresasPage />)

    await usuario.click(await screen.findByRole("button", { name: /nueva empresa/i }))
    await usuario.type(screen.getByLabelText(/nombre de la empresa/i), "Copia")
    await usuario.type(screen.getByLabelText(/^cuit$/i), "20-12345678-9")
    await usuario.type(screen.getByLabelText(/nombre del propietario/i), "Ana")
    await usuario.type(screen.getByLabelText(/email del propietario/i), "ana@bodega.com")
    await usuario.click(screen.getByRole("button", { name: /crear empresa/i }))

    expect(await screen.findByText(/ya existe una empresa con ese cuit/i)).toBeInTheDocument()
  })

  it("pide confirmación antes de desactivar", async () => {
    iniciarSesionComo("Administrador")
    const cambios = capturar("PATCH", /\/empresas\/.+\/(activar|desactivar)$/)
    const { usuario } = renderConProveedores(<EmpresasPage />)

    const fila = (await screen.findByRole("cell", { name: "Finca Demo TerraVid" })).closest("tr")!
    await usuario.click(within(fila).getByRole("button", { name: /desactivar/i }))
    expect(cambios).toHaveLength(0)

    const dialogo = await screen.findByRole("alertdialog")
    expect(within(dialogo).getByText(/4 usuarios activos/i)).toBeInTheDocument()
    await usuario.click(within(dialogo).getByRole("button", { name: /^desactivar$/i }))

    await waitFor(() => expect(cambios).toHaveLength(1))
    expect(cambios[0].url).toMatch(/\/desactivar$/)
  })
})

describe("Inicio del Administrador de plataforma", () => {
  it("entra a Empresas en vez del dashboard, que no tiene", async () => {
    iniciarSesionComo("Administrador")
    renderConProveedores(<AppRouter />, { ruta: "/" })

    expect(await screen.findByRole("heading", { name: "Empresas" })).toBeInTheDocument()
  })

  it("un Propietario no entra a Empresas", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<AppRouter />, { ruta: "/empresas" })

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  })
})
