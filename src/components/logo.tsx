import logoOscuro from "@/assets/logo.svg"
import logoClaro from "@/assets/logo-light.svg"
import { cn } from "@/lib/utils"

/**
 * Logo de marca (racimo TerraVid).
 *
 * Son dos archivos, no un SVG con `currentColor`: se referencian con `<img>`
 * (más simple que inlinear el SVG en el DOM para esto), y `<img>` no hereda
 * el `color` del CSS. `variante="auto"` (default) muestra el logo oscuro en
 * fondos claros y el claro en fondos oscuros, siguiendo el tema activo
 * (`.dark`) — sirve para login/header, cuyo fondo cambia con el tema.
 * `variante="claro"` fuerza el logo claro para fondos siempre oscuros
 * (sidebar, drawer mobile), que no cambian con el tema.
 */
export function Logo({
  className,
  variante = "auto",
}: {
  className?: string
  variante?: "auto" | "oscuro" | "claro"
}) {
  if (variante === "auto") {
    return (
      <>
        <img
          src={logoOscuro}
          alt="TerraVid"
          className={cn("justify-self-center object-contain dark:hidden", className)}
        />
        <img
          src={logoClaro}
          alt="TerraVid"
          className={cn("hidden justify-self-center object-contain dark:block", className)}
        />
      </>
    )
  }
  const src = variante === "claro" ? logoClaro : logoOscuro
  return (
    <img
      src={src}
      alt="TerraVid"
      className={cn("justify-self-center object-contain", className)}
    />
  )
}
