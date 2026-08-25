import { describe, expect, it } from "vitest"
import { UsuariosPage } from "./usuarios-page"
import { iniciarSesionComo, renderConProveedores, screen, waitFor, within } from "@/test/utils"

/**
 * B1: `GET /usuarios` devuelve `{ data, total, page, pageSize, totalPages }` y
 * el hook lo declaraba `Usuario[]`.
 *
 * `usuarios.length` daba `undefined`, la página no entraba en la rama de la
 * tabla y **caía en el estado vacío**: decía "No hay usuarios cargados todavía"
 * con doce usuarios en la base. Sin error en consola, sin toast, sin nada.
 *
 * Este test falla contra el código anterior, que es lo único que se le pide a
 * un test de regresión.
 */
describe("UsuariosPage", () => {
  it("muestra las filas del envelope paginado, no el estado vacío", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<UsuariosPage />)

    expect(await screen.findByText("Ana Propietaria")).toBeInTheDocument()
    expect(screen.getByText("Diego Auditor")).toBeInTheDocument()
    expect(screen.queryByText(/No hay usuarios cargados todavía/i)).not.toBeInTheDocument()
  })

  it("informa el total y la página a partir del envelope", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<UsuariosPage />)

    expect(await screen.findByText(/Mostrando 1–4 de 4 usuarios/i)).toBeInTheDocument()
    expect(screen.getByText("1 / 1")).toBeInTheDocument()
  })

  it("distingue el vacío por filtro del vacío real", async () => {
    iniciarSesionComo("Propietario")
    const { usuario } = renderConProveedores(<UsuariosPage />)

    await screen.findByText("Ana Propietaria")
    await usuario.type(
      screen.getByRole("searchbox", { name: /buscar por nombre o email/i }),
      "zzz"
    )

    // El mensaje nombra el filtro: sin esa distinción, el bug del envelope pasó
    // por un estado vacío perfectamente creíble.
    expect(
      await screen.findByText(/Ningún usuario coincide con los filtros/i)
    ).toBeInTheDocument()
  })

  it("traduce el rol del backend a su etiqueta en castellano", async () => {
    iniciarSesionComo("Propietario")
    renderConProveedores(<UsuariosPage />)

    const fila = (await screen.findByText("Bruno Agronomo")).closest("tr")!
    // El backend manda "Agronomo" sin tilde; la pantalla muestra "Agrónomo".
    expect(within(fila).getByText("Agrónomo")).toBeInTheDocument()
  })

  it("no dibuja la tabla si el backend deniega el acceso", async () => {
    iniciarSesionComo("Agronomo")
    renderConProveedores(<UsuariosPage />)

    await waitFor(() => {
      expect(screen.getByText(/No se pudieron cargar los datos/i)).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument()
  })
})
