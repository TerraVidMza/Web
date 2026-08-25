import { HttpResponse, http } from "msw"
import type { RolNombre } from "@/auth/roles"
import {
  CATALOGOS,
  CONFIGURACION,
  CUARTELES,
  DASHBOARD,
  FINCAS,
  LOG_AUDITORIA,
  NOTIFICACIONES,
  ROLES,
  USUARIOS,
  paginar,
  tokenDePrueba,
  usuarioSesion,
} from "./fixtures"

const API = "http://localhost:3000/api"

/**
 * Rol que devuelven los handlers dependientes de sesión.
 *
 * Los tests lo cambian con `sesionComo("Auditor")`: el backend decide el
 * contenido del dashboard y los 403 a partir del token, y sin poder simular eso
 * no se puede probar lo que rompía —el dashboard del Auditor y los links a
 * secciones prohibidas—.
 */
let rolActual: RolNombre = "Propietario"

export function sesionComo(rol: RolNombre) {
  rolActual = rol
}

export function reiniciarSesionDePrueba() {
  rolActual = "Propietario"
}

/** 403 con la forma del `HttpExceptionFilter` del backend. */
function prohibido(path: string) {
  return HttpResponse.json(
    {
      statusCode: 403,
      path,
      timestamp: new Date().toISOString(),
      message: "No tiene permisos para acceder a este recurso",
    },
    { status: 403 }
  )
}

/** Deniega si el rol de la sesión no está en la lista, como el `RolesGuard`. */
function conRoles(
  permitidos: RolNombre[],
  path: string,
  respuesta: () => Record<string, unknown> | unknown[]
) {
  if (!permitidos.includes(rolActual)) return prohibido(path)
  return HttpResponse.json(respuesta())
}

export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.password !== "correcta1") {
      return HttpResponse.json(
        {
          statusCode: 401,
          path: "/api/auth/login",
          timestamp: new Date().toISOString(),
          message: "Email o contraseña incorrectos",
        },
        { status: 401 }
      )
    }
    const rol: RolNombre = body.email.startsWith("auditor")
      ? "Auditor"
      : body.email.startsWith("capataz")
        ? "Capataz"
        : body.email.startsWith("agronomo")
          ? "Agronomo"
          : "Propietario"
    sesionComo(rol)
    return HttpResponse.json({
      accessToken: tokenDePrueba(),
      user: {
        ...usuarioSesion(rol),
        email: body.email,
        debeCambiarPassword: body.email.startsWith("temporal"),
      },
    })
  }),

  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${API}/auth/cambiar-password`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${API}/auth/forgot-password`, () =>
    HttpResponse.json({
      message: "Si el email existe, se enviaron las instrucciones de recuperación.",
    })
  ),
  http.post(`${API}/auth/reset-password`, () =>
    HttpResponse.json({ message: "Contraseña actualizada correctamente." })
  ),

  http.get(`${API}/dashboard/indicadores`, () => HttpResponse.json(DASHBOARD[rolActual])),

  http.get(`${API}/fincas`, ({ request }) => {
    const permitidos: RolNombre[] = ["Propietario", "Agronomo", "Capataz"]
    if (!permitidos.includes(rolActual)) return prohibido("/api/fincas")
    const search = new URL(request.url).searchParams.get("search")
    const fincas = search
      ? FINCAS.filter((f) => f.nombre.toLowerCase().includes(search.toLowerCase()))
      : FINCAS
    return HttpResponse.json(fincas)
  }),

  /**
   * El `ValidationPipe` global corre con `forbidNonWhitelisted: true`, así que
   * un `empresaId` de más no se ignora: **rechaza la request entera**. El
   * handler lo reproduce porque es el bug B2.
   */
  http.post(`${API}/fincas`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const sobrantes = Object.keys(body).filter(
      (k) => !["nombre", "ubicacion", "hectareas", "latitud", "longitud"].includes(k)
    )
    if (sobrantes.length > 0) {
      return HttpResponse.json(
        {
          statusCode: 400,
          path: "/api/fincas",
          timestamp: new Date().toISOString(),
          message: sobrantes.map((k) => `property ${k} should not exist`),
        },
        { status: 400 }
      )
    }
    return HttpResponse.json(
      {
        ...FINCAS[0],
        id: "f9999999-9999-4999-8999-999999999999",
        nombre: body.nombre,
        ubicacion: body.ubicacion ?? null,
        hectareas: String(body.hectareas),
        cuartelesActivos: undefined,
      },
      { status: 201 }
    )
  }),

  http.get(`${API}/cuarteles`, () =>
    conRoles(["Propietario", "Agronomo", "Capataz"], "/api/cuarteles", () => CUARTELES)
  ),

  http.post(`${API}/cuarteles`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...CUARTELES[0], ...body }, { status: 201 })
  }),

  http.get(`${API}/catalogos`, ({ request }) => {
    const tipo = new URL(request.url).searchParams.get("tipo")
    if (!tipo) {
      // El backend devuelve 500 sin `tipo` (§5 del plan). Se reproduce para que
      // ningún llamado nuevo lo omita sin enterarse.
      return HttpResponse.json({ statusCode: 500, message: "Error interno" }, { status: 500 })
    }
    return HttpResponse.json(CATALOGOS[tipo as keyof typeof CATALOGOS] ?? [])
  }),

  http.get(`${API}/usuarios`, ({ request }) => {
    if (rolActual !== "Propietario") return prohibido("/api/usuarios")
    const params = new URL(request.url).searchParams
    const buscar = params.get("buscar")?.toLowerCase()
    const filtrados = buscar
      ? USUARIOS.filter(
          (u) => u.nombre.toLowerCase().includes(buscar) || u.email.toLowerCase().includes(buscar)
        )
      : USUARIOS
    return HttpResponse.json(
      paginar(filtrados, Number(params.get("page") ?? 1), Number(params.get("pageSize") ?? 20))
    )
  }),

  http.get(`${API}/usuarios/me`, () =>
    HttpResponse.json({
      ...USUARIOS[0],
      empresa: {
        id: USUARIOS[0].empresaId,
        nombre: "Bodega Demo",
        cuit: "30-71234567-9",
        activa: true,
      },
    })
  ),
  http.patch(`${API}/usuarios/me`, async ({ request }) => {
    const body = (await request.json()) as { nombre: string }
    return HttpResponse.json({ ...USUARIOS[0], nombre: body.nombre })
  }),

  http.post(`${API}/usuarios`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const sobrantes = Object.keys(body).filter(
      (k) => !["nombre", "email", "password", "rolId", "activo"].includes(k)
    )
    if (sobrantes.length > 0) {
      return HttpResponse.json(
        {
          statusCode: 400,
          path: "/api/usuarios",
          timestamp: new Date().toISOString(),
          message: sobrantes.map((k) => `property ${k} should not exist`),
        },
        { status: 400 }
      )
    }
    return HttpResponse.json({ ...USUARIOS[1], nombre: body.nombre, email: body.email }, { status: 201 })
  }),

  http.patch(`${API}/usuarios/:id/desactivar`, () => HttpResponse.json({ ...USUARIOS[1], activo: false })),

  http.get(`${API}/roles`, () => conRoles(["Propietario"], "/api/roles", () => ROLES)),

  http.get(`${API}/log-auditoria`, ({ request }) => {
    if (!["Propietario", "Auditor"].includes(rolActual)) return prohibido("/api/log-auditoria")
    const params = new URL(request.url).searchParams
    const accion = params.get("accion")
    const filtrados = accion ? LOG_AUDITORIA.filter((e) => e.accion === accion) : LOG_AUDITORIA
    return HttpResponse.json(paginar(filtrados, Number(params.get("page") ?? 1)))
  }),

  http.get(`${API}/notificaciones`, ({ request }) => {
    const params = new URL(request.url).searchParams
    const solo = params.get("soloNoLeidas") === "true"
    const lista = solo ? NOTIFICACIONES.filter((n) => !n.leida) : NOTIFICACIONES
    return HttpResponse.json({
      ...paginar(lista, Number(params.get("page") ?? 1), Number(params.get("pageSize") ?? 20)),
      noLeidas: NOTIFICACIONES.filter((n) => !n.leida).length,
    })
  }),
  http.patch(`${API}/notificaciones/:id/leida`, () => new HttpResponse(null, { status: 200 })),
  http.patch(`${API}/notificaciones/leidas`, () => new HttpResponse(null, { status: 200 })),

  http.get(`${API}/configuracion`, () =>
    conRoles(["Propietario"], "/api/configuracion", () => CONFIGURACION)
  ),
]
