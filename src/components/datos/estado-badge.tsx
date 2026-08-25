import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Tono = "neutro" | "info" | "exito" | "alerta" | "peligro"

const CLASES_POR_TONO: Record<Tono, string> = {
  neutro: "bg-muted text-muted-foreground border-transparent",
  info: "bg-sky-100 text-sky-900 border-transparent dark:bg-sky-950 dark:text-sky-200",
  exito: "bg-emerald-100 text-emerald-900 border-transparent dark:bg-emerald-950 dark:text-emerald-200",
  alerta: "bg-amber-100 text-amber-900 border-transparent dark:bg-amber-950 dark:text-amber-200",
  peligro: "bg-red-100 text-red-900 border-transparent dark:bg-red-950 dark:text-red-200",
}

/**
 * Etiquetas de todos los estados del backend, en castellano.
 *
 * Sin esta tabla `estado: "en_cosecha"` llegaba crudo a la pantalla. Están
 * todos juntos —y no repartidos por módulo— porque la lista completa es la que
 * permite ver de un vistazo si falta traducir alguno cuando el backend agrega
 * un estado nuevo.
 */
const ESTADOS: Record<string, { etiqueta: string; tono: Tono }> = {
  // EstadoCuartel (HU-09, HU-28)
  pendiente: { etiqueta: "Pendiente", tono: "neutro" },
  en_cosecha: { etiqueta: "En cosecha", tono: "info" },
  cosechado: { etiqueta: "Cosechado", tono: "exito" },

  // EstadoRemito (HU-27)
  borrador: { etiqueta: "Borrador", tono: "alerta" },
  aprobado: { etiqueta: "Aprobado", tono: "exito" },
  rechazado: { etiqueta: "Rechazado", tono: "peligro" },

  // EstadoPesaje (HU-26)
  pendiente_remito: { etiqueta: "Pendiente de remito", tono: "alerta" },
  en_remito: { etiqueta: "En remito", tono: "info" },
  liquidado: { etiqueta: "Liquidado", tono: "exito" },
  observado: { etiqueta: "Observado", tono: "peligro" },

  // EstadoSync (HU-24)
  sincronizado: { etiqueta: "Sincronizado", tono: "exito" },
  error: { etiqueta: "Error de sincronización", tono: "peligro" },

  // EstadoAlerta (HU-22)
  revisada: { etiqueta: "Revisada", tono: "exito" },

  // EstadoRecomendacion (HU-30)
  activa: { etiqueta: "Activa", tono: "info" },
  aplicada: { etiqueta: "Aplicada", tono: "exito" },
  descartada: { etiqueta: "Descartada", tono: "neutro" },
}

export function EstadoBadge({ estado, className }: { estado: string; className?: string }) {
  const conocido = ESTADOS[estado]
  // Un estado que el backend agregue y esta tabla no conozca se muestra tal
  // cual en vez de desaparecer: es feo, y avisa.
  const etiqueta = conocido?.etiqueta ?? estado
  const tono = conocido?.tono ?? "neutro"

  return (
    <Badge variant="outline" className={cn(CLASES_POR_TONO[tono], className)}>
      {etiqueta}
    </Badge>
  )
}

/** Activo / Inactivo, que es un booleano y no un enum, pero se lee igual. */
export function ActivoBadge({
  activo,
  etiquetas = ["Activo", "Inactivo"],
}: {
  activo: boolean
  etiquetas?: [string, string]
}) {
  return (
    <Badge
      variant="outline"
      className={cn(activo ? CLASES_POR_TONO.exito : CLASES_POR_TONO.neutro)}
    >
      {activo ? etiquetas[0] : etiquetas[1]}
    </Badge>
  )
}
