import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  ActualizarCatalogoCosteableInput,
  CrearCatalogoCosteableInput,
  NuevoCostoInput,
} from "@/api/endpoints/operaciones"
import type { CostoVigencia } from "@/api/schemas/operaciones"
import { CACHE } from "@/lib/cache"
import type { CatalogoCosteableConfig } from "./config"

export function useCatalogoCosteable(config: CatalogoCosteableConfig, incluirInactivos: boolean) {
  return useQuery({
    queryKey: [config.clave, { incluirInactivos }],
    queryFn: () => config.listar(incluirInactivos),
    staleTime: CACHE.CASI_ESTATICO,
  })
}

/**
 * Historial de costos de un ítem. Se pide **solo al abrir el diálogo**: el
 * listado no trae el costo vigente y traerlo por fila serían N+1 requests al
 * dibujar la tabla.
 */
export function useCostos(config: CatalogoCosteableConfig, id: string | null) {
  return useQuery({
    queryKey: [config.clave, "costos", id],
    queryFn: () => config.costos(id as string),
    enabled: id !== null,
    staleTime: CACHE.CASI_ESTATICO,
  })
}

function useInvalidar(config: CatalogoCosteableConfig) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [config.clave] })
    // El costeo se calcula con estos costos, así que cambia con ellos.
    void queryClient.invalidateQueries({ queryKey: ["costeo"] })
  }
}

export function useCrearCatalogoCosteable(config: CatalogoCosteableConfig) {
  const invalidar = useInvalidar(config)
  return useMutation({
    mutationFn: (input: CrearCatalogoCosteableInput) => config.crear(input),
    onSuccess: invalidar,
  })
}

export function useActualizarCatalogoCosteable(config: CatalogoCosteableConfig) {
  const invalidar = useInvalidar(config)
  return useMutation({
    mutationFn: ({ id, ...input }: ActualizarCatalogoCosteableInput & { id: string }) =>
      config.actualizar(id, input),
    onSuccess: invalidar,
  })
}

export function useDesactivarCatalogoCosteable(config: CatalogoCosteableConfig) {
  const invalidar = useInvalidar(config)
  return useMutation({
    mutationFn: (id: string) => config.desactivar(id),
    onSuccess: invalidar,
  })
}

export function useFijarCosto(config: CatalogoCosteableConfig) {
  const invalidar = useInvalidar(config)
  return useMutation({
    mutationFn: ({ id, ...input }: NuevoCostoInput & { id: string }) =>
      config.fijarCosto(id, input),
    onSuccess: invalidar,
  })
}

/** Día de hoy en la zona local, en el formato `date` que espera el backend. */
export function hoyIso(): string {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, "0")
  const dia = String(ahora.getDate()).padStart(2, "0")
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

export interface CostoClasificado extends CostoVigencia {
  /** El que rige hoy: el más reciente con `validFrom <= hoy`. */
  esVigente: boolean
  /** Programado para más adelante; todavía no se aplica a ninguna labor. */
  esFuturo: boolean
}

/**
 * Marca cuál de los costos rige hoy y cuáles están programados.
 *
 * El backend devuelve el historial completo ordenado por `validFrom` DESC, así
 * que **el primero no es necesariamente el vigente**: si alguien cargó un costo
 * con fecha futura, ese encabeza la lista. Sin esta distinción la pantalla
 * mostraría como precio actual uno que todavía no se aplica.
 *
 * La comparación es de texto: `validFrom` es un `date` sin hora ni huso, y
 * pasarlo por `new Date()` lo corre un día en zonas horarias negativas.
 */
export function clasificarCostos(costos: CostoVigencia[], hoy = hoyIso()): CostoClasificado[] {
  const vigente = costos
    .filter((costo) => costo.validFrom <= hoy)
    .reduce<CostoVigencia | null>(
      (mejor, costo) => (mejor === null || costo.validFrom > mejor.validFrom ? costo : mejor),
      null
    )

  return costos.map((costo) => ({
    ...costo,
    esVigente: costo.id === vigente?.id,
    esFuturo: costo.validFrom > hoy,
  }))
}
