import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Finca } from "@/types/finca"

export interface CreateFincaInput {
  nombre: string
  ubicacion?: string
  hectareas: number
  empresaId: string
  latitud?: number
  longitud?: number
}

export function useFincas(search?: string) {
  return useQuery({
    queryKey: ["fincas", search ?? ""],
    queryFn: async () => {
      const { data } = await api.get<Finca[]>("/fincas", { params: search ? { search } : undefined })
      return data
    },
  })
}

export function useCreateFinca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateFincaInput) => {
      const { data } = await api.post<Finca>("/fincas", input)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fincas"] })
    },
  })
}
