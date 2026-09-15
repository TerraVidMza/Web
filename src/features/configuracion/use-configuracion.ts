import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fijarConfiguracion, listarConfiguracion } from "@/api/endpoints/configuracion"
import * as catalogosApi from "@/api/endpoints/catalogos"
import type { CrearCatalogoInput } from "@/api/endpoints/catalogos"
import type { ClaveConfiguracion } from "@/api/schemas/configuracion"
import type { CatalogoTipo } from "@/api/schemas/catalogo"
import { CACHE } from "@/lib/cache"

/**
 * El valor que el backend devuelve en lugar de un secreto.
 *
 * `GET /configuracion` enmascara `smtp_pass`: la pantalla nunca recibe la
 * contraseña real. **Reenviar esta cadena la guardaría literalmente**, dejando
 * el SMTP roto con ocho asteriscos por contraseña — así que la clave secreta
 * solo se manda cuando el usuario escribió una nueva.
 */
export const VALOR_ENMASCARADO = "********"

export const CLAVES_SECRETAS = new Set<string>(["smtp_pass"])

export function useConfiguracion() {
  return useQuery({
    queryKey: ["configuracion"],
    queryFn: listarConfiguracion,
    staleTime: CACHE.CASI_ESTATICO,
  })
}

export function useFijarConfiguracion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clave, valor }: { clave: ClaveConfiguracion; valor: string }) =>
      fijarConfiguracion(clave, valor),
    onSuccess: () => {
      // El contexto de formato lee moneda, unidades y zona horaria de acá.
      void queryClient.invalidateQueries({ queryKey: ["configuracion"] })
    },
  })
}

// ─── HU-34 · Tablas maestras ────────────────────────────────────────────────

export function useCatalogoCompleto(tipo: CatalogoTipo, incluirInactivos: boolean) {
  return useQuery({
    queryKey: ["catalogos", tipo, { incluirInactivos }],
    queryFn: () => catalogosApi.listarCatalogo(tipo, incluirInactivos),
    staleTime: CACHE.CASI_ESTATICO,
  })
}

function useInvalidarCatalogos() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["catalogos"] })
    // Los cuarteles muestran el nombre de la variedad y del sistema.
    void queryClient.invalidateQueries({ queryKey: ["cuarteles"] })
  }
}

export function useCrearCatalogo() {
  const invalidar = useInvalidarCatalogos()
  return useMutation({
    mutationFn: (input: CrearCatalogoInput) => catalogosApi.crearCatalogo(input),
    onSuccess: invalidar,
  })
}

export function useActualizarCatalogo() {
  const invalidar = useInvalidarCatalogos()
  return useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) =>
      catalogosApi.actualizarCatalogo(id, nombre),
    onSuccess: invalidar,
  })
}

export function useDesactivarCatalogo() {
  const invalidar = useInvalidarCatalogos()
  return useMutation({
    mutationFn: (id: string) => catalogosApi.desactivarCatalogo(id),
    onSuccess: invalidar,
  })
}

/** Borrado físico: el backend lo rechaza si el valor está en uso. */
export function useEliminarCatalogo() {
  const invalidar = useInvalidarCatalogos()
  return useMutation({
    mutationFn: (id: string) => catalogosApi.eliminarCatalogo(id),
    onSuccess: invalidar,
  })
}
