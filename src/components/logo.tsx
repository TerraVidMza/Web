import racimo from "@/assets/racimo.png"
import { cn } from "@/lib/utils"

/**
 * Logo de marca: el racimo TerraVid, sin texto.
 *
 * Es una imagen a color con fondo transparente que se ve igual sobre fondos
 * claros y oscuros, así que ya no hay variantes por tema. `variante` se
 * conserva para no tocar a quienes ya la pasan.
 */
export function Logo({
  className,
}: {
  className?: string
  /** @deprecated El racimo no cambia con el fondo. */
  variante?: "auto" | "oscuro" | "claro"
}) {
  return (
    <img
      src={racimo}
      alt="TerraVid"
      className={cn("justify-self-center object-contain", className)}
    />
  )
}
