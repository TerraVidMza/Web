import type { PoligonoGeoJson } from "@/api/schemas/geo"
import { poligonosIguales, redondearPoligono } from "./geo"

interface DatosManuales {
  hectareas?: number
  latitud?: number
  longitud?: number
}

/**
 * Qué mandar al backend sobre la geografía de una finca o un cuartel (D-037).
 *
 * El backend deriva hectáreas y punto del polígono y **rechaza (400) que se
 * cambien a mano** mientras haya uno. Por eso no alcanza con mandar siempre todo
 * el formulario, como se hacía antes:
 *
 * - **Sin cambios en el contorno** (o sin contorno ni antes ni ahora): lo que
 *   haya a mano se manda como siempre, salvo que el contorno exista, que no se
 *   manda nada.
 * - **Contorno nuevo o modificado**: solo `poligono`, redondeado.
 * - **Contorno quitado**: `poligono: null` más lo cargado a mano, que vuelve a
 *   valer desde ese momento.
 */
export function datosGeograficos(
  original: PoligonoGeoJson | null | undefined,
  actual: PoligonoGeoJson | null,
  manual: DatosManuales
): DatosManuales & { poligono?: PoligonoGeoJson | null } {
  if (actual) {
    return poligonosIguales(original, actual) ? {} : { poligono: redondearPoligono(actual) }
  }
  return original ? { poligono: null, ...manual } : manual
}
