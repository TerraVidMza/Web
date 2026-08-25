import { Badge } from "@/components/ui/badge"
import { etiquetaEstado, tonoEstado, type TonoEstado } from "@/lib/estados"
import { cn } from "@/lib/utils"

const CLASES_POR_TONO: Record<TonoEstado, string> = {
  neutro: "bg-muted text-muted-foreground border-transparent",
  info: "bg-sky-100 text-sky-900 border-transparent dark:bg-sky-950 dark:text-sky-200",
  exito: "bg-emerald-100 text-emerald-900 border-transparent dark:bg-emerald-950 dark:text-emerald-200",
  alerta: "bg-amber-100 text-amber-900 border-transparent dark:bg-amber-950 dark:text-amber-200",
  peligro: "bg-red-100 text-red-900 border-transparent dark:bg-red-950 dark:text-red-200",
}

/** Insignia de un estado del backend, con su etiqueta en castellano. */
export function EstadoBadge({ estado, className }: { estado: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(CLASES_POR_TONO[tonoEstado(estado)], className)}>
      {etiquetaEstado(estado)}
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
