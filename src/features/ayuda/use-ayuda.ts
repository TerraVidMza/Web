import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as api from "@/api/endpoints/ayuda"
import type { CrearTicketInput, ListarArticulosParams } from "@/api/endpoints/ayuda"
import { CACHE } from "@/lib/cache"
import type { RolNombre } from "@/auth/roles"
import { cargarManual } from "./manual/manuales"

/** El manual va empaquetado con la Web: no cambia mientras la pestaña viva. */
export function useManual(rol: RolNombre | undefined) {
  return useQuery({
    queryKey: ["ayuda", "manual", rol],
    queryFn: () => cargarManual(rol!),
    enabled: rol !== undefined,
    staleTime: Infinity,
  })
}

export function useArticulos(params: ListarArticulosParams) {
  return useQuery({
    queryKey: ["ayuda", "articulos", params],
    queryFn: () => api.listarArticulos(params),
    staleTime: CACHE.CASI_ESTATICO,
  })
}

export function useTickets(habilitada: boolean) {
  return useQuery({
    queryKey: ["ayuda", "tickets"],
    queryFn: api.listarTickets,
    enabled: habilitada,
    staleTime: CACHE.OPERATIVO,
  })
}

export function useCrearTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearTicketInput) => api.crearTicket(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ayuda", "tickets"] }),
  })
}
