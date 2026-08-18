import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { RolNombre, Usuario } from "@/types/auth"

export interface CreateUsuarioInput {
  nombre: string
  email: string
  password: string
  empresaId: string
  rolId: string
}

export interface Rol {
  id: string
  nombreRol: RolNombre
}

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data } = await api.get<Usuario[]>("/usuarios")
      return data
    },
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await api.get<Rol[]>("/roles")
      return data
    },
  })
}

export function useCreateUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateUsuarioInput) => {
      const { data } = await api.post<Usuario>("/usuarios", input)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })
}

export function useDesactivarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/usuarios/${id}/desactivar`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })
}
