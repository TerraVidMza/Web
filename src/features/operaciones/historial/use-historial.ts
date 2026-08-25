import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  historialDeLabores,
  type HistorialLaboresParams,
} from "@/api/endpoints/operaciones"
import { CACHE } from "@/lib/cache"

export function useHistorialDeLabores(cuartelId: string, params: HistorialLaboresParams) {
  return useQuery({
    queryKey: ["registro-labor", cuartelId, params],
    queryFn: () => historialDeLabores(cuartelId, params),
    enabled: cuartelId.length > 0,
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  })
}
