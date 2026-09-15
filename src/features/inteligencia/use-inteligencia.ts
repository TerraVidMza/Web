import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as api from "@/api/endpoints/inteligencia"
import type {
  CampaniaInput,
  CompararParams,
  CorrelacionParams,
} from "@/api/endpoints/inteligencia"
import { CACHE } from "@/lib/cache"

export const clavesInteligencia = {
  campanias: ["campanias"] as const,
  correlacion: (cuartelId: string, params: CorrelacionParams) =>
    ["inteligencia", "correlacion", cuartelId, params] as const,
  recomendaciones: (cuartelId: string) =>
    ["inteligencia", "recomendaciones", cuartelId] as const,
  comparacion: (cuartelId: string, params: CompararParams) =>
    ["inteligencia", "comparacion", cuartelId, params] as const,
}

// ─── Campañas ───────────────────────────────────────────────────────────────

export function useCampanias() {
  return useQuery({
    queryKey: clavesInteligencia.campanias,
    queryFn: api.listarCampanias,
    staleTime: CACHE.CASI_ESTATICO,
  })
}

function useInvalidarCampanias() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: clavesInteligencia.campanias })
    // La campaña acota los kg del dashboard y la baja de cuartel de HU-09.
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    void queryClient.invalidateQueries({ queryKey: ["inteligencia"] })
  }
}

export function useCrearCampania() {
  const invalidar = useInvalidarCampanias()
  return useMutation({
    mutationFn: (input: CampaniaInput) => api.crearCampania(input),
    onSuccess: invalidar,
  })
}

export function useActualizarCampania() {
  const invalidar = useInvalidarCampanias()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<CampaniaInput> & { id: string }) =>
      api.actualizarCampania(id, input),
    onSuccess: invalidar,
  })
}

export function useCambiarCierreCampania() {
  const invalidar = useInvalidarCampanias()
  return useMutation({
    mutationFn: ({ id, cerrar }: { id: string; cerrar: boolean }) =>
      cerrar ? api.cerrarCampania(id) : api.reabrirCampania(id),
    onSuccess: invalidar,
  })
}

// ─── Inteligencia ───────────────────────────────────────────────────────────

export function useCorrelacion(cuartelId: string, params: CorrelacionParams | null) {
  return useQuery({
    queryKey: clavesInteligencia.correlacion(cuartelId, params ?? ({} as CorrelacionParams)),
    queryFn: () => api.correlacionDeCuartel(cuartelId, params as CorrelacionParams),
    // Sin sensor y sin fechas el backend responde 400: no se pide hasta tenerlos.
    enabled: cuartelId.length > 0 && params !== null,
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  })
}

/**
 * Consultar recomendaciones **evalúa las reglas y persiste** las que
 * correspondan. Por eso no se refetchea al enfocar la ventana: sería disparar
 * la evaluación cada vez que alguien vuelve a la pestaña.
 */
export function useRecomendaciones(cuartelId: string) {
  return useQuery({
    queryKey: clavesInteligencia.recomendaciones(cuartelId),
    queryFn: () => api.recomendacionesDeCuartel(cuartelId),
    enabled: cuartelId.length > 0,
    staleTime: CACHE.OPERATIVO,
    refetchOnWindowFocus: false,
  })
}

export function useResolverRecomendacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      estado,
      nota,
    }: {
      id: string
      estado: "aplicada" | "descartada"
      nota?: string
    }) => api.resolverRecomendacion(id, estado, nota),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inteligencia", "recomendaciones"] }),
  })
}

export function useComparacion(cuartelId: string, params: CompararParams | null) {
  return useQuery({
    queryKey: clavesInteligencia.comparacion(cuartelId, params ?? {}),
    queryFn: () => api.compararCampanias(cuartelId, params as CompararParams),
    enabled: cuartelId.length > 0 && params !== null,
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  })
}
