import { describe, expect, it } from "vitest"
import { AuditoriaPage } from "./auditoria-page"
import { iniciarSesionComo, renderConProveedores, screen, within } from "@/test/utils"

/**
 * HU-07. El Auditor era un rol completo sin ninguna pantalla: entraba al
 * sistema y no podía hacer nada.
 */
describe("AuditoriaPage", () => {
  it("lista los eventos con su responsable, no solo el UUID", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AuditoriaPage />)

    expect(await screen.findByText("CREAR_FINCA")).toBeInTheDocument()
    expect(screen.getByText("Ana Propietaria")).toBeInTheDocument()
    expect(screen.getByText("190.16.44.2")).toBeInTheDocument()
  })

  it("muestra solo los campos que cambiaron, al desplegarlos", async () => {
    iniciarSesionComo("Auditor")
    const { usuario } = renderConProveedores(<AuditoriaPage />)

    const desplegar = await screen.findByRole("button", { name: /2 campos/i })
    expect(desplegar).toHaveAttribute("aria-expanded", "false")

    await usuario.click(desplegar)
    expect(desplegar).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("nombre:")).toBeInTheDocument()
    expect(screen.getByText("hectareas:")).toBeInTheDocument()
  })

  it("filtra por acción y ofrece limpiar cuando no hay resultados", async () => {
    iniciarSesionComo("Auditor")
    const { usuario } = renderConProveedores(<AuditoriaPage />)

    await screen.findByText("CREAR_FINCA")
    await usuario.click(screen.getByRole("combobox", { name: /acción/i }))
    await usuario.click(await screen.findByRole("option", { name: "Aprobar remito" }))

    expect(await screen.findByText(/Ningún evento coincide con los filtros/i)).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /limpiar filtros/i }).length).toBeGreaterThan(0)
  })

  it("le niega el listado a un rol sin permiso, como hace el backend", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<AuditoriaPage />)

    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })

  /**
   * El Auditor no puede listar cuarteles —`GET /cuarteles` es `@Roles(P, A, C)`—,
   * así que este enlace es su única vía de entrada al historial de operaciones
   * que HU-17 sí le concede. Es un hueco del backend, no una decisión de UX.
   */
  it("desde un evento sobre un cuartel se llega a su historial", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AuditoriaPage />)

    const enlace = await screen.findByRole("link", { name: /Cuartel/i })
    expect(enlace).toHaveAttribute("href", expect.stringContaining("/historial"))
  })

  it("la tabla tiene caption para lectores de pantalla", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AuditoriaPage />)

    const tabla = await screen.findByRole("table")
    expect(within(tabla).getByText(/Registro de auditoría/i)).toBeInTheDocument()
    // Todos los encabezados llevan scope="col".
    for (const th of within(tabla).getAllByRole("columnheader")) {
      expect(th).toHaveAttribute("scope", "col")
    }
  })
})
