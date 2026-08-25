import { useMemo } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet"
import { Link } from "react-router-dom"
import "leaflet/dist/leaflet.css"
import type { EstadoCuartel } from "@/api/schemas/cuartel"
import { etiquetaEstado } from "@/lib/estados"
import { useFormato } from "@/context/configuracion-context"

export interface PuntoMapa {
  id: string
  nombre: string
  latitud: number
  longitud: number
  tipo: "finca" | "cuartel"
  estado?: EstadoCuartel
  hectareas: number | null
  fincaNombre?: string
  fincaId?: string
}

/**
 * Color del marcador por estado de cosecha (HU-10).
 *
 * Son los mismos tonos que usa `<EstadoBadge>` para los mismos estados, así que
 * el mapa y las tablas no se contradicen. **El color nunca va solo:** cada
 * marcador lleva un tooltip con el nombre y el estado escrito, y hay una
 * referencia al pie.
 */
const COLOR_POR_ESTADO: Record<string, string> = {
  pendiente: "#898781",
  en_cosecha: "#2a78d6",
  cosechado: "#0ca30c",
}

const COLOR_FINCA = "#eb6834"

/** Centro de Mendoza: a dónde mirar cuando no hay ningún punto que encuadrar. */
const CENTRO_POR_DEFECTO: [number, number] = [-33.0, -68.85]

function colorDe(punto: PuntoMapa): string {
  if (punto.tipo === "finca") return COLOR_FINCA
  return COLOR_POR_ESTADO[punto.estado ?? "pendiente"] ?? COLOR_POR_ESTADO.pendiente
}

/**
 * Mapa de fincas y cuarteles (HU-10, decisión D-a).
 *
 * Leaflet con tiles de OpenStreetMap: sin API key, sin cuota y sin tarjeta de
 * crédito, y la historia solo pide marcadores con color por estado y un popup.
 *
 * Se usan `CircleMarker` y no los marcadores por defecto de Leaflet a propósito:
 * los íconos PNG de Leaflet se rompen con los bundlers —la ruta de la imagen se
 * resuelve relativa al CSS y hay que parchearla a mano—, y un círculo SVG además
 * se puede colorear por estado sin generar una imagen por color.
 */
export function MapaFincas({ puntos }: { puntos: PuntoMapa[] }) {
  const formato = useFormato()

  // El encuadre sale de los puntos que hay: centrar en una constante dejaría
  // los marcadores fuera de pantalla en cualquier finca que no sea de Mendoza.
  const limites = useMemo<[[number, number], [number, number]] | null>(() => {
    if (puntos.length === 0) return null
    const lats = puntos.map((p) => p.latitud)
    const lngs = puntos.map((p) => p.longitud)
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ]
  }, [puntos])

  return (
    <div className="space-y-3">
      <div className="h-[28rem] w-full overflow-hidden rounded-lg border">
        <MapContainer
          // `bounds` cuando hay puntos; centro y zoom cuando no hay ninguno.
          {...(limites
            ? { bounds: limites, boundsOptions: { padding: [40, 40] } }
            : { center: CENTRO_POR_DEFECTO, zoom: 8 })}
          scrollWheelZoom={false}
          className="size-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {puntos.map((punto) => (
            <CircleMarker
              key={`${punto.tipo}-${punto.id}`}
              center={[punto.latitud, punto.longitud]}
              radius={punto.tipo === "finca" ? 10 : 7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: colorDe(punto),
                fillOpacity: 0.9,
              }}
            >
              {/* El tooltip lleva el estado escrito: el color del marcador no
                  puede ser la única forma de saber en qué situación está. */}
              <Tooltip direction="top">
                {punto.nombre}
                {punto.estado && ` — ${etiquetaEstado(punto.estado)}`}
              </Tooltip>
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{punto.nombre}</p>
                  {punto.fincaNombre && (
                    <p className="text-muted-foreground">{punto.fincaNombre}</p>
                  )}
                  {punto.estado && <p>{etiquetaEstado(punto.estado)}</p>}
                  <p>{formato.hectareas(punto.hectareas)}</p>
                  {punto.tipo === "cuartel" && punto.fincaId && (
                    <Link
                      to={`/fincas/${punto.fincaId}/cuarteles`}
                      className="text-primary underline"
                    >
                      Ver cuarteles de la finca
                    </Link>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <li className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-full ring-2 ring-background"
            style={{ backgroundColor: COLOR_FINCA }}
            aria-hidden="true"
          />
          Finca
        </li>
        {Object.entries(COLOR_POR_ESTADO).map(([estado, color]) => (
          <li key={estado} className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full ring-2 ring-background"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            {etiquetaEstado(estado)}
          </li>
        ))}
      </ul>
    </div>
  )
}
