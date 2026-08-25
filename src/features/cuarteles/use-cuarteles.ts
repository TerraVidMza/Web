import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  crearCuartel,
  listarCuartelesDeFinca,
  type CrearCuartelInput,
} from "@/api/endpoints/cuarteles"
import { CACHE } from "@/lib/cache"

export const clavesCuarteles = {
  todos: ["cuarteles"] as const,
  deFinca: (fincaId: string) => ["cuarteles", "finca", fincaId] as const,
}

export function useCuartelesDeFinca(fincaId: string) {
  return useQuery({
    queryKey: clavesCuarteles.deFinca(fincaId),
    queryFn: () => listarCuartelesDeFinca(fincaId),
    enabled: fincaId.length > 0,
    staleTime: CACHE.ESTRUCTURA,
  })
}

export function useCrearCuartel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearCuartelInput) => crearCuartel(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: clavesCuarteles.deFinca(variables.fincaId),
      })
      // El listado de fincas muestra el contador de cuarteles activos.
      void queryClient.invalidateQueries({ queryKey: ["fincas"] })
    },
  })
}
