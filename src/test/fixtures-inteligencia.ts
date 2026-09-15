/**
 * Fixtures de campañas e inteligencia agronómica (HU-29, 30, 31).
 *
 * En archivo aparte porque dependen del año en curso: las campañas tienen que
 * contener «hoy» para que la que corresponde se marque como actual, y eso no se
 * puede escribir con fechas fijas sin que el test caduque el 1 de enero.
 */
import { EMPRESA_ID, IDS } from "./fixtures"

const ANIO = new Date().getFullYear()

/** La primera contiene hoy y está abierta: es «la actual». */
export const CAMPANIAS = [
  {
    id: IDS.campaniaActual,
    empresaId: EMPRESA_ID,
    nombre: `${ANIO}/${ANIO + 1}`,
    fechaDesde: `${ANIO}-01-01`,
    fechaHasta: `${ANIO}-12-31`,
    cerrada: false,
    createdAt: "2026-01-05T12:00:00.000Z",
    updatedAt: null,
  },
  {
    id: IDS.campaniaAnterior,
    empresaId: EMPRESA_ID,
    nombre: `${ANIO - 1}/${ANIO}`,
    fechaDesde: `${ANIO - 1}-01-01`,
    fechaHasta: `${ANIO - 1}-12-31`,
    cerrada: true,
    createdAt: "2025-01-05T12:00:00.000Z",
    updatedAt: null,
  },
]

/**
 * Correlación con **datos insuficientes**: es el caso que importa, porque el
 * coeficiente viene igual y presentarlo como veredicto sería el error.
 */
export const CORRELACION = {
  sensor: { id: IDS.sensor, codigo: "SEN-01", tipo: "temperatura" },
  serieSensor: [
    { fecha: "2026-08-20", valor: 24.1 },
    { fecha: "2026-08-21", valor: 26.8 },
    { fecha: "2026-08-22", valor: 29.5 },
  ],
  serieCosto: [
    { fecha: "2026-08-20", valor: 120000 },
    { fecha: "2026-08-21", valor: 145000 },
    { fecha: "2026-08-22", valor: 180000 },
  ],
  diasConDatosEnComun: 3,
  diasRequeridos: 7,
  datosSuficientes: false,
  coeficienteCorrelacion: 0.98,
  interpretacion: "Correlación positiva muy fuerte",
  mensaje:
    "No hay suficientes datos para calcular la correlación. Se necesitan al menos 7 días con datos de sensores y costos registrados para el cuartel seleccionado.",
}

export const RECOMENDACIONES = [
  {
    id: IDS.recomendacion,
    cuartelId: IDS.cuartel,
    reglaId: "riego-humedad-baja",
    variable: "humedad_suelo",
    patronDetectado: "La humedad de suelo estuvo bajo el umbral 9 de los últimos 14 días.",
    accionSugerida: "Revisar el sistema de riego del sector antes de la próxima semana.",
    severidad: "alta",
    datos: { diasBajoUmbral: 9 },
    estado: "activa",
    nota: null,
    resueltaPorId: null,
    timestampEstado: null,
    createdAt: "2026-08-24T08:00:00.000Z",
  },
  {
    id: "b5444444-4444-4444-8444-444444444444",
    cuartelId: IDS.cuartel,
    reglaId: "alertas-recurrentes",
    variable: "temperatura",
    patronDetectado: "El sensor SEN-01 generó 5 alertas de umbral en 10 días.",
    accionSugerida: "Verificar la calibración del nodo o revisar el umbral configurado.",
    severidad: "media",
    datos: null,
    estado: "aplicada",
    nota: "Se recalibró el nodo el 20/08.",
    resueltaPorId: IDS.agronomo,
    timestampEstado: "2026-08-20T15:00:00.000Z",
    createdAt: "2026-08-18T08:00:00.000Z",
  },
]

/**
 * Comparación entre dos campañas.
 *
 * El segundo período **no tiene liquidaciones**, así que su margen es `null` y
 * la variación del margen también: no se puede comparar contra un desconocido.
 * Es el caso que distingue "no se sabe" de "cero".
 */
export const COMPARACION = {
  periodo1: {
    desde: `${ANIO - 1}-01-01`,
    hasta: `${ANIO - 1}-12-31`,
    campaniaId: IDS.campaniaAnterior,
    nombre: `${ANIO - 1}/${ANIO}`,
    kgCosechados: 12000,
    costoLabores: 900000,
    costoInsumos: 300000,
    costoCosecha: 400000,
    costoTotal: 1600000,
    costoPorHa: 266666.67,
    ingresos: 2400000,
    liquidaciones: 3,
    margenBruto: 800000,
    margenBrutoPorHa: 133333.33,
    margenBrutoDisponible: true,
    promediosIot: {
      temperatura: { valor: 22.4, agregacion: "promedio", lecturas: 8600 },
      pluviometro: { valor: 210.5, agregacion: "total", lecturas: 8600 },
    },
    tieneDatos: true,
  },
  periodo2: {
    desde: `${ANIO}-01-01`,
    hasta: `${ANIO}-12-31`,
    campaniaId: IDS.campaniaActual,
    nombre: `${ANIO}/${ANIO + 1}`,
    kgCosechados: 13800,
    costoLabores: 1150000,
    costoInsumos: 330000,
    costoCosecha: 480000,
    costoTotal: 1960000,
    costoPorHa: 326666.67,
    ingresos: 0,
    liquidaciones: 0,
    margenBruto: null,
    margenBrutoPorHa: null,
    margenBrutoDisponible: false,
    promediosIot: {
      temperatura: { valor: 24.9, agregacion: "promedio", lecturas: 7400 },
      pluviometro: { valor: 154.2, agregacion: "total", lecturas: 7400 },
    },
    tieneDatos: true,
  },
  variaciones: {
    kgCosechados: 15,
    costoLabores: 27.78,
    costoInsumos: 10,
    costoTotal: 22.5,
    costoPorHa: 22.5,
    ingresos: null,
    margenBruto: null,
  },
  sentidoIndicadores: {
    kgCosechados: "mayor_es_mejor",
    costoLabores: "menor_es_mejor",
    costoInsumos: "menor_es_mejor",
    costoTotal: "menor_es_mejor",
    costoPorHa: "menor_es_mejor",
    ingresos: "mayor_es_mejor",
    margenBruto: "mayor_es_mejor",
  },
  mensaje: null,
}
