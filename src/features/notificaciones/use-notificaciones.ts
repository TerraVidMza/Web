import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  type ListarNotificacionesParams,
} from "@/api/endpoints/notificaciones"
import { CACHE } from "@/lib/cache"

const CLAVE = ["notificaciones"] as const

export function useNotificaciones(params: ListarNotificacionesParams = {}) {
  return useQuery({
    queryKey: [...CLAVE, params],
    queryFn: () => listarNotificaciones(params),
    staleTime: CACHE.TIEMPO_REAL,
    // El badge de la campana tiene que estar al día sin que el usuario recargue.
    refetchInterval: CACHE.TIEMPO_REAL * 2,
    refetchOnWindowFocus: true,
  })
}

export function useMarcarLeida() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marcarLeida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}

export function useMarcarTodasLeidas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marcarTodasLeidas,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}
