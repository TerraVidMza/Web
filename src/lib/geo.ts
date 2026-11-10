import type { PoligonoGeoJson } from "@/api/schemas/geo"

/**
 * Funciones geométricas puras para los polígonos de fincas y cuarteles (D-037).
 *
 * **El orden de las coordenadas es la trampa de todo este módulo.** GeoJSON (y
 * el backend) usan `[longitud, latitud]`; Leaflet usa `[latitud, longitud]`.
 * Convertir entre los dos solo se hace acá.
 */

/** Posición tal como la entiende Leaflet: `[latitud, longitud]`. */
export type PosicionLeaflet = [number, number]

/** Radio autálico de la Tierra: la esfera con la misma superficie que el elipsoide WGS 84. */
const RADIO_TIERRA_M = 6_371_007.2

const aRadianes = (grados: number) => (grados * Math.PI) / 180

/**
 * Superficie del polígono en hectáreas, calculada sobre la esfera.
 *
 * Es una **estimación para mostrar mientras se dibuja**: el número que vale es el
 * que calcula el backend con PostGIS sobre el elipsoide, y difiere en décimas de
 * por ciento. Por eso la pantalla la presenta como aproximada («≈»).
 *
 * Fórmula de Chamberlain y Duquette (exceso esférico); los huecos se restan.
 */
export function areaEnHectareas(poligono: PoligonoGeoJson): number {
  const [exterior, ...huecos] = poligono.coordinates
  const metros2 = areaDeAnillo(exterior) - huecos.reduce((s, h) => s + areaDeAnillo(h), 0)
  return Math.max(0, metros2) / 10_000
}

function areaDeAnillo(anillo: Array<[number, number]>): number {
  let suma = 0
  for (let i = 0; i < anillo.length - 1; i++) {
    const [lng1, lat1] = anillo[i]
    const [lng2, lat2] = anillo[i + 1]
    suma += aRadianes(lng2 - lng1) * (2 + Math.sin(aRadianes(lat1)) + Math.sin(aRadianes(lat2)))
  }
  return Math.abs((suma * RADIO_TIERRA_M ** 2) / 2)
}

/** `[longitud, latitud]` del GeoJSON → `[latitud, longitud]` de Leaflet, anillo por anillo. */
export function aPosicionesLeaflet(poligono: PoligonoGeoJson): PosicionLeaflet[][] {
  return poligono.coordinates.map((anillo) =>
    anillo.map(([lng, lat]): PosicionLeaflet => [lat, lng])
  )
}

/**
 * Caja que contiene todos los polígonos, para encuadrar el mapa. `null` si no
 * hay ninguno.
 */
export function limitesDe(
  poligonos: PoligonoGeoJson[]
): [PosicionLeaflet, PosicionLeaflet] | null {
  const vertices = poligonos.flatMap((p) => p.coordinates.flat())
  if (vertices.length === 0) return null
  const lngs = vertices.map(([lng]) => lng)
  const lats = vertices.map(([, lat]) => lat)
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

/**
 * Recorta los vértices a 7 decimales (~1 cm). Los dibuja Leaflet con 15 o más:
 * ruido que engorda el pedido y hace que dos polígonos idénticos se vean
 * distintos al compararlos.
 */
export function redondearPoligono(poligono: PoligonoGeoJson): PoligonoGeoJson {
  const r = (n: number) => Math.round(n * 1e7) / 1e7
  return {
    type: "Polygon",
    coordinates: poligono.coordinates.map((anillo) =>
      anillo.map(([lng, lat]): [number, number] => [r(lng), r(lat)])
    ),
  }
}

/** ¿Son el mismo contorno? Para saber si el usuario realmente lo cambió. */
export function poligonosIguales(
  a: PoligonoGeoJson | null | undefined,
  b: PoligonoGeoJson | null | undefined
): boolean {
  if (!a || !b) return !a && !b
  return JSON.stringify(redondearPoligono(a)) === JSON.stringify(redondearPoligono(b))
}
