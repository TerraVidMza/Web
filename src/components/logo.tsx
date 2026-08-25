import logoOscuro from "@/assets/logo.svg"
import logoClaro from "@/assets/logo-light.svg"
import { cn } from "@/lib/utils"

/**
 * Logo de marca (racimo TerraVid).
 *
 * Son dos archivos, no un SVG con `currentColor`: se referencian con `<img>`
 * (más simple que inlinear el SVG en el DOM para esto), y `<img>` no hereda
 * el `color` del CSS. `variante="claro"` es para fondos oscuros (sidebar),
 * `variante="oscuro"` (default) para fondos claros (login, header).
 */
export function Logo({
  className,
  variante = "oscuro",
}: {
  className?: string
  variante?: "oscuro" | "claro"
}) {
  const src = variante === "claro" ? logoClaro : logoOscuro
  return <img src={src} alt="TerraVid" className={cn("object-contain", className)} />
}
