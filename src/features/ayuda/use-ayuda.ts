import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as api from "@/api/endpoints/ayuda"
import type { CrearTicketInput, ListarArticulosParams } from "@/api/endpoints/ayuda"
import { CACHE } from "@/lib/cache"

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
