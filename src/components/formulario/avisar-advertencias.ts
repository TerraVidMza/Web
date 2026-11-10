import { toast } from "sonner"

/**
 * Muestra las advertencias que el backend adjunta a una respuesta exitosa
 * (D-037: por ejemplo, un cuartel que queda fuera de su finca). No son errores:
 * lo guardado quedó guardado, pero la persona tiene que enterarse.
 */
export function avisarAdvertencias(resultado: { advertencias?: string[] } | undefined) {
  resultado?.advertencias?.forEach((mensaje) => toast.warning(mensaje, { duration: 10_000 }))
}
