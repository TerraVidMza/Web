import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as api from "@/api/endpoints/vendimia"
import type {
  ActualizarCuadrillaInput,
  CrearCuadrillaInput,
  LiquidacionInput,
  ListarRemitosParams,
  TarifaInput,
} from "@/api/endpoints/vendimia"
import type { ParametrosPaginacion } from "@/api/schemas/comunes"
import { CACHE } from "@/lib/cache"

export const clavesVendimia = {
  remitos: ["remitos"] as const,
  remito: (id: string) => ["remitos", id] as const,
  liquidacion: (id: string) => ["remitos", id, "liquidacion"] as const,
  pesajes: ["pesajes-vendimia"] as const,
  cosecha: (fincaId: string) => ["pesajes-vendimia", "cosecha", fincaId] as const,
  cuadrillas: (fincaId: string) => ["cuadrillas", fincaId] as const,
  tarifas: (id: string) => ["cuadrillas", "tarifas", id] as const,
}

/**
 * Invalida todo lo que un cambio de estado del remito toca.
 *
 * No es exceso de celo: aprobar un remito mueve sus pesajes a `liquidado` y
 * puede pasar el cuartel a `cosechado`, así que el estado de cosecha, el
 * costeo y el dashboard quedan viejos con la misma acción.
 */
function useInvalidarCircuito() {
  const queryClient = useQueryClient()
  return () => {
    for (const clave of [
      ["remitos"],
      ["pesajes-vendimia"],
      ["cuarteles"],
      ["costeo"],
      ["dashboard"],
    ]) {
      void queryClient.invalidateQueries({ queryKey: clave })
    }
  }
}

// ─── Remitos ────────────────────────────────────────────────────────────────

export function useRemitos(params: ListarRemitosParams) {
  return useQuery({
    queryKey: [...clavesVendimia.remitos, params],
    queryFn: () => api.listarRemitos(params),
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  })
}

export function useRemito(id: string) {
  return useQuery({
    queryKey: clavesVendimia.remito(id),
    queryFn: () => api.obtenerRemito(id),
    enabled: id.length > 0,
    staleTime: CACHE.OPERATIVO,
  })
}

export function useGenerarBorrador() {
  const invalidar = useInvalidarCircuito()
  return useMutation({
    mutationFn: ({ cuartelId, fecha }: { cuartelId: string; fecha: string }) =>
      api.generarBorrador(cuartelId, fecha),
    onSuccess: invalidar,
  })
}

export function useAprobarRemito() {
  const invalidar = useInvalidarCircuito()
  return useMutation({
    mutationFn: (id: string) => api.aprobarRemito(id),
    onSuccess: invalidar,
  })
}

export function useRechazarRemito() {
  const invalidar = useInvalidarCircuito()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      api.rechazarRemito(id, motivo),
    onSuccess: invalidar,
  })
}

export function useLiquidacion(remitoId: string, habilitada: boolean) {
  return useQuery({
    queryKey: clavesVendimia.liquidacion(remitoId),
    queryFn: () => api.obtenerLiquidacion(remitoId),
    enabled: habilitada && remitoId.length > 0,
    staleTime: CACHE.OPERATIVO,
  })
}

export function useRegistrarLiquidacion() {
  const invalidar = useInvalidarCircuito()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ remitoId, ...input }: LiquidacionInput & { remitoId: string }) =>
      api.registrarLiquidacion(remitoId, input),
    onSuccess: (_, variables) => {
      invalidar()
      void queryClient.invalidateQueries({
        queryKey: clavesVendimia.liquidacion(variables.remitoId),
      })
    },
  })
}

// ─── Pesajes y estado de cosecha ────────────────────────────────────────────

export function usePesajesDeCuartel(cuartelId: string, params: ParametrosPaginacion) {
  return useQuery({
    queryKey: [...clavesVendimia.pesajes, cuartelId, params],
    queryFn: () => api.pesajesDeCuartel(cuartelId, params),
    enabled: cuartelId.length > 0,
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  })
}

export function useEstadoCosecha(fincaId: string) {
  return useQuery({
    queryKey: clavesVendimia.cosecha(fincaId),
    queryFn: () => api.estadoCosechaDeFinca(fincaId),
    enabled: fincaId.length > 0,
    staleTime: CACHE.OPERATIVO,
  })
}

// ─── Cuadrillas ─────────────────────────────────────────────────────────────

export function useCuadrillas(fincaId: string) {
  return useQuery({
    queryKey: clavesVendimia.cuadrillas(fincaId),
    queryFn: () => api.cuadrillasDeFinca(fincaId),
    enabled: fincaId.length > 0,
    staleTime: CACHE.ESTRUCTURA,
  })
}

function useInvalidarCuadrillas() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["cuadrillas"] })
}

export function useCrearCuadrilla() {
  const invalidar = useInvalidarCuadrillas()
  return useMutation({
    mutationFn: (input: CrearCuadrillaInput) => api.crearCuadrilla(input),
    onSuccess: invalidar,
  })
}

export function useActualizarCuadrilla() {
  const invalidar = useInvalidarCuadrillas()
  return useMutation({
    mutationFn: ({ id, ...input }: ActualizarCuadrillaInput & { id: string }) =>
      api.actualizarCuadrilla(id, input),
    onSuccess: invalidar,
  })
}

export function useDesactivarCuadrilla() {
  const invalidar = useInvalidarCuadrillas()
  return useMutation({
    mutationFn: (id: string) => api.desactivarCuadrilla(id),
    onSuccess: invalidar,
  })
}

export function useTarifas(cuadrillaId: string | null) {
  return useQuery({
    queryKey: clavesVendimia.tarifas(cuadrillaId ?? ""),
    queryFn: () => api.tarifasDeCuadrilla(cuadrillaId as string),
    enabled: cuadrillaId !== null,
    staleTime: CACHE.ESTRUCTURA,
  })
}

export function useFijarTarifa() {
  const invalidar = useInvalidarCuadrillas()
  return useMutation({
    mutationFn: ({ id, ...input }: TarifaInput & { id: string }) => api.fijarTarifa(id, input),
    onSuccess: invalidar,
  })
}
