import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  anularLabor,
  corregirLabor,
  historialDeLabores,
  type HistorialLaboresParams,
} from "@/api/endpoints/operaciones";
import { CACHE } from "@/lib/cache";

export function useHistorialDeLabores(
  cuartelId: string,
  params: HistorialLaboresParams,
) {
  return useQuery({
    queryKey: ["registro-labor", cuartelId, params],
    queryFn: () => historialDeLabores(cuartelId, params),
    enabled: cuartelId.length > 0,
    staleTime: CACHE.OPERATIVO,
    placeholderData: keepPreviousData,
  });
}

/** Corregir o anular una labor mueve el costeo, el margen y el dashboard. */
function useInvalidarCostos() {
  const queryClient = useQueryClient();
  return () => {
    for (const clave of [
      ["registro-labor"],
      ["costeo"],
      ["dashboard"],
      ["margen-bruto"],
    ]) {
      void queryClient.invalidateQueries({ queryKey: clave });
    }
  };
}

export function useCorregirLabor() {
  const invalidar = useInvalidarCostos();
  return useMutation({
    mutationFn: ({ id, cantidad }: { id: string; cantidad: number }) =>
      corregirLabor(id, cantidad),
    onSuccess: invalidar,
  });
}

export function useAnularLabor() {
  const invalidar = useInvalidarCostos();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      anularLabor(id, motivo),
    onSuccess: invalidar,
  });
}
