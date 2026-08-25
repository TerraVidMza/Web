import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  actualizarCuartel,
  buscarCuarteles,
  crearCuartel,
  desactivarCuartel,
  listarCuartelesDeFinca,
  variedadesDeFinca,
  type ActualizarCuartelInput,
  type BuscarCuartelesParams,
  type CrearCuartelInput,
} from "@/api/endpoints/cuarteles"
import { CACHE } from "@/lib/cache"

export const clavesCuarteles = {
  todos: ["cuarteles"] as const,
  deFinca: (fincaId: string) => ["cuarteles", "finca", fincaId] as const,
  busqueda: (params: BuscarCuartelesParams) => ["cuarteles", "busqueda", params] as const,
  variedades: (fincaId: string) => ["cuarteles", "variedades", fincaId] as const,
}

export function useCuartelesDeFinca(fincaId: string) {
  return useQuery({
    queryKey: clavesCuarteles.deFinca(fincaId),
    queryFn: () => listarCuartelesDeFinca(fincaId),
    enabled: fincaId.length > 0,
    staleTime: CACHE.ESTRUCTURA,
  })
}

/**
 * Búsqueda a nivel empresa (HU-11). Es **otro endpoint** que el listado por
 * finca: este está paginado y acepta filtros, aquel devuelve un array plano con
 * los activos de una sola finca.
 */
export function useBuscarCuarteles(params: BuscarCuartelesParams) {
  return useQuery({
    queryKey: clavesCuarteles.busqueda(params),
    queryFn: () => buscarCuarteles(params),
    staleTime: CACHE.ESTRUCTURA,
    placeholderData: keepPreviousData,
  })
}

/**
 * Variedades **efectivamente plantadas** en una finca, para el desplegable del
 * filtro: ofrecer el catálogo completo lleva a elegir una variedad que esa
 * finca no tiene y obtener cero resultados.
 */
export function useVariedadesDeFinca(fincaId: string | undefined) {
  return useQuery({
    queryKey: clavesCuarteles.variedades(fincaId ?? ""),
    queryFn: () => variedadesDeFinca(fincaId as string),
    enabled: Boolean(fincaId),
    staleTime: CACHE.ESTRUCTURA,
  })
}

function invalidarTodo(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: clavesCuarteles.todos })
  // El listado de fincas muestra el contador de cuarteles activos.
  void queryClient.invalidateQueries({ queryKey: ["fincas"] })
}

export function useCrearCuartel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearCuartelInput) => crearCuartel(input),
    onSuccess: () => invalidarTodo(queryClient),
  })
}

export function useActualizarCuartel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: ActualizarCuartelInput & { id: string }) =>
      actualizarCuartel(id, input),
    onSuccess: () => invalidarTodo(queryClient),
  })
}

/**
 * Baja lógica. El backend responde **409** si el cuartel tiene labores o
 * pesajes **de la campaña actual**: el costeo y la trazabilidad de la cosecha
 * cuelgan de él. Sin campaña definida cuenta todo el histórico, que es el lado
 * conservador.
 */
export function useDesactivarCuartel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => desactivarCuartel(id),
    onSuccess: () => invalidarTodo(queryClient),
  })
}
