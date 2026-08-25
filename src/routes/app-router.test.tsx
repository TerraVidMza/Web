import { describe, expect, it } from "vitest"
import { AppRouter } from "./app-router"
import { iniciarSesionComo, renderConProveedores, screen } from "@/test/utils"

/**
 * El árbol de rutas real, con la carga diferida incluida.
 *
 * Los tests de pantalla verifican cada página por separado; este verifica lo que
 * las une: que las guardas de rol usen la misma tabla que el menú y que el
 * desvío por contraseña temporal no se pueda esquivar entrando por URL.
 */
describe("AppRouter", () => {
  it("sin sesión, cualquier ruta protegida lleva al login", async () => {
    renderConProveedores(<AppRouter />, { ruta: "/fincas" })

    expect(await screen.findByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it("desvía a cambiar la contraseña incluso entrando por URL directa", async () => {
    iniciarSesionComo("Propietario", { debeCambiarPassword: true })
    renderConProveedores(<AppRouter />, { ruta: "/fincas" })

    // El guard vive en `ProtectedRoute` y no en el menú justamente por esto.
    expect(await screen.findByText(/Tu contraseña es temporal/i)).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /Fincas y Cuarteles/i })).not.toBeInTheDocument()
  })

  it("el Auditor que entra a /fincas por URL termina en el dashboard, no en un 403", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AppRouter />, { ruta: "/fincas" })

    // `RoleRoute` lo redirige antes de que se dispare la request que el backend
    // rechazaría.
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  })

  it("el Auditor sí llega a su pantalla", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AppRouter />, { ruta: "/auditoria" })

    expect(await screen.findByRole("heading", { name: /Log de auditoría/i })).toBeInTheDocument()
  })

  it("el Agrónomo no entra a /usuarios", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<AppRouter />, { ruta: "/usuarios" })

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  })

  it("el reset de contraseña es público y funciona sin sesión", async () => {
    renderConProveedores(<AppRouter />, { ruta: "/reset-password?token=abc123" })

    expect(await screen.findByRole("heading", { name: /Definí tu contraseña/i })).toBeInTheDocument()
  })

  it("avisa cuando el enlace de reset llega sin token", async () => {
    renderConProveedores(<AppRouter />, { ruta: "/reset-password" })

    expect(await screen.findByRole("heading", { name: /Enlace inválido/i })).toBeInTheDocument()
  })

  it("una ruta inexistente muestra el 404", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<AppRouter />, { ruta: "/no-existe" })

    expect(await screen.findByText("404")).toBeInTheDocument()
  })
})
