import { z } from "zod"

/**
 * Polígono GeoJSON (RFC 7946) tal como lo devuelve y lo acepta el backend
 * (`poligono` de fincas y cuarteles, D-037).
 *
 * **Los vértices son `[longitud, latitud]`**, en ese orden: el contrario de como
 * se suele escribir a mano y de como Leaflet pide las posiciones
 * (`[latitud, longitud]`). Mezclarlos no da un error, da un polígono en otro
 * lugar del planeta; por eso la conversión vive en un solo sitio (`lib/geo.ts`).
 *
 * El primer anillo es el contorno y los siguientes son huecos.
 */
export const poligonoSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()])).min(4)).min(1),
})

export type PoligonoGeoJson = z.infer<typeof poligonoSchema>

/**
 * Avisos del backend en un alta o edición que **sí se guardó** (por ejemplo, un
 * cuartel que se sale del contorno de su finca). Solo viene cuando hay alguno.
 */
export const advertenciasSchema = z.array(z.string()).optional()
