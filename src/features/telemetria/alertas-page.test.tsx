import { describe, expect, it } from "vitest"
import { AlertasPage } from "./alertas-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor } from "@/test/utils"
import { servidor } from "@/test/setup"

describe("AlertasPage (HU-22)", () => {
  it("muestra la alerta con el valor medido y el umbral superado", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<AlertasPage />)

    expect(await screen.findByText(/Superó el máximo/i)).toBeInTheDocument()
    expect(screen.getByText("34,6")).toBeInTheDocument()
    expect(screen.getByText("32")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "SEN-01" })).toBeInTheDocument()
  })

  it("marca una alerta como revisada", async () => {
    iniciarSesionComo("Propietario")
    const revisiones: string[] = []
    servidor.events.on("request:start", ({ request }) => {
      if (request.url.endsWith("/revisar")) revisiones.push(request.url)
    })

    const { usuario } = renderConProveedores(<AlertasPage />)
    await usuario.click(await screen.findByRole("button", { name: /Marcar como revisada/i }))

    await waitFor(() => expect(revisiones).toHaveLength(1))
  })

  it("aclara que revisar no cambia el umbral", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<AlertasPage />)

    // Si la causa sigue, la próxima lectura fuera de rango genera otra alerta.
    expect(await screen.findByText(/no cambia el umbral/i)).toBeInTheDocument()
  })

  it("le niega las alertas al Capataz", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<AlertasPage />)

    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })
})
