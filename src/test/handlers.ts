import { HttpResponse, http } from "msw"
import type { RolNombre } from "@/auth/roles"
import {
  CATALOGOS,
  COSTEO,
  CUADRILLAS,
  COSTOS_INSUMO,
  IDS,
  ESTADO_COSECHA,
  INSUMOS_CATALOGO,
  LIQUIDACION,
  PESAJES,
  REGISTROS_LABOR,
  REMITOS,
  TARIFAS,
  TIPOS_LABOR_CATALOGO,
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

  http.patch(`${API}/fincas/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const finca = FINCAS.find((f) => f.id === params.id) ?? FINCAS[0]
    return HttpResponse.json({ ...finca, ...body, hectareas: String(body.hectareas ?? finca.hectareas) })
  }),

  /**
   * La baja de finca es 409 mientras queden cuarteles activos: no cascadea, y
   * sin ese freno los cuarteles seguian aceptando labores colgando de una finca
   * invisible. `IDS.finca` tiene 3 cuarteles activos en los fixtures.
   */
  http.patch(`${API}/fincas/:id/desactivar`, ({ params }) => {
    const finca = FINCAS.find((f) => f.id === params.id)
    if (finca && finca.cuartelesActivos > 0) {
      return HttpResponse.json(
        {
          statusCode: 409,
          path: `/api/fincas/${String(params.id)}/desactivar`,
          timestamp: new Date().toISOString(),
          message: `La finca tiene ${finca.cuartelesActivos} cuartel(es) activo(s). Dales de baja primero.`,
        },
        { status: 409 }
      )
    }
    return HttpResponse.json({ ...(finca ?? FINCAS[1]), activa: false })
  }),

  http.get(`${API}/cuarteles`, () =>
    conRoles(["Propietario", "Agronomo", "Capataz"], "/api/cuarteles", () => CUARTELES)
  ),

  /** `GET /cuarteles/buscar` (HU-11): otro endpoint, y este si esta paginado. */
  http.get(`${API}/cuarteles/buscar`, ({ request }) => {
    const permitidos: RolNombre[] = ["Propietario", "Agronomo", "Capataz"]
    if (!permitidos.includes(rolActual)) return prohibido("/api/cuarteles/buscar")

    const params = new URL(request.url).searchParams
    const activo = params.get("activo") !== "false"
    let filas = CUARTELES.filter((c) => c.activo === activo).map((c) => ({
      ...c,
      finca: { id: IDS.finca, nombre: "Finca El Rosal" },
    }))

    const buscar = params.get("buscar")?.toLowerCase()
    if (buscar) filas = filas.filter((c) => c.nombre.toLowerCase().includes(buscar))
    const fincaId = params.get("fincaId")
    if (fincaId) filas = filas.filter((c) => c.fincaId === fincaId)
    const variedadId = params.get("variedadId")
    if (variedadId) filas = filas.filter((c) => c.variedadId === variedadId)
    const estado = params.get("estado")
    if (estado) filas = filas.filter((c) => c.estado === estado)
    const anio = params.get("anioImplantacion")
    if (anio) filas = filas.filter((c) => c.anioImplantacion === Number(anio))

    const orden = params.get("orden") === "DESC" ? -1 : 1
    const campo = params.get("ordenarPor") ?? "nombre"
    filas = [...filas].sort((a, b) => {
      const x = a[campo as "nombre"]
      const y = b[campo as "nombre"]
      return String(x).localeCompare(String(y)) * orden
    })

    return HttpResponse.json(
      paginar(filas, Number(params.get("page") ?? 1), Number(params.get("pageSize") ?? 20))
    )
  }),

  http.get(`${API}/cuarteles/variedades`, () => HttpResponse.json(CATALOGOS.variedad)),

  http.patch(`${API}/cuarteles/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const cuartel = CUARTELES.find((c) => c.id === params.id) ?? CUARTELES[0]
    return HttpResponse.json({ ...cuartel, ...body })
  }),

  /**
   * La baja de cuartel es 409 si tiene labores o pesajes de la campania actual:
   * el costeo y la trazabilidad de la cosecha cuelgan de el.
   */
  http.patch(`${API}/cuarteles/:id/desactivar`, ({ params }) => {
    if (params.id === IDS.cuartel) {
      return HttpResponse.json(
        {
          statusCode: 409,
          path: `/api/cuarteles/${String(params.id)}/desactivar`,
          timestamp: new Date().toISOString(),
          message:
            'El cuartel tiene 4 labor(es) y 2 pesaje(s) registrados en la campaña actual ("2026"), así que no puede darse de baja sin perder su trazabilidad.',
        },
        { status: 409 }
      )
    }
    return HttpResponse.json({ ...CUARTELES[0], id: params.id, activo: false })
  }),

  http.post(`${API}/cuarteles`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...CUARTELES[0], ...body }, { status: 201 })
  }),

  http.get(`${API}/catalogos`, ({ request }) => {
    const tipo = new URL(request.url).searchParams.get("tipo")
    // `ListarCatalogoDto` rechaza el tipo ausente o desconocido con un 400 que
    // nombra los valores validos. Antes el ausente era un 500 y el desconocido
    // un 200 con lista vacia, que para un cliente es peor: no distingue "escribi
    // mal el parametro" de "no hay datos".
    if (!tipo || !(tipo in CATALOGOS)) {
      return HttpResponse.json(
        {
          statusCode: 400,
          path: "/api/catalogos",
          timestamp: new Date().toISOString(),
          message: [
            "tipo debe ser uno de: variedad, sistema_conduccion, estado_cuartel, unidad_medida",
          ],
        },
        { status: 400 }
      )
    }
    return HttpResponse.json(CATALOGOS[tipo as keyof typeof CATALOGOS])
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

  http.patch(`${API}/usuarios/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const usuario = USUARIOS.find((u) => u.id === params.id) ?? USUARIOS[1]

    // Nadie cambia su propio rol: combinado con la imposibilidad de dar de baja
    // al ultimo Propietario, un autocambio podria dejar al sistema sin ninguno.
    if (params.id === IDS.propietario && body.rolId && body.rolId !== usuario.rolId) {
      return HttpResponse.json(
        {
          statusCode: 403,
          path: `/api/usuarios/${String(params.id)}`,
          timestamp: new Date().toISOString(),
          message: "No puedes modificar tu propio rol.",
        },
        { status: 403 }
      )
    }

    const rol = ROLES.find((r) => r.id === body.rolId) ?? usuario.rol
    return HttpResponse.json({ ...usuario, ...body, rol, rolId: rol.id })
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

  // ─── Operaciones (HU-15, 16, 17) ───────────────────────────────────────────

  http.get(`${API}/registro-labor/costeo`, () =>
    conRoles(["Propietario", "Agronomo"], "/api/registro-labor/costeo", () => COSTEO)
  ),

  http.get(`${API}/registro-labor/cuartel/:cuartelId`, ({ request }) => {
    const permitidos: RolNombre[] = ["Propietario", "Agronomo", "Capataz", "Auditor"]
    if (!permitidos.includes(rolActual)) {
      return prohibido("/api/registro-labor/cuartel")
    }
    const params = new URL(request.url).searchParams
    let filas = REGISTROS_LABOR
    const desde = params.get("desde")
    if (desde) filas = filas.filter((r) => r.fecha >= desde)
    const hasta = params.get("hasta")
    if (hasta) filas = filas.filter((r) => r.fecha <= hasta)
    return HttpResponse.json(paginar(filas, Number(params.get("page") ?? 1)))
  }),

  http.get(`${API}/insumos`, ({ request }) => {
    const permitidos: RolNombre[] = ["Propietario", "Agronomo", "Capataz"]
    if (!permitidos.includes(rolActual)) return prohibido("/api/insumos")
    const incluir = new URL(request.url).searchParams.get("incluirInactivos") === "true"
    return HttpResponse.json(
      incluir ? INSUMOS_CATALOGO : INSUMOS_CATALOGO.filter((i) => i.activo)
    )
  }),

  http.get(`${API}/insumos/:id/costos`, () =>
    conRoles(["Propietario", "Agronomo"], "/api/insumos/costos", () => COSTOS_INSUMO)
  ),

  http.post(`${API}/insumos`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...INSUMOS_CATALOGO[0], ...body }, { status: 201 })
  }),

  http.patch(`${API}/insumos/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...INSUMOS_CATALOGO[0], ...body })
  }),

  http.patch(`${API}/insumos/:id/desactivar`, () =>
    HttpResponse.json({ ...INSUMOS_CATALOGO[0], activo: false })
  ),

  /** `@IsPositive()` + `@EsFechaNoRetroactiva()`: los dos se validan. */
  http.post(`${API}/insumos/:id/costos`, async ({ request }) => {
    const body = (await request.json()) as { costoUnitario: number; validFrom: string }
    const errores: string[] = []
    if (!(body.costoUnitario > 0)) {
      errores.push("costoUnitario must be a positive number")
    }
    if (body.validFrom < new Date().toISOString().slice(0, 10)) {
      errores.push(
        "validFrom no puede ser retroactiva: cambiaría el costo ya aplicado a registros históricos."
      )
    }
    if (errores.length > 0) {
      return HttpResponse.json(
        {
          statusCode: 400,
          path: "/api/insumos/costos",
          timestamp: new Date().toISOString(),
          message: errores,
        },
        { status: 400 }
      )
    }
    return HttpResponse.json(
      {
        id: "e9444444-4444-4444-8444-444444444444",
        insumoId: IDS.insumo,
        costoUnitario: body.costoUnitario.toFixed(2),
        validFrom: body.validFrom,
        createdById: IDS.propietario,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  http.get(`${API}/tipos-labor`, ({ request }) => {
    const permitidos: RolNombre[] = ["Propietario", "Agronomo", "Capataz"]
    if (!permitidos.includes(rolActual)) return prohibido("/api/tipos-labor")
    const incluir = new URL(request.url).searchParams.get("incluirInactivos") === "true"
    return HttpResponse.json(
      incluir ? TIPOS_LABOR_CATALOGO : TIPOS_LABOR_CATALOGO.filter((t) => t.activo)
    )
  }),

  http.get(`${API}/tipos-labor/:id/costos`, () =>
    conRoles(["Propietario", "Agronomo"], "/api/tipos-labor/costos", () =>
      COSTOS_INSUMO.map((c) => ({ ...c, tipoLaborId: IDS.tipoLabor, insumoId: undefined }))
    )
  ),

  http.post(`${API}/tipos-labor`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...TIPOS_LABOR_CATALOGO[0], ...body }, { status: 201 })
  }),

  http.patch(`${API}/tipos-labor/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...TIPOS_LABOR_CATALOGO[0], ...body })
  }),

  http.patch(`${API}/tipos-labor/:id/desactivar`, () =>
    HttpResponse.json({ ...TIPOS_LABOR_CATALOGO[0], activo: false })
  ),

  // ─── Vendimia (HU-23, 26, 27, 28) ──────────────────────────────────────────

  http.get(`${API}/remitos`, ({ request }) => {
    const permitidos: RolNombre[] = ["Propietario", "Agronomo", "Capataz"]
    if (!permitidos.includes(rolActual)) return prohibido("/api/remitos")
    const params = new URL(request.url).searchParams
    const estado = params.get("estado")
    const filas = estado ? REMITOS.filter((r) => r.estado === estado) : REMITOS
    return HttpResponse.json(paginar(filas, Number(params.get("page") ?? 1)))
  }),

  http.get(`${API}/remitos/:id/liquidacion`, ({ params }) => {
    if (!["Propietario", "Agronomo"].includes(rolActual)) {
      return prohibido("/api/remitos/liquidacion")
    }
    // `null` cuando todavia no se cargo: es lo que deja el margen bruto en
    // "desconocido" en vez de en cero.
    return HttpResponse.json(params.id === IDS.remitoAprobado ? LIQUIDACION : null)
  }),

  http.put(`${API}/remitos/:id/liquidacion`, async ({ params, request }) => {
    const body = (await request.json()) as {
      kgAceptados: number
      precioPorKg: number
      descuentos?: number
      bodega: string
      fecha: string
    }
    const neto = body.kgAceptados * body.precioPorKg - (body.descuentos ?? 0)
    if (neto < 0) {
      return HttpResponse.json(
        {
          statusCode: 400,
          path: "/api/remitos/liquidacion",
          timestamp: new Date().toISOString(),
          message: "Los descuentos no pueden superar el importe bruto de la liquidación.",
        },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      ...LIQUIDACION,
      remitoId: String(params.id),
      bodega: body.bodega,
      kgAceptados: body.kgAceptados.toFixed(2),
      precioPorKg: body.precioPorKg.toFixed(4),
      descuentos: (body.descuentos ?? 0).toFixed(2),
      montoNeto: neto.toFixed(2),
      fecha: body.fecha,
    })
  }),

  http.get(`${API}/remitos/:id`, ({ params }) => {
    const remito = REMITOS.find((r) => r.id === params.id)
    if (!remito) {
      return HttpResponse.json(
        { statusCode: 404, message: "Remito no encontrado" },
        { status: 404 }
      )
    }
    return HttpResponse.json({ ...remito, pesajes: PESAJES })
  }),

  http.post(`${API}/remitos/generar-borrador`, async ({ request }) => {
    const body = (await request.json()) as { cuartelId: string; fecha?: string }
    if (!body.fecha) {
      return HttpResponse.json(
        { statusCode: 400, message: "fecha es obligatoria" },
        { status: 400 }
      )
    }
    return HttpResponse.json({ ...REMITOS[0], fecha: body.fecha }, { status: 201 })
  }),

  http.post(`${API}/remitos/:id/aprobar`, ({ params }) =>
    conRoles(["Propietario", "Agronomo"], "/api/remitos/aprobar", () => ({
      ...REMITOS[0],
      id: String(params.id),
      estado: "aprobado",
      aprobadoPorId: IDS.propietario,
      fechaAprobacion: new Date().toISOString(),
    }))
  ),

  /** `@Length(10, 500)`: el motivo es la unica explicacion que ve el Capataz. */
  http.post(`${API}/remitos/:id/rechazar`, async ({ params, request }) => {
    const body = (await request.json()) as { motivoRechazo?: string }
    if (!body.motivoRechazo || body.motivoRechazo.length < 10) {
      return HttpResponse.json(
        {
          statusCode: 400,
          path: "/api/remitos/rechazar",
          timestamp: new Date().toISOString(),
          message: ["motivoRechazo must be longer than or equal to 10 characters"],
        },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      ...REMITOS[0],
      id: String(params.id),
      estado: "rechazado",
      motivoRechazo: body.motivoRechazo,
      rechazadoPorId: IDS.propietario,
      fechaRechazo: new Date().toISOString(),
    })
  }),

  http.get(`${API}/pesajes-vendimia/finca/:fincaId/estado-cosecha`, () =>
    conRoles(
      ["Propietario", "Agronomo", "Capataz"],
      "/api/pesajes-vendimia/estado-cosecha",
      () => ESTADO_COSECHA
    )
  ),

  http.get(`${API}/pesajes-vendimia/cuartel/:cuartelId`, ({ request }) => {
    const permitidos: RolNombre[] = ["Propietario", "Agronomo", "Capataz"]
    if (!permitidos.includes(rolActual)) return prohibido("/api/pesajes-vendimia/cuartel")
    const params = new URL(request.url).searchParams
    return HttpResponse.json(paginar(PESAJES, Number(params.get("page") ?? 1)))
  }),

  http.get(`${API}/cuadrillas/:id/tarifas`, () =>
    conRoles(["Propietario", "Agronomo"], "/api/cuadrillas/tarifas", () => TARIFAS)
  ),

  http.get(`${API}/cuadrillas`, () =>
    conRoles(["Propietario", "Agronomo", "Capataz"], "/api/cuadrillas", () => CUADRILLAS)
  ),

  http.post(`${API}/cuadrillas`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...CUADRILLAS[0], ...body }, { status: 201 })
  }),

  http.patch(`${API}/cuadrillas/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...CUADRILLAS[0], ...body })
  }),

  http.patch(`${API}/cuadrillas/:id/desactivar`, () =>
    HttpResponse.json({ ...CUADRILLAS[0], activa: false })
  ),

  http.post(`${API}/cuadrillas/:id/tarifas`, async ({ request }) => {
    if (rolActual !== "Propietario") return prohibido("/api/cuadrillas/tarifas")
    const body = (await request.json()) as { tarifaPorKg: number; validFrom: string }
    return HttpResponse.json(
      {
        id: "f9333333-3333-4333-8333-333333333333",
        cuadrillaId: IDS.cuadrilla,
        tarifaPorKg: body.tarifaPorKg.toFixed(4),
        validFrom: body.validFrom,
        createdById: IDS.propietario,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  http.get(`${API}/configuracion`, () =>
    conRoles(["Propietario"], "/api/configuracion", () => CONFIGURACION)
  ),
]
