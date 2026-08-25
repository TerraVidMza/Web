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

export function usuarioSesion(rol: RolNombre, id = IDS.propietario) {
  return { id, email: `${rol.toLowerCase()}@terravid.demo`, rol, empresaId: EMPRESA_ID, debeCambiarPassword: false }
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

const ESTADO_COSECHA = {
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
  estadoCosechaGlobal: ESTADO_COSECHA,
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
]

/**
 * **El dashboard es una unión por rol.** Ver §B3 del plan de adaptación: para
 * el Auditor la respuesta tiene dos claves y ninguna es la que leían las
 * tarjetas.
 */
export const DASHBOARD: Record<RolNombre, Record<string, unknown>> = {
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
    clave: "smtp_pass",
    valor: "********",
    updatedById: IDS.propietario,
    updatedAt: "2026-01-10T12:00:00.000Z",
  },
]
