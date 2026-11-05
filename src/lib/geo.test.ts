import { describe, expect, it } from "vitest"
import type { PoligonoGeoJson } from "@/api/schemas/geo"
import {
  aPosicionesLeaflet,
  areaEnHectareas,
  limitesDe,
  poligonosIguales,
  redondearPoligono,
} from "./geo"

/** Rectángulo con la esquina noroeste en (lng, lat) y lados en grados. */
const rectangulo = (lng: number, lat: number, dLng: number, dLat: number): PoligonoGeoJson => ({
  type: "Polygon",
  coordinates: [
    [
      [lng, lat],
      [lng + dLng, lat],
      [lng + dLng, lat - dLat],
      [lng, lat - dLat],
      [lng, lat],
    ],
  ],
})

describe("areaEnHectareas", () => {
  it("coincide con lo que calcula PostGIS en el elipsoide (103,64 ha) con un error menor al 0,5 %", () => {
    // Mismo rectángulo que los tests de integración del backend: 0,01° x 0,01° a -33°.
    const ha = areaEnHectareas(rectangulo(-68.9, -33.0, 0.01, 0.01))

    expect(Math.abs(ha - 103.64) / 103.64).toBeLessThan(0.005)
  })

  it("es mayor cuanto más cerca del ecuador, a igual tamaño en grados", () => {
    const enElEcuador = areaEnHectareas(rectangulo(-68.9, 0.005, 0.01, 0.01))
    const enMendoza = areaEnHectareas(rectangulo(-68.9, -33.0, 0.01, 0.01))

    expect(enElEcuador).toBeGreaterThan(enMendoza)
  })

  it("no depende del sentido en que se dibuje (horario o antihorario)", () => {
    const horario = rectangulo(-68.9, -33.0, 0.01, 0.01)
    const antihorario: PoligonoGeoJson = {
      type: "Polygon",
      coordinates: [[...horario.coordinates[0]].reverse()],
    }

    expect(areaEnHectareas(antihorario)).toBeCloseTo(areaEnHectareas(horario), 6)
  })

  it("resta los huecos", () => {
    const contorno = rectangulo(-68.9, -33.0, 0.01, 0.01).coordinates[0]
    const hueco = rectangulo(-68.897, -33.003, 0.003, 0.003).coordinates[0]
    const conHueco: PoligonoGeoJson = { type: "Polygon", coordinates: [contorno, hueco] }

    expect(areaEnHectareas(conHueco)).toBeLessThan(areaEnHectareas(rectangulo(-68.9, -33.0, 0.01, 0.01)))
  })

  it("un polígono sin superficie mide cero, no un número negativo", () => {
    const plano: PoligonoGeoJson = {
      type: "Polygon",
      coordinates: [
        [
          [-68.9, -33.0],
          [-68.89, -33.0],
          [-68.88, -33.0],
          [-68.9, -33.0],
        ],
      ],
    }

    expect(areaEnHectareas(plano)).toBe(0)
  })
})

describe("aPosicionesLeaflet", () => {
  it("invierte [longitud, latitud] a [latitud, longitud]", () => {
    const [anillo] = aPosicionesLeaflet(rectangulo(-68.9, -33.0, 0.01, 0.01))

    expect(anillo[0]).toEqual([-33.0, -68.9])
    expect(anillo[1]).toEqual([-33.0, -68.89])
  })
})

describe("limitesDe", () => {
  it("devuelve la caja que contiene a todos los polígonos, en orden de Leaflet", () => {
    const limites = limitesDe([
      rectangulo(-68.9, -33.0, 0.01, 0.01),
      rectangulo(-68.7, -33.2, 0.05, 0.05),
    ])

    expect(limites).toEqual([
      [-33.25, -68.9],
      [-33.0, -68.65],
    ])
  })

  it("devuelve null si no hay polígonos que encuadrar", () => {
    expect(limitesDe([])).toBeNull()
  })
})

describe("redondearPoligono / poligonosIguales", () => {
  it("recorta el ruido decimal que deja el dibujo a ~1 cm", () => {
    const sucio: PoligonoGeoJson = {
      type: "Polygon",
      coordinates: [
        [
          [-68.90000000000123, -33.00000000000456],
          [-68.89, -33.0],
          [-68.89, -33.01],
          [-68.90000000000123, -33.00000000000456],
        ],
      ],
    }

    expect(redondearPoligono(sucio).coordinates[0][0]).toEqual([-68.9, -33.0])
  })

  it("dos polígonos que difieren solo en el ruido decimal son el mismo contorno", () => {
    const a = rectangulo(-68.9, -33.0, 0.01, 0.01)
    const b = rectangulo(-68.90000000000123, -33.00000000000456, 0.01, 0.01)

    expect(poligonosIguales(a, b)).toBe(true)
  })

  it("distingue un contorno que sí se movió", () => {
    expect(
      poligonosIguales(rectangulo(-68.9, -33.0, 0.01, 0.01), rectangulo(-68.9, -33.0, 0.011, 0.01))
    ).toBe(false)
  })

  it("dos ausencias son iguales; una ausencia y un polígono no", () => {
    expect(poligonosIguales(null, undefined)).toBe(true)
    expect(poligonosIguales(null, rectangulo(-68.9, -33.0, 0.01, 0.01))).toBe(false)
  })
})
