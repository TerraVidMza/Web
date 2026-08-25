/**
 * `staleTime` por tipo de dato (F2-5).
 *
 * Sin `staleTime`, React Query considera todo obsoleto al instante y refetchea
 * en cada navegación: volver de Cuarteles a Fincas vuelve a pedir la lista de
 * fincas, que cambia una vez por semana. Los catálogos cambian una vez al mes y
 * las alertas cada minuto — tratarlos igual es gastar en un lado y llegar tarde
 * en el otro.
 */
export const CACHE = {
  /** Catálogos, roles, configuración: se editan a mano y casi nunca. */
  CASI_ESTATICO: 30 * 60 * 1000,
  /** Fincas, cuarteles, usuarios: ABMs de oficina. */
  ESTRUCTURA: 2 * 60 * 1000,
  /** Dashboard y listados operativos. */
  OPERATIVO: 60 * 1000,
  /** Notificaciones y alertas: la campana tiene que estar al día. */
  TIEMPO_REAL: 30 * 1000,
} as const
