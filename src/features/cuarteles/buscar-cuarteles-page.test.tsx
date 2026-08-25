import { describe, expect, it } from "vitest"
import { BuscarCuartelesPage } from "./buscar-cuarteles-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"
import { servidor } from "@/test/setup"

/** Query strings que efectivamente salieron a `/cuarteles/buscar`. */
function capturarBusquedas() {
  const urls: URL[] = []
  servidor.events.on("request:start", ({ request }) => {
    const url = new URL(request.url)
    if (url.pathname.endsWith("/cuarteles/buscar")) urls.push(url)
  })
  return urls
}

describe("BuscarCuartelesPage (HU-11)", () => {
  it("lista los cuarteles de toda la empresa con su finca", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<BuscarCuartelesPage />)

    const fila = (await screen.findByText("Cuartel 1")).closest("tr")!
    expect(within(fila).getByRole("link", { name: "Finca El Rosal" })).toBeInTheDocument()
    expect(within(fila).getByText("Malbec")).toBeInTheDocument()
    expect(await screen.findByText(/Mostrando 1–1 de 1 cuarteles/i)).toBeInTheDocument()
  })

  it("pide activo=false al filtrar por dados de baja", async () => {
    iniciarSesionComo("Propietario")
    const urls = capturarBusquedas()
    const { usuario } = renderConProveedores(<BuscarCuartelesPage />)

    await screen.findByText("Cuartel 1")
    await usuario.click(screen.getByRole("combobox", { name: /^estado$/i }))
    await usuario.click(await screen.findByRole("option", { name: /dados de baja/i }))

    // Hasta el fix del backend este parámetro devolvía lo contrario de lo
    // pedido, y desde el frontend eso se ve como un bug del frontend.
    await waitFor(() => {
      expect(urls.some((u) => u.searchParams.get("activo") === "false")).toBe(true)
    })
    expect(await screen.findByText(/Ningún cuartel coincide con los filtros/i)).toBeInTheDocument()
  })

  it("manda el campo y la dirección de orden que el backend acepta", async () => {
    iniciarSesionComo("Propietario")
    const urls = capturarBusquedas()
    const { usuario } = renderConProveedores(<BuscarCuartelesPage />)

    await screen.findByText("Cuartel 1")
    await usuario.click(screen.getByRole("button", { name: /^Hectáreas/i }))

    await waitFor(() => {
      const ultima = urls.at(-1)!
      expect(ultima.searchParams.get("ordenarPor")).toBe("hectareas")
      expect(ultima.searchParams.get("orden")).toBe("ASC")
    })

    // Un segundo clic sobre la misma columna invierte la dirección.
    await usuario.click(screen.getByRole("button", { name: /^Hectáreas/i }))
    await waitFor(() => {
      expect(urls.at(-1)!.searchParams.get("orden")).toBe("DESC")
    })
  })

  it("el filtro de variedad se habilita recién al elegir una finca", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<BuscarCuartelesPage />)

    await screen.findByText("Cuartel 1")
    // El endpoint de variedades exige `fincaId`, y ofrecer el catálogo completo
    // llevaría a elegir una variedad que esa finca no tiene.
    expect(screen.getByRole("combobox", { name: /variedad/i })).toBeDisabled()

    await usuario.click(screen.getByRole("combobox", { name: /finca/i }))
    await usuario.click(await screen.findByRole("option", { name: "Finca El Rosal" }))

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /variedad/i })).not.toBeDisabled()
    })
  })

  it("le niega la búsqueda al Auditor, como hace el backend", async () => {
    iniciarSesionComo("Auditor")
    renderConProveedores(<BuscarCuartelesPage />)

    expect(await screen.findByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
  })
})
