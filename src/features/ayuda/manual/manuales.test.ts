import { describe, expect, it } from "vitest"
import { cargarManual, parsearManual, slug, textoBuscable, urlDeImagen } from "./manuales"
import { rolNombreSchema } from "@/auth/roles"

describe("parsearManual (W-034)", () => {
  const manual = parsearManual(`---
titulo: Manual de prueba
version: 27/10/2026
---

## Ingreso al sistema

Texto.

### Iniciar sesión

\`\`\`
## esto no es un título
\`\`\`

## Fincas y cuarteles

![Fincas](propietario-fincas.jpg)
`)

  it("lee el encabezado y separa las secciones por ##", () => {
    expect(manual.titulo).toBe("Manual de prueba")
    expect(manual.version).toBe("27/10/2026")
    expect(manual.secciones.map((s) => s.id)).toEqual(["ingreso-al-sistema", "fincas-y-cuarteles"])
  })

  it("arma el índice con los ### y no confunde un ## dentro de un bloque de código", () => {
    expect(manual.secciones[0].subtitulos).toEqual([{ id: "iniciar-sesion", titulo: "Iniciar sesión" }])
    expect(manual.secciones[0].cuerpo).toContain("## esto no es un título")
  })

  it("busca sin tildes y sin la ruta de las imágenes", () => {
    expect(textoBuscable(manual.secciones[1])).toContain("fincas")
    expect(textoBuscable(manual.secciones[1])).not.toContain(".jpg")
    expect(slug("Telemetría IoT")).toBe("telemetria-iot")
  })
})

describe("Manuales empaquetados", () => {
  it.each(rolNombreSchema.options)("hay manual para %s y todas sus capturas existen", async (rol) => {
    const manual = await cargarManual(rol)
    expect(manual.secciones.length).toBeGreaterThan(3)
    const faltan = manual.secciones
      .flatMap((s) => [...s.cuerpo.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]))
      .filter((ruta) => !urlDeImagen(ruta))
    expect(faltan).toEqual([])
  })
})
