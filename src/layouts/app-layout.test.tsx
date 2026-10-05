import { describe, expect, it } from "vitest"
import { AppLayout } from "./app-layout"
import { iniciarSesionComo, renderConProveedores, screen, within } from "@/test/utils"

/**
 * B6/W3: el menú y las rutas salen de la misma tabla de permisos.
 *
 * Antes la lista de roles por pantalla estaba duplicada en `NAV_ITEMS` y en
 * `RoleRoute`, y ya divergía de los `@Roles` del backend: al Auditor se le
 * ofrecían *Fincas y Cuarteles*, *Operaciones*, *Telemetría IoT* y *Vendimia*,
 * y las cuatro le devolvían 403.
 */
describe("Menú por rol", () => {
  function menu() {
    return within(screen.getByRole("navigation", { name: /secciones/i }))
  }

  it("el Propietario ve todas las secciones", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<AppLayout />)

    for (const seccion of [
      "Dashboard",
      "Fincas",
      "Cuarteles",
      "Mapa",
      "Operaciones",
      "Telemetría IoT",
      "Vendimia",
      "Inteligencia",
      "Log de auditoría",
      "Usuarios",
      "Configuración",
      "Ayuda",
    ]) {
      expect(menu().getByRole("link", { name: seccion })).toBeInTheDocument()
    }
  })

  it("el Auditor solo ve lo que el backend le permite", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AppLayout />)

    expect(menu().getByRole("link", { name: "Log de auditoría" })).toBeInTheDocument()
    expect(menu().getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
    expect(menu().getByRole("link", { name: "Notificaciones" })).toBeInTheDocument()
    // Lectura de fincas y cuarteles (D-021 del backend), que la tabla vieja de
    // la Web le negaba.
    for (const lectura of ["Fincas", "Cuarteles", "Mapa"]) {
      expect(menu().getByRole("link", { name: lectura })).toBeInTheDocument()
    }

    // Las que el backend le rechaza:
    for (const prohibida of [
      "Operaciones",
      "Telemetría IoT",
      "Vendimia",
      "Inteligencia",
    ]) {
      expect(menu().queryByRole("link", { name: prohibida })).not.toBeInTheDocument()
    }
  })

  it("el Agrónomo no ve Usuarios ni Configuración, que son del Propietario", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<AppLayout />)

    expect(menu().getByRole("link", { name: "Fincas" })).toBeInTheDocument()
    expect(menu().getByRole("link", { name: "Cuarteles" })).toBeInTheDocument()
    expect(menu().queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument()
    expect(menu().queryByRole("link", { name: "Configuración" })).not.toBeInTheDocument()
    expect(menu().queryByRole("link", { name: "Log de auditoría" })).not.toBeInTheDocument()
  })

  it("el Capataz no ve el log de auditoría ni Operaciones", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<AppLayout />)

    expect(menu().getByRole("link", { name: "Vendimia" })).toBeInTheDocument()
    expect(menu().queryByRole("link", { name: "Log de auditoría" })).not.toBeInTheDocument()
    expect(menu().queryByRole("link", { name: "Operaciones" })).not.toBeInTheDocument()
  })

  it("tiene navegación en mobile: el menú también vive en un drawer", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<AppLayout />)

    // W7: abajo de 768 px el `<aside>` está oculto por CSS. Sin este botón la
    // aplicación no tenía forma de cambiar de sección en un teléfono.
    expect(screen.getByRole("button", { name: /abrir menú/i })).toBeInTheDocument()
  })

  it("ofrece un salto al contenido para navegación por teclado", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<AppLayout />)

    expect(screen.getByRole("link", { name: /saltar al contenido/i })).toHaveAttribute(
      "href",
      "#contenido"
    )
  })
})
