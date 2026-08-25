import { obtener } from "../request"
import { logAuditoriaPaginadoSchema } from "../schemas/log-auditoria"
import type { ParametrosPaginacion } from "../schemas/comunes"

export interface ListarAuditoriaParams extends ParametrosPaginacion {
  actorId?: string
  entidad?: string
  accion?: string
  entidadId?: string
  /** Inclusive, `YYYY-MM-DD`. */
  desde?: string
  /** Inclusive: el backend lo extiende al final del día. */
  hasta?: string
}

export function listarAuditoria(params: ListarAuditoriaParams = {}) {
  return obtener("/log-auditoria", logAuditoriaPaginadoSchema, { params })
}
