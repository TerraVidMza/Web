import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  crearFinca,
  desactivarFinca,
  listarFincas,
  type CrearFincaInput,
} from "@/api/endpoints/fincas"
import { CACHE } from "@/lib/cache"

export const clavesFincas = {
  todas: ["fincas"] as const,
  lista: (search: string) => ["fincas", "lista", search] as const,
}

export function useFincas(search?: string) {
  return useQuery({
    queryKey: clavesFincas.lista(search ?? ""),
    queryFn: () => listarFincas(search),
    staleTime: CACHE.ESTRUCTURA,
    // Cambiar el texto de búsqueda no debe vaciar la tabla mientras llega la
    // respuesta: sin esto, cada tecla la reemplaza por un esqueleto.
    placeholderData: (anterior) => anterior,
  })
}

export function useCrearFinca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearFincaInput) => crearFinca(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesFincas.todas }),
  })
}

export function useDesactivarFinca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => desactivarFinca(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesFincas.todas }),
  })
}
