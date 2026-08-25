import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  actualizarFinca,
  crearFinca,
  desactivarFinca,
  listarFincas,
  type ActualizarFincaInput,
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

export function useActualizarFinca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: ActualizarFincaInput & { id: string }) =>
      actualizarFinca(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesFincas.todas }),
  })
}

/**
 * Baja lógica. El backend responde **409** si la finca todavía tiene cuarteles
 * activos, con el conteo en el mensaje: la baja no cascadea, y sin ese freno
 * los cuarteles quedaban activos colgando de una finca invisible.
 */
export function useDesactivarFinca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => desactivarFinca(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesFincas.todas })
      // El buscador de cuarteles filtra por finca; una finca dada de baja deja
      // de ser una opción válida.
      void queryClient.invalidateQueries({ queryKey: ["cuarteles"] })
    },
  })
}
