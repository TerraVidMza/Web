import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { listarAuditoria, type ListarAuditoriaParams } from "@/api/endpoints/log-auditoria"
import { CACHE } from "@/lib/cache"

export function useAuditoria(params: ListarAuditoriaParams) {
  return useQuery({
    queryKey: ["log-auditoria", params],
    queryFn: () => listarAuditoria(params),
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  })
}
