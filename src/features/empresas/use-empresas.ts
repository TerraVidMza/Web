import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  actualizarEmpresa,
  cambiarEstadoEmpresa,
  crearEmpresa,
  listarEmpresas,
  type ActualizarEmpresaInput,
  type CrearEmpresaInput,
} from "@/api/endpoints/empresas"
import { CACHE } from "@/lib/cache"

const clave = ["empresas"] as const

export function useEmpresas() {
  return useQuery({ queryKey: clave, queryFn: listarEmpresas, staleTime: CACHE.ESTRUCTURA })
}

export function useCrearEmpresa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearEmpresaInput) => crearEmpresa(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave }),
  })
}

export function useActualizarEmpresa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: ActualizarEmpresaInput & { id: string }) =>
      actualizarEmpresa(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave }),
  })
}

export function useCambiarEstadoEmpresa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) =>
      cambiarEstadoEmpresa(id, activa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave }),
  })
}
