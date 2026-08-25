import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  crearUsuario,
  desactivarUsuario,
  listarRoles,
  listarUsuarios,
  type CrearUsuarioInput,
  type ListarUsuariosParams,
} from "@/api/endpoints/usuarios"
import { CACHE } from "@/lib/cache"

export const clavesUsuarios = {
  todos: ["usuarios"] as const,
  lista: (params: ListarUsuariosParams) => ["usuarios", "lista", params] as const,
}

export function useUsuarios(params: ListarUsuariosParams) {
  return useQuery({
    queryKey: clavesUsuarios.lista(params),
    queryFn: () => listarUsuarios(params),
    staleTime: CACHE.ESTRUCTURA,
    // Cambiar de página no debe mostrar un esqueleto: la tabla anterior se
    // mantiene hasta que llega la nueva, y el salto de layout desaparece.
    placeholderData: keepPreviousData,
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: listarRoles,
    staleTime: CACHE.CASI_ESTATICO,
  })
}

export function useCrearUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearUsuarioInput) => crearUsuario(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesUsuarios.todos }),
  })
}

export function useDesactivarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => desactivarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesUsuarios.todos }),
  })
}
