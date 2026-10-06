import { MapPin } from "lucide-react"

/**
 * Dónde se registró una labor o un pesaje (D-027 del backend, W-028).
 *
 * El teléfono la manda solo si tenía GPS y permiso: sin coordenadas se
 * muestra un guion. El enlace abre OpenStreetMap, que es el mismo proveedor de
 * tiles que usa el mapa de fincas.
 */
export function Ubicacion({
  latitud,
  longitud,
}: {
  latitud: number | null | undefined
  longitud: number | null | undefined
}) {
  if (latitud == null || longitud == null) {
    return <span className="text-muted-foreground">—</span>
  }
  const href = `https://www.openstreetmap.org/?mlat=${latitud}&mlon=${longitud}#map=17/${latitud}/${longitud}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      <MapPin className="size-3.5" aria-hidden="true" />
      Ver
      <span className="sr-only">
        {" "}
        ubicación ({latitud}, {longitud}) en el mapa
      </span>
    </a>
  )
}
