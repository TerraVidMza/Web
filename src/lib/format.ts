/**
 * Formateo de números, dinero y fechas.
 *
 * Dos cambios respecto de la versión anterior:
 *
 * 1. **Aceptan `null` y `undefined` y devuelven `—`.** `Intl.NumberFormat`
 *    formatea `undefined` como `"NaN"` sin lanzar ningún error, que es cómo el
 *    dashboard del Auditor terminaba mostrando seis tarjetas que decían NaN.
 *    Ahora un dato ausente se ve como un dato ausente.
 * 2. **La moneda, las unidades y la zona horaria son parámetros**, no
 *    constantes. El backend las expone por empresa en `GET /configuracion`
 *    (D-e); fijarlas en código obligaba a tocar cada pantalla que formatea plata
 *    el día que una empresa use otra.
 */

export interface PreferenciasFormato {
  locale: string
  moneda: string
  /** `metrico` o `imperial`, tal como lo guarda la clave `unidades`. */
  unidades: string
  zonaHoraria: string
}

export const PREFERENCIAS_POR_DEFECTO: PreferenciasFormato = {
  locale: "es-AR",
  moneda: "ARS",
  unidades: "metrico",
  zonaHoraria: "America/Argentina/Mendoza",
}

export const SIN_DATO = "—"

type Numerico = number | null | undefined

function esNumero(valor: Numerico): valor is number {
  return typeof valor === "number" && Number.isFinite(valor)
}

export function formatearNumero(
  valor: Numerico,
  prefs: PreferenciasFormato = PREFERENCIAS_POR_DEFECTO,
  opciones?: Intl.NumberFormatOptions
): string {
  if (!esNumero(valor)) return SIN_DATO
  return new Intl.NumberFormat(prefs.locale, opciones).format(valor)
}

export function formatearMoneda(
  valor: Numerico,
  prefs: PreferenciasFormato = PREFERENCIAS_POR_DEFECTO
): string {
  if (!esNumero(valor)) return SIN_DATO
  return new Intl.NumberFormat(prefs.locale, {
    style: "currency",
    currency: prefs.moneda,
    maximumFractionDigits: 0,
  }).format(valor)
}

export function formatearKg(
  valor: Numerico,
  prefs: PreferenciasFormato = PREFERENCIAS_POR_DEFECTO
): string {
  if (!esNumero(valor)) return SIN_DATO
  const unidad = prefs.unidades === "imperial" ? "lb" : "kg"
  const convertido = prefs.unidades === "imperial" ? valor * 2.20462 : valor
  return `${formatearNumero(convertido, prefs, { maximumFractionDigits: 0 })} ${unidad}`
}

export function formatearHectareas(
  valor: Numerico,
  prefs: PreferenciasFormato = PREFERENCIAS_POR_DEFECTO
): string {
  if (!esNumero(valor)) return SIN_DATO
  return `${formatearNumero(valor, prefs, { maximumFractionDigits: 2 })} ha`
}

/** `YYYY-MM-DD` o ISO completo. Se muestra en la zona horaria de la empresa. */
export function formatearFecha(
  valor: string | Date | null | undefined,
  prefs: PreferenciasFormato = PREFERENCIAS_POR_DEFECTO
): string {
  if (!valor) return SIN_DATO
  // Una fecha sin hora (`date` de Postgres) interpretada como ISO se ancla a
  // UTC-00:00, y en Argentina eso la corre un día para atrás al mostrarla.
  const soloFecha = typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
  const fecha = soloFecha ? new Date(`${valor}T12:00:00`) : new Date(valor)
  if (Number.isNaN(fecha.getTime())) return SIN_DATO
  return new Intl.DateTimeFormat(prefs.locale, {
    dateStyle: "medium",
    ...(soloFecha ? {} : { timeZone: prefs.zonaHoraria }),
  }).format(fecha)
}

export function formatearFechaHora(
  valor: string | Date | null | undefined,
  prefs: PreferenciasFormato = PREFERENCIAS_POR_DEFECTO
): string {
  if (!valor) return SIN_DATO
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return SIN_DATO
  return new Intl.DateTimeFormat(prefs.locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: prefs.zonaHoraria,
  }).format(fecha)
}
