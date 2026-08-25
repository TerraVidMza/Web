import { obtener, sinRespuesta } from "../request"
import { notificacionesPaginadasSchema } from "../schemas/notificacion"
import type { ParametrosPaginacion } from "../schemas/comunes"

export interface ListarNotificacionesParams extends ParametrosPaginacion {
  soloNoLeidas?: boolean
}

export function listarNotificaciones(params: ListarNotificacionesParams = {}) {
  return obtener("/notificaciones", notificacionesPaginadasSchema, { params })
}

export function marcarLeida(id: string) {
  return sinRespuesta("PATCH", `/notificaciones/${id}/leida`)
}

export function marcarTodasLeidas() {
  return sinRespuesta("PATCH", "/notificaciones/leidas")
}
