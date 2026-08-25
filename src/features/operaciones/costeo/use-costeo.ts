import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { costeoPorCuartel, type CosteoParams } from "@/api/endpoints/operaciones"
import { CACHE } from "@/lib/cache"

export function useCosteo(params: CosteoParams) {
  return useQuery({
    queryKey: ["costeo", params],
    queryFn: () => costeoPorCuartel(params),
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  })
}
