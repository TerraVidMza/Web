import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "./App"
import { iniciarSesionComo } from "@/test/utils"

/**
 * Smoke test del árbol completo, con los proveedores **reales**: ErrorBoundary,
 * ThemeProvider, QueryClient, BrowserRouter, AuthProvider y
 * ConfiguracionProvider, más la validación del entorno que corre al importar.
 *
 * Los demás tests montan cada pantalla con un envoltorio propio; este es el
 * único que verifica que el ensamblado de `App.tsx` arranca.
 */
describe("App", () => {
  it("arranca sin sesión y muestra el login", async () => {
    render(<App />)
    expect(await screen.findByRole("heading", { name: "TerraVid" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it("con sesión guardada entra directo al dashboard", async () => {
    iniciarSesionComo("Propietario")
    render(<App />)
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument()
  })
})
