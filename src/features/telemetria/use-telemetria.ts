import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as api from "@/api/endpoints/telemetria"
import type {
  ActualizarSensorInput,
  CrearSensorInput,
  ListarLecturasParams,
  SerieParams,
  UmbralInput,
} from "@/api/endpoints/telemetria"
import { CACHE } from "@/lib/cache"

export const clavesTelemetria = {
  sensores: (fincaId: string) => ["sensores", fincaId] as const,
  sensor: (id: string) => ["sensores", "detalle", id] as const,
  umbral: (sensorId: string) => ["sensores", sensorId, "umbral"] as const,
  serie: (sensorId: string, params: SerieParams) =>
    ["lecturas-iot", sensorId, "serie", params] as const,
  lecturas: (sensorId: string, params: ListarLecturasParams) =>
    ["lecturas-iot", sensorId, params] as const,
  alertas: ["alertas-iot"] as const,
}

export function useSensor(id: string) {
  return useQuery({
    queryKey: ["sensores", "detalle", id],
    queryFn: () => api.obtenerSensor(id),
    enabled: id.length > 0,
    staleTime: CACHE.ESTRUCTURA,
  })
}

export function useSensores(fincaId: string) {
  return useQuery({
    queryKey: clavesTelemetria.sensores(fincaId),
    queryFn: () => api.sensoresDeFinca(fincaId),
    enabled: fincaId.length > 0,
    // La última lectura viene en el mismo payload, así que este listado también
    // es el tablero de "qué está midiendo cada nodo ahora".
    staleTime: CACHE.TIEMPO_REAL,
  })
}

function useInvalidarSensores() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["sensores"] })
}

export function useCrearSensor() {
  const invalidar = useInvalidarSensores()
  return useMutation({
    mutationFn: (input: CrearSensorInput) => api.crearSensor(input),
    onSuccess: invalidar,
  })
}

export function useActualizarSensor() {
  const invalidar = useInvalidarSensores()
  return useMutation({
    mutationFn: ({ id, ...input }: ActualizarSensorInput & { id: string }) =>
      api.actualizarSensor(id, input),
    onSuccess: invalidar,
  })
}

export function useDesactivarSensor() {
  const invalidar = useInvalidarSensores()
  return useMutation({
    mutationFn: (id: string) => api.desactivarSensor(id),
    onSuccess: invalidar,
  })
}

export function useUmbral(sensorId: string) {
  return useQuery({
    queryKey: clavesTelemetria.umbral(sensorId),
    queryFn: () => api.umbralDeSensor(sensorId),
    enabled: sensorId.length > 0,
    staleTime: CACHE.ESTRUCTURA,
  })
}

export function useFijarUmbral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sensorId, ...input }: UmbralInput & { sensorId: string }) =>
      api.fijarUmbral(sensorId, input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: clavesTelemetria.umbral(variables.sensorId),
      })
      // Cambiar el umbral cambia qué lecturas futuras disparan alerta.
      void queryClient.invalidateQueries({ queryKey: clavesTelemetria.alertas })
    },
  })
}

export function useSerie(sensorId: string, params: SerieParams) {
  return useQuery({
    queryKey: clavesTelemetria.serie(sensorId, params),
    queryFn: () => api.serieDeSensor(sensorId, params),
    enabled: sensorId.length > 0,
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  })
}

export function useLecturas(sensorId: string, params: ListarLecturasParams) {
  return useQuery({
    queryKey: clavesTelemetria.lecturas(sensorId, params),
    queryFn: () => api.lecturasDeSensor(sensorId, params),
    enabled: sensorId.length > 0,
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  })
}

export function useAlertasPendientes() {
  return useQuery({
    queryKey: clavesTelemetria.alertas,
    queryFn: api.alertasPendientes,
    staleTime: CACHE.TIEMPO_REAL,
    refetchInterval: CACHE.TIEMPO_REAL * 2,
  })
}

export function useRevisarAlerta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.marcarAlertaRevisada(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesTelemetria.alertas })
      // El dashboard cuenta las alertas pendientes.
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
