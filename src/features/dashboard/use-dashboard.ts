import { useQuery } from "@tanstack/react-query"
import { indicadoresClave } from "@/api/endpoints/dashboard"
import { CACHE } from "@/lib/cache"

export function useIndicadoresClave() {
  return useQuery({
    queryKey: ["dashboard", "indicadores"],
    queryFn: indicadoresClave,
    staleTime: CACHE.OPERATIVO,
  })
}
