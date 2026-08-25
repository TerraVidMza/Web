import { describe, expect, it } from "vitest"
import { z } from "zod"
import { decimal, opcional, paginado } from "./comunes"
import { fincaSchema } from "./finca"
import { FINCAS } from "@/test/fixtures"

/**
 * B4: los decimales de PostgreSQL llegan como string.
 *
 * Que `*`, `/` y `-` funcionen sobre un string y `+` no es lo peor del asunto:
 * significa que el bug aparece en **una** de las cuatro operaciones, en una
 * pantalla, tarde.
 */
describe("decimal", () => {
  it("convierte el string del driver de Postgres a número", () => {
    expect(decimal.parse("25.50")).toBe(25.5)
    expect(decimal.parse("2000.00")).toBe(2000)
  })

  it("acepta también el número, porque el mismo concepto viene en los dos formatos", () => {
    // `GET /fincas` manda `hectareas: "25.50"` (sale de la entidad) y
    // `GET /registro-labor/costeo` manda `hectareas: 6` (lo castea el SQL).
    expect(decimal.parse(6)).toBe(6)
  })

  it("rechaza el string vacío en vez de convertirlo en cero", () => {
    // `Number("")` es `0`: sin este corte, un campo vacío se volvería un cero
    // perfectamente creíble.
    expect(decimal.safeParse("").success).toBe(false)
  })

  it("no convierte null en cero", () => {
    expect(opcional(decimal).parse(null)).toBeNull()
    expect(opcional(decimal).parse(undefined)).toBeNull()
    expect(opcional(decimal).parse("-33.75")).toBe(-33.75)
  })
})

describe("paginado", () => {
  const schema = paginado(z.object({ id: z.string() }))

  it("valida el envelope completo", () => {
    const resultado = schema.parse({
      data: [{ id: "a" }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })
    expect(resultado.data).toHaveLength(1)
    expect(resultado.total).toBe(1)
  })

  it("rechaza un array pelado, que es lo que el frontend declaraba", () => {
    expect(schema.safeParse([{ id: "a" }]).success).toBe(false)
  })
})

describe("fincaSchema contra la respuesta real", () => {
  it("suma hectáreas en vez de concatenarlas", () => {
    const fincas = z.array(fincaSchema).parse(FINCAS)
    const total = fincas.reduce((acumulado, f) => acumulado + f.hectareas, 0)

    // Sin la coerción esto daba "025.5018.00".
    expect(total).toBe(43.5)
    expect(typeof total).toBe("number")
  })

  it("falla con el nombre del campo cuando el contrato cambia", () => {
    const resultado = fincaSchema.safeParse({ ...FINCAS[0], hectareas: null })
    expect(resultado.success).toBe(false)
    expect(z.prettifyError(resultado.error!)).toContain("hectareas")
  })
})
