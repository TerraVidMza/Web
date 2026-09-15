import { Suspense, lazy, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { MapPinOff } from "lucide-react"
import { useFincas } from "@/features/fincas/use-fincas"
import { useCuartelesDeFinca } from "@/features/cuarteles/use-cuarteles"
import type { PuntoMapa } from "./mapa-fincas"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Leaflet se carga aparte del resto de la pantalla.
 *
 * Son ~150 kB que solo hacen falta cuando efectivamente hay algo que dibujar, y
 * la librería toca `window` al importarse: diferirla mantiene el módulo fuera
 * del chunk de la ruta y del entorno de los tests que no la ejercitan.
 */
const MapaFincas = lazy(() =>
  import("./mapa-fincas").then((m) => ({ default: m.MapaFincas }))
)

const TODAS = "todas"

export function MapaPage() {
  const [fincaId, setFincaId] = useState(TODAS)
  const fincas = useFincas()
  // Los cuarteles se piden por finca; sin una elegida se muestran las fincas.
  const cuarteles = useCuartelesDeFinca(fincaId !== TODAS ? fincaId : "")

  const puntos = useMemo<PuntoMapa[]>(() => {
    if (fincaId === TODAS) {
      return (fincas.data ?? [])
        .filter((f) => f.latitud !== null && f.longitud !== null)
        .map((f) => ({
          id: f.id,
          nombre: f.nombre,
          latitud: f.latitud as number,
          longitud: f.longitud as number,
          tipo: "finca" as const,
          hectareas: f.hectareas,
        }))
    }
    const finca = fincas.data?.find((f) => f.id === fincaId)
    return (cuarteles.data ?? [])
      .filter((c) => c.latitud !== null && c.longitud !== null)
      .map((c) => ({
        id: c.id,
        nombre: c.nombre,
        latitud: c.latitud as number,
        longitud: c.longitud as number,
        tipo: "cuartel" as const,
        estado: c.estado,
        hectareas: c.hectareas,
        fincaNombre: finca?.nombre,
        fincaId: c.fincaId,
      }))
  }, [fincaId, fincas.data, cuarteles.data])

  const consulta = fincaId === TODAS ? fincas : cuarteles
  const total =
    fincaId === TODAS ? (fincas.data?.length ?? 0) : (cuarteles.data?.length ?? 0)
  const sinCoordenadas = total - puntos.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mapa</h1>
        <p className="text-sm text-muted-foreground">
          Dónde está cada finca y, dentro de una, cómo viene la cosecha de sus cuarteles.
        </p>
      </div>

      <div className="w-full space-y-1.5 sm:max-w-xs">
        <Label htmlFor="mapa-finca">Ver</Label>
        <Select value={fincaId} onValueChange={setFincaId}>
          <SelectTrigger id="mapa-finca" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas las fincas</SelectItem>
            {fincas.data?.map((finca) => (
              <SelectItem key={finca.id} value={finca.id}>
                Cuarteles de {finca.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <EstadoConsulta
        consulta={consulta}
        cantidad={total}
        vacio={{
          titulo:
            fincaId === TODAS
              ? "Todavía no hay fincas cargadas"
              : "Esta finca no tiene cuarteles",
        }}
        filasEsqueleto={4}
      >
        {puntos.length === 0 ? (
          /*
           * El caso que hoy es el normal, no la excepción: en el seed todas las
           * latitudes y longitudes son `null`. Un mapa vacío sin explicación se
           * lee como que el mapa está roto; decirlo —y decir dónde se cargan—
           * lo convierte en una tarea pendiente concreta.
           */
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
              <MapPinOff className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">
                {fincaId === TODAS
                  ? "Ninguna finca tiene coordenadas cargadas"
                  : "Ningún cuartel de esta finca tiene coordenadas"}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                La latitud y la longitud son opcionales al crear{" "}
                {fincaId === TODAS ? "una finca" : "un cuartel"}, y sin ellas no hay dónde
                poner el marcador. Se cargan{" "}
                <Link
                  to={fincaId === TODAS ? "/fincas" : `/fincas/${fincaId}/cuarteles`}
                  className="text-primary hover:underline"
                >
                  editando {fincaId === TODAS ? "la finca" : "el cuartel"}
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <Suspense fallback={<Skeleton className="h-[28rem] w-full rounded-lg" />}>
              <MapaFincas puntos={puntos} />
            </Suspense>

            {sinCoordenadas > 0 && (
              <p className="text-xs text-muted-foreground">
                {sinCoordenadas} sin coordenadas cargadas, así que no aparecen en el mapa.
              </p>
            )}
          </div>
        )}
      </EstadoConsulta>
    </div>
  )
}
