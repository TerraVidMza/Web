import { describe, expect, it } from "vitest"
import type { PoligonoGeoJson } from "@/api/schemas/geo"
import { datosGeograficos } from "./poligono-payload"

const contorno: PoligonoGeoJson = {
  type: "Polygon",
  coordinates: [
    [
      [-68.9, -33.0],
      [-68.89, -33.0],
      [-68.89, -33.01],
      [-68.9, -33.0],
    ],
  ],
}
const otro: PoligonoGeoJson = {
  type: "Polygon",
  coordinates: [
    [
      [-68.9, -33.0],
      [-68.88, -33.0],
      [-68.88, -33.02],
      [-68.9, -33.0],
    ],
  ],
}
const manual = { hectareas: 12, latitud: -33, longitud: -68.9 }

describe("datosGeograficos", () => {
  it("sin contorno antes ni ahora manda lo cargado a mano, como siempre", () => {
    expect(datosGeograficos(null, null, manual)).toEqual(manual)
    expect(datosGeograficos(undefined, null, manual)).toEqual(manual)
  })

  it("un contorno nuevo manda solo el polígono: hectáreas y punto los calcula el backend", () => {
    expect(datosGeograficos(null, contorno, manual)).toEqual({ poligono: contorno })
  })

  it("un contorno sin cambios no manda nada, para no chocar con la regla de valores derivados", () => {
    expect(datosGeograficos(contorno, contorno, manual)).toEqual({})
  })

  it("el ruido decimal no cuenta como un cambio", () => {
    const sucio: PoligonoGeoJson = {
      type: "Polygon",
      coordinates: [contorno.coordinates[0].map(([x, y]) => [x + 1e-12, y] as [number, number])],
    }

    expect(datosGeograficos(contorno, sucio, manual)).toEqual({})
  })

  it("un contorno modificado manda el nuevo, redondeado", () => {
    expect(datosGeograficos(contorno, otro, manual)).toEqual({ poligono: otro })
  })

  it("quitar el contorno manda null y devuelve el mando a lo cargado a mano", () => {
    expect(datosGeograficos(contorno, null, manual)).toEqual({ poligono: null, ...manual })
  })
})
