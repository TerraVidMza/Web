import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface IndicadoresClave {
  fincasActivas: number
  cuartelesActivos: number
  alertasIotPendientes: number
  remitosPendientesAprobacion: number
  kgCosechadosCampaniaActual: number
  costoLaboresTotal: number
  costoInsumosTotal: number
}

export function useDashboardIndicadores() {
  return useQuery({
    queryKey: ["dashboard", "indicadores"],
    queryFn: async () => {
      const { data } = await api.get<IndicadoresClave>("/dashboard/indicadores")
      return data
    },
  })
}
