import { describe, expect, it } from "vitest"
import {
  PREFERENCIAS_POR_DEFECTO,
  SIN_DATO,
  formatearFecha,
  formatearHectareas,
  formatearKg,
  formatearMoneda,
  formatearNumero,
} from "./format"

/**
 * Lo que rompía: `Intl.NumberFormat.format(undefined)` **no lanza**, devuelve
 * `"NaN"`. Por eso el dashboard del Auditor mostraba seis tarjetas en NaN en
 * lugar de fallar de una forma que se pudiera ver.
 */
describe("formateadores con datos ausentes", () => {
  it("no producen NaN", () => {
    for (const ausente of [undefined, null, Number.NaN]) {
      expect(formatearNumero(ausente)).toBe(SIN_DATO)
      expect(formatearMoneda(ausente)).toBe(SIN_DATO)
      expect(formatearKg(ausente)).toBe(SIN_DATO)
      expect(formatearHectareas(ausente)).toBe(SIN_DATO)
    }
    expect(formatearFecha(null)).toBe(SIN_DATO)
    expect(formatearFecha("no es una fecha")).toBe(SIN_DATO)
  })

  it("el cero sí es un dato y se muestra", () => {
    expect(formatearNumero(0)).toBe("0")
    expect(formatearKg(0)).toBe("0 kg")
  })
})

describe("preferencias de la empresa", () => {
  it("usa la moneda configurada, no una fija en código", () => {
    const enDolares = { ...PREFERENCIAS_POR_DEFECTO, moneda: "USD" }
    expect(formatearMoneda(1500, enDolares)).toContain("US$")
    expect(formatearMoneda(1500)).toContain("$")
  })

  it("convierte a libras cuando las unidades son imperiales", () => {
    const imperial = { ...PREFERENCIAS_POR_DEFECTO, unidades: "imperial" }
    expect(formatearKg(1000, imperial)).toBe("2.205 lb")
    expect(formatearKg(1000)).toBe("1.000 kg")
  })
})

describe("fechas", () => {
  it("no corre un día una fecha sin hora", () => {
    // `new Date("2026-02-01")` se ancla a UTC-00:00 y en Argentina (UTC-3) eso
    // la muestra como 31 de enero.
    expect(formatearFecha("2026-02-01")).toContain("2026")
    expect(formatearFecha("2026-02-01")).toContain("feb")
    expect(formatearFecha("2026-02-01")).toContain("1")
  })
})
