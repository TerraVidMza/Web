import { describe, expect, it, vi } from "vitest"
import { RemitosPage } from "./remitos-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"
import { servidor } from "@/test/setup"

describe("RemitosPage (HU-26, HU-27)", () => {
  it("abre filtrado en borradores: es la bandeja de aprobación", async () => {
    iniciarSesionComo("Propietario")
    const urls: URL[] = []
    servidor.events.on("request:start", ({ request }) => {
      const url = new URL(request.url)
      if (url.pathname.endsWith("/remitos")) urls.push(url)
    })

    renderConProveedores(<RemitosPage />)

    expect(await screen.findByText("REM-2026-00012")).toBeInTheDocument()
    expect(urls[0].searchParams.get("estado")).toBe("borrador")
    // El aprobado no está: lo filtró el estado por defecto.
    expect(screen.queryByText("REM-2026-00011")).not.toBeInTheDocument()
  })

  it("aprueba un borrador tras confirmar", async () => {
    iniciarSesionComo("Propietario")
    const aprobaciones = vi.fn<() => void>()
    servidor.events.on("request:start", ({ request }) => {
      if (request.url.endsWith("/aprobar")) aprobaciones()
    })

    const { usuario } = renderConProveedores(<RemitosPage />)
    await screen.findByText("REM-2026-00012")

    await usuario.click(screen.getByRole("button", { name: /Aprobar REM-2026-00012/i }))
    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      /Los pesajes pasan a liquidados/i
    )
    await usuario.click(screen.getByRole("button", { name: "Aprobar" }))

    await waitFor(() => expect(aprobaciones).toHaveBeenCalledTimes(1))
  })

  /**
   * `@Length(10, 500)`: el motivo llega al Capataz como única explicación del
   * rechazo. Cortarlo en el cliente evita que se entere después de enviar.
   */
  it("exige un motivo de al menos 10 caracteres para rechazar", async () => {
    iniciarSesionComo("Propietario")
    const rechazos = vi.fn<() => void>()
    servidor.events.on("request:start", ({ request }) => {
      if (request.url.endsWith("/rechazar")) rechazos()
    })

    const { usuario } = renderConProveedores(<RemitosPage />)
    await screen.findByText("REM-2026-00012")

    await usuario.click(screen.getByRole("button", { name: /Rechazar REM-2026-00012/i }))
    await usuario.type(screen.getByLabelText(/motivo del rechazo/i), "corto")
    await usuario.click(screen.getByRole("button", { name: /rechazar remito/i }))

    expect(await screen.findByText(/al menos 10 caracteres/i)).toBeInTheDocument()
    expect(rechazos).not.toHaveBeenCalled()
  })

  it("manda el motivo cuando es suficientemente explícito", async () => {
    iniciarSesionComo("Propietario")
    const cuerpos: Record<string, unknown>[] = []
    servidor.events.on("request:start", async ({ request }) => {
      if (request.url.endsWith("/rechazar")) {
        cuerpos.push((await request.clone().json()) as Record<string, unknown>)
      }
    })

    const { usuario } = renderConProveedores(<RemitosPage />)
    await screen.findByText("REM-2026-00012")

    await usuario.click(screen.getByRole("button", { name: /Rechazar REM-2026-00012/i }))
    await usuario.type(
      screen.getByLabelText(/motivo del rechazo/i),
      "La balanza estaba descalibrada, hay que repesar el lote."
    )
    await usuario.click(screen.getByRole("button", { name: /rechazar remito/i }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0].motivoRechazo).toMatch(/balanza/)
  })

  it("el Capataz ve los remitos pero no puede aprobarlos ni rechazarlos", async () => {
    iniciarSesionComo("Capataz")
    renderConProveedores(<RemitosPage />)

    expect(await screen.findByText("REM-2026-00012")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Aprobar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Rechazar/i })).not.toBeInTheDocument()
    // Pero sí puede generar el borrador: `@Roles(P, A, C)`.
    expect(screen.getByRole("button", { name: /generar borrador/i })).toBeInTheDocument()
  })

  it("distingue el pago a la cuadrilla de los kilos despachados", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<RemitosPage />)

    const fila = (await screen.findByText("REM-2026-00012")).closest("tr")!
    expect(within(fila).getByText("2.000 kg")).toBeInTheDocument()
    // `totalLiquidacion` es lo que se le paga a la cuadrilla: un costo de
    // cosecha, no el ingreso. El ingreso es la liquidación de bodega.
    expect(within(fila).getByText("$ 160.000")).toBeInTheDocument()
  })

  it("le niega el listado al Auditor, como hace el backend", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<RemitosPage />)

    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })
})
