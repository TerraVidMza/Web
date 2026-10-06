import { describe, expect, it } from "vitest"
import { HttpResponse, http } from "msw"
import { useFormato } from "./configuracion-context"
import { iniciarSesionComo, renderConProveedores, screen } from "@/test/utils"
import { servidor } from "@/test/setup"
import { EMPRESA_ID } from "@/test/fixtures"

function Moneda() {
  const { moneda, nombreOrganizacion } = useFormato()
  return (
    <p>
      {moneda} · {nombreOrganizacion ?? "sin nombre"}
    </p>
  )
}

describe("ConfiguracionProvider (W-004)", () => {
  it("un Capataz recibe el formato de su empresa, no los valores por defecto", async () => {
    iniciarSesionComo("Capataz")
    servidor.use(
      http.get("http://localhost:3000/api/configuracion/preferencias", () =>
        HttpResponse.json([
          {
            empresaId: EMPRESA_ID,
            clave: "moneda",
            valor: "USD",
            updatedById: null,
            updatedAt: "2026-01-10T12:00:00.000Z",
          },
          {
            empresaId: EMPRESA_ID,
            clave: "nombre_organizacion",
            valor: "Bodega Capataz",
            updatedById: null,
            updatedAt: "2026-01-10T12:00:00.000Z",
          },
        ])
      )
    )

    renderConProveedores(<Moneda />)

    expect(await screen.findByText("USD · Bodega Capataz")).toBeInTheDocument()
  })
})
