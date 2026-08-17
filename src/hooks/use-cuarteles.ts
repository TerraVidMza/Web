import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Cuartel } from "@/types/finca"

export interface CreateCuartelInput {
  fincaId: string
  variedadId: string
  sistemaConduccionId: string
  nombre: string
  hectareas?: number
}

export function useCuarteles(fincaId: string) {
  return useQuery({
    queryKey: ["cuarteles", fincaId],
    queryFn: async () => {
      const { data } = await api.get<Cuartel[]>("/cuarteles", { params: { fincaId } })
      return data
    },
    enabled: !!fincaId,
  })
}

export function useCreateCuartel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCuartelInput) => {
      const { data } = await api.post<Cuartel>("/cuarteles", input)
      return data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["cuarteles", variables.fincaId] })
    },
  })
}
