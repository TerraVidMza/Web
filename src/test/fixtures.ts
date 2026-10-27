/**
 * Respuestas **reales** de la API.
 *
 * No están inventadas: salen de llamar a la API corriendo contra PostgreSQL
 * —están transcriptas en `docs/PLAN-ADAPTACION-BACKEND.md` §1— y de leer las
 * entidades y los services del backend para los campos que ese relevamiento no
 * cubría.
 *
 * Que sean fieles es todo el valor del ejercicio: un handler que devuelve lo
 * que el frontend *espera* convierte los tests en una tautología. Estos
 * devuelven lo que el servidor *manda*, decimales como string incluidos.
 */

import type { RolNombre } from "@/auth/roles"
import { PERMISOS, type Permiso } from "@/auth/permisos"

export const EMPRESA_ID = "7126b3f0-2f4c-4a1e-9d0a-2c8f5b1e4a33"

export const IDS = {
  propietario: "11111111-1111-4111-8111-111111111111",
  agronomo: "22222222-2222-4222-8222-222222222222",
  capataz: "33333333-3333-4333-8333-333333333333",
  auditor: "44444444-4444-4444-8444-444444444444",
  rolPropietario: "a1111111-1111-4111-8111-111111111111",
  rolAgronomo: "a2222222-2222-4222-8222-222222222222",
  rolCapataz: "a3333333-3333-4333-8333-333333333333",
  rolAuditor: "a4444444-4444-4444-8444-444444444444",
  finca: "f1111111-1111-4111-8111-111111111111",
  fincaSecundaria: "f2222222-2222-4222-8222-222222222222",
  cuartel: "c1111111-1111-4111-8111-111111111111",
  variedad: "d1111111-1111-4111-8111-111111111111",
  sistema: "d2222222-2222-4222-8222-222222222222",
  insumo: "e1111111-1111-4111-8111-111111111111",
  tipoLabor: "e2222222-2222-4222-8222-222222222222",
  registroLabor: "e3333333-3333-4333-8333-333333333333",
  cuadrilla: "f3333333-3333-4333-8333-333333333333",
  remitoBorrador: "f4444444-4444-4444-8444-444444444444",
  remitoAprobado: "f5555555-5555-4555-8555-555555555555",
  pesaje: "f6666666-6666-4666-8666-666666666666",
  sensor: "a5111111-1111-4111-8111-111111111111",
  alerta: "a5222222-2222-4222-8222-222222222222",
  campaniaActual: "b5111111-1111-4111-8111-111111111111",
  campaniaAnterior: "b5222222-2222-4222-8222-222222222222",
  recomendacion: "b5333333-3333-4333-8333-333333333333",
} as const

/**
 * JWT con `exp` en el año 2099. No está firmado con nada real: el cliente solo
 * lee el `exp` para no arrancar con una sesión vencida, y la firma la verifica
 * el backend.
 */
export function tokenDePrueba(expEnSegundos = 4_102_444_800): string {
  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return [
    base64url({ alg: "HS256", typ: "JWT" }),
    base64url({ sub: IDS.propietario, exp: expEnSegundos }),
    "firma-de-prueba",
  ].join(".")
}

export const ROLES: Array<{ id: string; nombreRol: RolNombre }> = [
  { id: IDS.rolPropietario, nombreRol: "Propietario" },
  { id: IDS.rolAgronomo, nombreRol: "Agronomo" },
  { id: IDS.rolCapataz, nombreRol: "Capataz" },
  { id: IDS.rolAuditor, nombreRol: "Auditor" },
]

/**
 * Permisos por rol **tal como los manda el backend** (D-024,
 * `src/common/permisos/permisos.ts`). Vive solo en los tests porque MSW hace
 * de backend; la aplicación no tiene tabla propia.
 */
const P = "Propietario"
const A = "Agronomo"
const C = "Capataz"
const U = "Auditor"
const ADM = "Administrador"
const TABLA_DEL_BACKEND: Record<Permiso, RolNombre[]> = {
  dashboard: [P, A, C, U],
  perfil: [P, A, C, U, ADM],
  notificaciones: [P, A, C, U],
  catalogos: [P, A, C, U],
  campanias: [P, A, C, U],
  ayuda: [P, A, C, U],
  manual: [P, A, C, U, ADM],
  fincas: [P, A, C, U],
  fincasEscritura: [P],
  cuartelesEscritura: [P, A],
  cuartelesBaja: [P],
  usuarios: [P],
  roles: [P],
  logAuditoria: [P, U],
  catalogosEscritura: [P],
  configuracion: [P],
  campaniasEscritura: [P],
  ayudaAdministracion: [P],
  operaciones: [P, A],
  operacionesBaja: [P],
  operacionesLectura: [P, A, C],
  historialLabores: [P, A, C, U],
  laboresRegistro: [P, A, C],
  telemetria: [P, A],
  vendimia: [P, A, C],
  pesajesRegistro: [P, A, C],
  vendimiaAprobacion: [P, A],
  cuadrillas: [P, A, C],
  cuadrillasEdicion: [P, A],
  cuadrillasTarifas: [P],
  inteligencia: [P, A],
  appMovil: [P, A, C],
  empresas: [ADM],
}

export function permisosDelRol(rol: RolNombre): Permiso[] {
  return PERMISOS.filter((p) => TABLA_DEL_BACKEND[p].includes(rol))
}

export function usuarioSesion(rol: RolNombre, id = IDS.propietario) {
  return {
    id,
    email: `${rol.toLowerCase()}@terravid.demo`,
    rol,
    empresaId: EMPRESA_ID,
    debeCambiarPassword: false,
    permisos: permisosDelRol(rol),
  }
}

function usuarioCompleto(nombre: string, rolIndex: number, id: string) {
  const rol = ROLES[rolIndex]
  return {
    id,
    nombre,
    email: `${nombre.toLowerCase().replace(/ /g, ".")}@terravid.demo`,
    empresaId: EMPRESA_ID,
    activo: true,
    debeCambiarPassword: false,
    rolId: rol.id,
    rol,
    ultimoAcceso: "2026-08-20T13:02:11.221Z",
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-08-20T13:02:11.221Z",
  }
}

export const USUARIOS = [
  usuarioCompleto("Ana Propietaria", 0, IDS.propietario),
  usuarioCompleto("Bruno Agronomo", 1, IDS.agronomo),
  usuarioCompleto("Carla Capataz", 2, IDS.capataz),
  usuarioCompleto("Diego Auditor", 3, IDS.auditor),
]

/** El envelope de `common/dto/pagination-query.dto.ts`. */
export function paginar<T>(items: T[], page = 1, pageSize = 20) {
  return {
    data: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  }
}

/**
 * `hectareas`, `latitud` y `longitud` como **string**: el driver de PostgreSQL
 * devuelve `numeric`/`decimal` así a propósito. `cuartelesActivos` viene de un
 * `COUNT` casteado en el service, y por eso sí es número.
 */
export const FINCAS = [
  {
    id: IDS.finca,
    nombre: "Finca El Rosal",
    ubicacion: "Luján de Cuyo, Mendoza",
    hectareas: "25.50",
    activa: true,
    empresaId: EMPRESA_ID,
    createdById: IDS.propietario,
    latitud: null,
    longitud: null,
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: null,
    cuartelesActivos: 3,
  },
  {
    id: IDS.fincaSecundaria,
    nombre: "Finca La Consulta",
    ubicacion: null,
    hectareas: "18.00",
    activa: true,
    empresaId: EMPRESA_ID,
    createdById: IDS.propietario,
    latitud: "-33.7500000",
    longitud: "-69.1333330",
    createdAt: "2026-02-03T12:00:00.000Z",
    updatedAt: null,
    cuartelesActivos: 0,
  },
]

export const CATALOGOS = {
  variedad: [
    {
      id: IDS.variedad,
      empresaId: EMPRESA_ID,
      tipo: "variedad",
      nombre: "Malbec",
      activo: true,
      createdAt: "2026-01-10T12:00:00.000Z",
      updatedAt: null,
    },
  ],
  sistema_conduccion: [
    {
      id: IDS.sistema,
      empresaId: EMPRESA_ID,
      tipo: "sistema_conduccion",
      nombre: "Espaldero",
      activo: true,
      createdAt: "2026-01-10T12:00:00.000Z",
      updatedAt: null,
    },
  ],
}

export const CUARTELES = [
  {
    id: IDS.cuartel,
    fincaId: IDS.finca,
    variedadId: IDS.variedad,
    sistemaConduccionId: IDS.sistema,
    nombre: "Cuartel 1",
    clon: "R5",
    anioImplantacion: 2015,
    hectareas: "6.00",
    latitud: null,
    longitud: null,
    estado: "en_cosecha",
    activo: true,
    createdAt: "2026-02-05T12:00:00.000Z",
    updatedAt: null,
    variedad: CATALOGOS.variedad[0],
    sistemaConduccion: CATALOGOS.sistema_conduccion[0],
  },
]

const ESTADO_COSECHA_GLOBAL = {
  total: 3,
  porEstado: [
    { estado: "pendiente", cuarteles: 1, porcentaje: 33.3 },
    { estado: "en_cosecha", cuarteles: 1, porcentaje: 33.3 },
    { estado: "cosechado", cuarteles: 1, porcentaje: 33.3 },
  ],
}

const OPERATIVOS = {
  fincasActivas: 2,
  cuartelesActivos: 3,
  alertasIotPendientes: 1,
  remitosPendientesAprobacion: 2,
  kgCosechadosCampaniaActual: 12500,
  campaniaActual: {
    id: "e1111111-1111-4111-8111-111111111111",
    nombre: "2026",
    desde: "2026-02-01",
    hasta: "2026-06-30",
  },
  estadoCosechaGlobal: ESTADO_COSECHA_GLOBAL,
}

export const LOG_AUDITORIA = [
  {
    id: "b1111111-1111-4111-8111-111111111111",
    actorId: IDS.propietario,
    accion: "CREAR_FINCA",
    entidad: "finca",
    entidadId: IDS.finca,
    datosAnteriores: null,
    datosNuevos: { nombre: "Finca El Rosal", hectareas: 25.5 },
    ipAddress: "190.16.44.2",
    createdAt: "2026-08-24T15:30:00.000Z",
    actor: {
      id: IDS.propietario,
      nombre: "Ana Propietaria",
      email: "ana.propietaria@terravid.demo",
      rol: ROLES[0],
    },
  },
  // Un evento sobre un cuartel: es la unica via de entrada del Auditor al
  // historial de operaciones, porque no puede listar cuarteles. Un solo campo
  // cambiado, para no chocar con la asercion de "2 campos" del otro evento.
  {
    id: "b2222222-2222-4222-8222-222222222222",
    actorId: IDS.agronomo,
    accion: "ACTUALIZAR_CUARTEL",
    entidad: "cuartel",
    entidadId: IDS.cuartel,
    datosAnteriores: { nombre: "Cuartel 1" },
    datosNuevos: { nombre: "Cuartel 1 Norte" },
    ipAddress: null,
    createdAt: "2026-08-24T16:00:00.000Z",
    actor: {
      id: IDS.agronomo,
      nombre: "Bruno Agronomo",
      email: "bruno.agronomo@terravid.demo",
      rol: ROLES[1],
    },
  },
]

/**
 * **El dashboard es una unión por rol.** Ver §B3 del plan de adaptación: para
 * el Auditor la respuesta tiene dos claves y ninguna es la que leían las
 * tarjetas.
 */
export const DASHBOARD: Record<Exclude<RolNombre, "Administrador">, Record<string, unknown>> = {
  Propietario: {
    rol: "Propietario",
    ...OPERATIVOS,
    costoLaboresTotal: 4300000,
    costoInsumosTotal: 1200000,
    costosPorFinca: [
      { fincaId: IDS.finca, fincaNombre: "Finca El Rosal", costoTotal: 4300000 },
      { fincaId: IDS.fincaSecundaria, fincaNombre: "Finca La Consulta", costoTotal: 0 },
    ],
    alertasRecientes: [],
    registrosConError: 0,
  },
  Agronomo: {
    rol: "Agronomo",
    ...OPERATIVOS,
    costoLaboresTotal: 4300000,
    costoInsumosTotal: 1200000,
    costosPorFinca: [],
    alertasRecientes: [],
    registrosConError: 0,
  },
  Capataz: {
    rol: "Capataz",
    ...OPERATIVOS,
    registrosPendientesSync: 4,
    registrosConErrorSync: 1,
    cuartelesEnCosecha: [
      {
        cuartelId: IDS.cuartel,
        cuartelNombre: "Cuartel 1",
        fincaNombre: "Finca El Rosal",
        kgCosechados: 8200,
      },
    ],
  },
  Auditor: {
    rol: "Auditor",
    eventosRecientes: LOG_AUDITORIA,
  },
}

export const NOTIFICACIONES = [
  {
    id: "a9111111-1111-4111-8111-111111111111",
    usuarioId: IDS.propietario,
    tipo: "alerta_iot",
    titulo: "Temperatura fuera de umbral",
    descripcion: "El sensor SEN-01 superó el máximo configurado.",
    urlAccion: "/telemetria",
    leida: false,
    createdAt: "2026-08-25T09:00:00.000Z",
  },
  {
    id: "a9222222-2222-4222-8222-222222222222",
    usuarioId: IDS.propietario,
    tipo: "remito",
    titulo: "Remito pendiente de aprobación",
    descripcion: "REM-2026-00012 está esperando tu aprobación.",
    urlAccion: null,
    leida: true,
    createdAt: "2026-08-24T18:00:00.000Z",
  },
]

/** `smtp_pass` sale enmascarada del backend, nunca con su valor real. */
export const CONFIGURACION = [
  {
    empresaId: EMPRESA_ID,
    clave: "moneda",
    valor: "ARS",
    updatedById: IDS.propietario,
    updatedAt: "2026-01-10T12:00:00.000Z",
  },
  {
    empresaId: EMPRESA_ID,
    clave: "nombre_organizacion",
    valor: "Bodega Demo",
    updatedById: IDS.propietario,
    updatedAt: "2026-01-10T12:00:00.000Z",
  },
  {
    empresaId: EMPRESA_ID,
    clave: "smtp_host",
    valor: "smtp.terravid.demo",
    updatedById: IDS.propietario,
    updatedAt: "2026-01-10T12:00:00.000Z",
  },
  {
    // El backend enmascara este valor al leerlo: la pantalla nunca recibe la
    // contrasena real, y reenviar la mascara la guardaria literalmente.
    empresaId: EMPRESA_ID,
    clave: "smtp_pass",
    valor: "********",
    updatedById: IDS.propietario,
    updatedAt: "2026-01-10T12:00:00.000Z",
  },
]

// Ayuda (HU-36)

export const ARTICULOS = [
  {
    id: "c9111111-1111-4111-8111-111111111111",
    tipo: "manual",
    modulo: "fincas",
    titulo: "Cómo dar de alta una finca",
    contenido: "Entrá a Fincas y usá el botón «Nueva finca».",
    orden: 1,
    activo: true,
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: null,
  },
  {
    id: "c9222222-2222-4222-8222-222222222222",
    tipo: "faq",
    modulo: "vendimia",
    titulo: "¿Por qué no puedo aprobar un remito?",
    contenido: "Solo el Propietario y el Agrónomo aprueban remitos.",
    orden: 2,
    activo: true,
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: null,
  },
]

export const TICKETS = [
  {
    id: "c9333333-3333-4333-8333-333333333333",
    usuarioId: IDS.capataz,
    modulo: "telemetria",
    descripcion: "El sensor SEN-02 no reporta desde el martes.",
    appVersion: "1.4.0",
    estado: "abierto",
    // El aviso por correo no salio: el ticket existe pero nadie se entero.
    emailEnviado: false,
    createdAt: "2026-08-24T10:00:00.000Z",
    usuario: {
      id: IDS.capataz,
      nombre: "Carla Capataz",
      email: "carla.capataz@terravid.demo",
    },
  },
]


// ─── Operaciones (HU-15, 16, 17) ─────────────────────────────────────────────

export const INSUMOS_CATALOGO = [
  {
    id: IDS.insumo,
    empresaId: EMPRESA_ID,
    nombre: "Fertilizante NPK",
    descripcion: "Mezcla 15-15-15",
    unidadMedida: "kg",
    activo: true,
    createdAt: "2026-01-12T12:00:00.000Z",
    updatedAt: null,
  },
]

export const TIPOS_LABOR_CATALOGO = [
  {
    id: IDS.tipoLabor,
    empresaId: EMPRESA_ID,
    nombre: "Poda de invierno",
    descripcion: null,
    unidadMedida: "jornal",
    activo: true,
    createdAt: "2026-01-12T12:00:00.000Z",
    updatedAt: null,
  },
]

/**
 * `costoUnitario` es `decimal(12,2)`: llega como **string**.
 *
 * El tercero tiene vigencia en 2099 a propósito: el backend ordena el historial
 * por `validFrom` DESC, así que un costo futuro encabeza la lista **sin ser el
 * vigente**. Es el caso que la pantalla tiene que distinguir.
 */
export const COSTOS_INSUMO = [
  {
    id: "e9333333-3333-4333-8333-333333333333",
    insumoId: IDS.insumo,
    costoUnitario: "1800.00",
    validFrom: "2099-01-01",
    createdById: IDS.propietario,
    createdAt: "2026-08-01T12:00:00.000Z",
  },
  {
    id: "e9111111-1111-4111-8111-111111111111",
    insumoId: IDS.insumo,
    costoUnitario: "1500.00",
    validFrom: "2026-06-01",
    createdById: IDS.propietario,
    createdAt: "2026-06-01T12:00:00.000Z",
  },
  {
    id: "e9222222-2222-4222-8222-222222222222",
    insumoId: IDS.insumo,
    costoUnitario: "1200.00",
    validFrom: "2026-01-12",
    createdById: IDS.propietario,
    createdAt: "2026-01-12T12:00:00.000Z",
  },
]

/**
 * Costeo por cuartel. Acá los números **sí** son números: el service castea
 * cada agregado con `Number(...)`.
 *
 * El segundo cuartel es el caso interesante: sin superficie cargada
 * (`hectareas: null` -> `costoPorHa: null`) y sin liquidaciones
 * (`margenBrutoDisponible: false` -> `margenBruto: null`). Los dos `null` son
 * deliberados y no equivalen a cero.
 */
export const COSTEO = {
  cuarteles: [
    {
      cuartelId: IDS.cuartel,
      cuartelNombre: "Cuartel 1",
      fincaId: IDS.finca,
      fincaNombre: "Finca El Rosal",
      hectareas: 6,
      costoLabores: 900000,
      costoInsumos: 300000,
      costoTotal: 1200000,
      costoPorHa: 200000,
      ingresos: 2000000,
      liquidaciones: 2,
      margenBruto: 800000,
      margenBrutoDisponible: true,
      margenBrutoPorHa: 133333.33,
    },
    {
      cuartelId: "c2222222-2222-4222-8222-222222222222",
      cuartelNombre: "Cuartel 2",
      fincaId: IDS.finca,
      fincaNombre: "Finca El Rosal",
      hectareas: null,
      costoLabores: 150000,
      costoInsumos: 25000,
      costoTotal: 175000,
      costoPorHa: null,
      ingresos: 0,
      liquidaciones: 0,
      margenBruto: null,
      margenBrutoDisponible: false,
      margenBrutoPorHa: null,
    },
  ],
  totales: {
    costoLabores: 1050000,
    costoInsumos: 325000,
    costoTotal: 1375000,
    hectareas: 6,
    costoPorHa: 229166.67,
    ingresos: 2000000,
    margenBruto: 625000,
    margenBrutoDisponible: true,
  },
}

/** `cantidad` y `costoUnitarioAlSync` son decimales: llegan como string. */
export const REGISTROS_LABOR = [
  {
    id: IDS.registroLabor,
    localUuid: "ea111111-1111-4111-8111-111111111111",
    cuartelId: IDS.cuartel,
    tipoLaborId: IDS.tipoLabor,
    usuarioId: IDS.capataz,
    fecha: "2026-07-15",
    cantidad: "3.00",
    costoUnitarioAlSync: "45000.00",
    estadoSync: "sincronizado",
    errorMessage: null,
    inconsistenciaCatalogo: true,
    createdAtLocal: "2026-07-15T09:00:00.000Z",
    createdAt: "2026-07-15T21:00:00.000Z",
    syncedAt: "2026-07-15T21:00:00.000Z",
    tipoLabor: { id: IDS.tipoLabor, nombre: "Poda de invierno", unidadMedida: "jornal" },
    usuario: {
      id: IDS.capataz,
      nombre: "Carla Capataz",
      email: "carla.capataz@terravid.demo",
    },
    detalles: [
      {
        id: "eb111111-1111-4111-8111-111111111111",
        registroLaborId: IDS.registroLabor,
        insumoId: IDS.insumo,
        cantidadUsada: "20.0000",
        costoUnitarioAlSync: "1200.00",
        createdAt: "2026-07-15T21:00:00.000Z",
        insumo: { id: IDS.insumo, nombre: "Fertilizante NPK", unidadMedida: "kg" },
      },
    ],
  },
]


// ─── Vendimia (HU-23, 26, 27, 28) ────────────────────────────────────────────

export const CUADRILLAS = [
  {
    id: IDS.cuadrilla,
    fincaId: IDS.finca,
    nombre: "Cuadrilla Norte",
    cantidadIntegrantes: 8,
    activa: true,
    createdAt: "2026-02-10T12:00:00.000Z",
    updatedAt: null,
  },
]

/** `tarifaPorKg` es `decimal(10,4)`: string. La de 2099 no rige todavia. */
export const TARIFAS = [
  {
    id: "f9111111-1111-4111-8111-111111111111",
    cuadrillaId: IDS.cuadrilla,
    tarifaPorKg: "95.0000",
    validFrom: "2099-01-01",
    createdById: IDS.propietario,
    createdAt: "2026-08-01T12:00:00.000Z",
  },
  {
    id: "f9222222-2222-4222-8222-222222222222",
    cuadrillaId: IDS.cuadrilla,
    tarifaPorKg: "80.0000",
    validFrom: "2026-02-01",
    createdById: IDS.propietario,
    createdAt: "2026-02-01T12:00:00.000Z",
  },
]

const cuartelDeRemito = {
  id: IDS.cuartel,
  nombre: "Cuartel 1",
  fincaId: IDS.finca,
  finca: { id: IDS.finca, nombre: "Finca El Rosal" },
  variedad: { id: IDS.variedad, nombre: "Malbec" },
}

/** `totalKg` y `totalLiquidacion` son decimales: llegan como string. */
export const REMITOS = [
  {
    id: IDS.remitoBorrador,
    numeroRemito: "REM-2026-00012",
    cuartelId: IDS.cuartel,
    generadoPorId: IDS.capataz,
    aprobadoPorId: null,
    rechazadoPorId: null,
    estado: "borrador",
    totalKg: "2000.00",
    totalLiquidacion: "160000.00",
    motivoRechazo: null,
    fecha: "2026-03-05",
    fechaGeneracion: "2026-03-05T20:00:00.000Z",
    fechaAprobacion: null,
    fechaRechazo: null,
    cuartel: cuartelDeRemito,
  },
  {
    id: IDS.remitoAprobado,
    numeroRemito: "REM-2026-00011",
    cuartelId: IDS.cuartel,
    generadoPorId: IDS.capataz,
    aprobadoPorId: IDS.propietario,
    rechazadoPorId: null,
    estado: "aprobado",
    totalKg: "3500.00",
    totalLiquidacion: "280000.00",
    motivoRechazo: null,
    fecha: "2026-03-01",
    fechaGeneracion: "2026-03-01T20:00:00.000Z",
    fechaAprobacion: "2026-03-02T10:00:00.000Z",
    fechaRechazo: null,
    cuartel: cuartelDeRemito,
  },
]

export const PESAJES = [
  {
    id: IDS.pesaje,
    localUuid: "fa111111-1111-4111-8111-111111111111",
    cuadrillaId: IDS.cuadrilla,
    cuartelId: IDS.cuartel,
    registradoPorId: IDS.capataz,
    remitoId: IDS.remitoBorrador,
    fecha: "2026-03-05",
    kgTotales: "2000.00",
    tarifaUtilizada: "80.0000",
    montoLiquidacion: "160000.00",
    estadoSync: "sincronizado",
    errorMessage: null,
    estado: "en_remito",
    cuadrilla: { id: IDS.cuadrilla, nombre: "Cuadrilla Norte" },
  },
]

/**
 * Liquidacion de bodega: los kilos aceptados son **menos** que los despachados
 * —la bodega descuenta por materia extraña— y hay descuentos. Es el caso que
 * distingue el ingreso real del importe bruto.
 */
export const LIQUIDACION = {
  id: "fb111111-1111-4111-8111-111111111111",
  remitoId: IDS.remitoAprobado,
  bodega: "Bodega La Consulta",
  kgAceptados: "3400.00",
  precioPorKg: "260.0000",
  descuentos: "40000.00",
  montoNeto: "844000.00",
  fecha: "2026-03-20",
  numeroComprobante: "LIQ-8891",
  registradoPorId: IDS.propietario,
  createdAt: "2026-03-20T12:00:00.000Z",
}

/** Los numeros vienen casteados con `Number(...)` en el service. */
export const ESTADO_COSECHA = {
  cuarteles: [
    {
      cuartelId: IDS.cuartel,
      cuartelNombre: "Cuartel 1",
      estado: "en_cosecha",
      hectareas: 6,
      kgTotalesCosechados: 5500,
      kgLiquidados: 3500,
      kgPendientesDeRemito: 0,
      kgObservados: 2000,
      cantidadCuadrillas: 1,
      montoLiquidadoTotal: 440000,
      rendimientoKgPorHa: 916.67,
    },
    {
      cuartelId: "c2222222-2222-4222-8222-222222222222",
      cuartelNombre: "Cuartel 2",
      estado: "pendiente",
      hectareas: null,
      kgTotalesCosechados: 0,
      kgLiquidados: 0,
      kgPendientesDeRemito: 0,
      kgObservados: 0,
      cantidadCuadrillas: 0,
      montoLiquidadoTotal: 0,
      rendimientoKgPorHa: null,
    },
  ],
  totales: {
    kgTotalesCosechados: 5500,
    kgLiquidados: 3500,
    montoLiquidadoTotal: 440000,
    cuartelesCosechados: 0,
    cuartelesEnCosecha: 1,
    cuartelesPendientes: 1,
  },
}


// ─── Telemetria (HU-18, 20, 21, 22) ──────────────────────────────────────────

/** `valor` de la ultima lectura viene casteado con `Number(...)`. */
export const SENSORES = [
  {
    id: IDS.sensor,
    fincaId: IDS.finca,
    codigo: "SEN-01",
    tipo: "temperatura",
    descripcion: "Cabecera norte, a 1,5 m",
    activo: true,
    createdAt: "2026-01-20T12:00:00.000Z",
    ultimaLectura: {
      valor: 31.4,
      unidad: "C",
      sensorTimestamp: "2026-08-25T14:00:00.000Z",
    },
  },
  {
    id: "a5333333-3333-4333-8333-333333333333",
    fincaId: IDS.finca,
    codigo: "SEN-02",
    tipo: "humedad_suelo",
    descripcion: null,
    activo: true,
    createdAt: "2026-01-20T12:00:00.000Z",
    // Un nodo dado de alta que todavia no reporto: `null`, no cero.
    ultimaLectura: null,
  },
]

/** `umbralMinimo`/`umbralMaximo` son `decimal(10,4)`: llegan como string. */
export const UMBRAL = {
  id: "a5444444-4444-4444-8444-444444444444",
  sensorId: IDS.sensor,
  umbralMinimo: "12.0000",
  umbralMaximo: "32.0000",
  configuradoPorId: IDS.agronomo,
  updatedAt: "2026-06-01T12:00:00.000Z",
}

/** La serie viene agregada en SQL y con los numeros ya casteados. */
export const SERIE = {
  granularidad: "hora",
  zonaHoraria: "America/Argentina/Mendoza",
  puntos: [
    {
      periodo: "2026-08-25T10:00:00.000Z",
      promedio: 24.5,
      minimo: 22.1,
      maximo: 27.3,
      lecturas: 12,
    },
    {
      periodo: "2026-08-25T11:00:00.000Z",
      promedio: 29.8,
      minimo: 27.4,
      maximo: 33.9,
      lecturas: 12,
    },
    {
      periodo: "2026-08-25T12:00:00.000Z",
      promedio: 31.2,
      minimo: 29.0,
      maximo: 34.6,
      lecturas: 11,
    },
  ],
}

/** `valorLectura` y `umbralSuperado` son decimales: strings. */
export const ALERTAS_PENDIENTES = [
  {
    id: IDS.alerta,
    sensorId: IDS.sensor,
    tipoAlerta: "umbral_maximo",
    valorLectura: "34.6000",
    umbralSuperado: "32.0000",
    timestampLectura: "2026-08-25T12:40:00.000Z",
    estado: "pendiente",
    revisadaPorId: null,
    revisadaAt: null,
    createdAt: "2026-08-25T12:40:05.000Z",
    sensor: {
      id: IDS.sensor,
      codigo: "SEN-01",
      tipo: "temperatura",
      fincaId: IDS.finca,
      finca: { id: IDS.finca, nombre: "Finca El Rosal" },
    },
  },
]

/** `GET /empresas` (D-025 del backend): solo empresas cliente. */
export const EMPRESAS = [
  {
    id: EMPRESA_ID,
    nombre: "Finca Demo TerraVid",
    cuit: "20-12345678-9",
    activa: true,
    createdAt: "2026-01-01T12:00:00.000Z",
    usuariosActivos: 4,
  },
  {
    id: "e2222222-2222-4222-8222-222222222222",
    nombre: "Bodega Los Andes",
    cuit: "30-71234567-1",
    activa: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    usuariosActivos: 0,
  },
]
