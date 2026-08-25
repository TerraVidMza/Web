import { describe, expect, it } from "vitest"
import { AppRouter } from "./app-router"
import { IDS } from "@/test/fixtures"
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
    expect(screen.queryByRole("heading", { name: /^Fincas$/i })).not.toBeInTheDocument()
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

  it("la búsqueda de cuarteles es una ruta propia bajo el permiso de fincas", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<AppRouter />, { ruta: "/cuarteles" })

    expect(await screen.findByRole("heading", { name: /Buscar cuarteles/i })).toBeInTheDocument()
  })

  it("el Auditor tampoco entra a la búsqueda de cuarteles", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AppRouter />, { ruta: "/cuarteles" })

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  })

  it("Operaciones abre en el costeo y tiene una ruta por vista", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<AppRouter />, { ruta: "/operaciones/insumos" })

    // Cada vista tiene URL propia para poder compartir el enlace del catálogo
    // sin explicar en qué pestaña hay que hacer clic.
    expect(await screen.findByRole("heading", { name: "Operaciones" })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: /nuevo insumo/i })).toBeInTheDocument()
  })

  it("el Capataz no entra a Operaciones, que es dato económico", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<AppRouter />, { ruta: "/operaciones" })

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  })

  it("el Auditor sí entra al historial de un cuartel, con su permiso propio", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AppRouter />, {
      ruta: `/cuarteles/${IDS.cuartel}/historial`,
    })

    // HU-17 le concede el historial aunque no pueda listar cuarteles.
    expect(
      await screen.findByRole("heading", { name: /Historial de operaciones/i })
    ).toBeInTheDocument()
  })

  it("Vendimia abre en remitos y cada vista tiene su ruta", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<AppRouter />, { ruta: "/vendimia/cuadrillas" })

    expect(await screen.findByRole("heading", { name: "Vendimia" })).toBeInTheDocument()
    expect(await screen.findByText(/Elegí una finca para ver sus cuadrillas/i)).toBeInTheDocument()
  })

  it("el detalle del remito vive fuera del layout de pestañas, para imprimirlo", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<AppRouter />, { ruta: `/remitos/${IDS.remitoBorrador}` })

    expect(await screen.findByRole("heading", { name: "REM-2026-00012" })).toBeInTheDocument()
    // Sin las pestañas de Vendimia alrededor.
    expect(screen.queryByRole("navigation", { name: /vistas de vendimia/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /imprimir/i })).toBeInTheDocument()
  })

  it("el Auditor no entra a Vendimia", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<AppRouter />, { ruta: "/vendimia" })

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  })

  it("Telemetría abre en sensores y tiene la bandeja de alertas aparte", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<AppRouter />, { ruta: "/telemetria/alertas" })

    expect(await screen.findByRole("heading", { name: /Telemetría IoT/i })).toBeInTheDocument()
    expect(await screen.findByText(/Superó el máximo/i)).toBeInTheDocument()
  })

  it("el Capataz no entra a Telemetría", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<AppRouter />, { ruta: "/telemetria" })

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  })

  it("Inteligencia abre en la comparación y campañas es una de sus vistas", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<AppRouter />, { ruta: "/inteligencia/campanias" })

    expect(
      await screen.findByRole("heading", { name: /Inteligencia agronómica/i })
    ).toBeInTheDocument()
    expect(await screen.findByRole("link", { name: "Comparar campañas" })).toBeInTheDocument()
  })

  it("el Capataz no entra a Inteligencia: cruza costos con telemetría", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<AppRouter />, { ruta: "/inteligencia" })

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  })

  it("una ruta inexistente muestra el 404", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<AppRouter />, { ruta: "/no-existe" })

    expect(await screen.findByText("404")).toBeInTheDocument()
  })
})
