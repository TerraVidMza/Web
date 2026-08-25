import { createContext, use, useMemo, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { listarConfiguracion } from "@/api/endpoints/configuracion"
import { puede } from "@/auth/permisos"
import { useAuth } from "./auth-context"
import {
  PREFERENCIAS_POR_DEFECTO,
  formatearFecha,
  formatearFechaHora,
  formatearHectareas,
  formatearKg,
  formatearMoneda,
  formatearNumero,
  type PreferenciasFormato,
} from "@/lib/format"

interface ConfiguracionContextValue extends PreferenciasFormato {
  nombreOrganizacion: string | null
  numero: (v: number | null | undefined, o?: Intl.NumberFormatOptions) => string
  dinero: (v: number | null | undefined) => string
  kg: (v: number | null | undefined) => string
  hectareas: (v: number | null | undefined) => string
  fecha: (v: string | Date | null | undefined) => string
  fechaHora: (v: string | Date | null | undefined) => string
}

const ConfiguracionContext = createContext<ConfiguracionContextValue | null>(null)

/**
 * Preferencias de la empresa (HU-33), con fallback a `es-AR`/`ARS`.
 *
 * **`GET /configuracion` es `@Roles(PROPIETARIO)`**, así que un Agrónomo o un
 * Capataz nunca la reciben: para ellos la consulta ni se lanza y se usan los
 * valores por defecto. Es una limitación real del contrato actual —lo correcto
 * sería que el backend expusiera el subconjunto no sensible a cualquier rol— y
 * queda anotada acá para que no se descubra como un bug de formato.
 */
export function ConfiguracionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const habilitada = puede(user?.rol, "configuracion")

  const { data } = useQuery({
    queryKey: ["configuracion"],
    queryFn: listarConfiguracion,
    enabled: habilitada,
    // Cambia una vez cada varios meses: refetchearla en cada navegación es
    // gastar una request por pantalla para leer lo mismo.
    staleTime: 30 * 60 * 1000,
  })

  const value = useMemo<ConfiguracionContextValue>(() => {
    const porClave = new Map(data?.map((c) => [c.clave, c.valor]))
    const prefs: PreferenciasFormato = {
      locale: PREFERENCIAS_POR_DEFECTO.locale,
      moneda: porClave.get("moneda") || PREFERENCIAS_POR_DEFECTO.moneda,
      unidades: porClave.get("unidades") || PREFERENCIAS_POR_DEFECTO.unidades,
      zonaHoraria: porClave.get("zona_horaria") || PREFERENCIAS_POR_DEFECTO.zonaHoraria,
    }

    return {
      ...prefs,
      nombreOrganizacion: porClave.get("nombre_organizacion") ?? null,
      numero: (v, o) => formatearNumero(v, prefs, o),
      dinero: (v) => formatearMoneda(v, prefs),
      kg: (v) => formatearKg(v, prefs),
      hectareas: (v) => formatearHectareas(v, prefs),
      fecha: (v) => formatearFecha(v, prefs),
      fechaHora: (v) => formatearFechaHora(v, prefs),
    }
  }, [data])

  return <ConfiguracionContext value={value}>{children}</ConfiguracionContext>
}

/** Formateadores ya atados a las preferencias de la empresa. */
export function useFormato(): ConfiguracionContextValue {
  const context = use(ConfiguracionContext)
  if (!context) {
    throw new Error("useFormato debe usarse dentro de un ConfiguracionProvider")
  }
  return context
}
