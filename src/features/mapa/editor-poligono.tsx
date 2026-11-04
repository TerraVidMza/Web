import { useEffect, useMemo, useRef, useState } from "react"
import L from "leaflet"
import { MapContainer, Polygon, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "@geoman-io/leaflet-geoman-free"
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css"
import { PencilRuler, Trash2, X } from "lucide-react"
import type { PoligonoGeoJson } from "@/api/schemas/geo"
import {
  aPosicionesLeaflet,
  areaEnHectareas,
  limitesDe,
  poligonosIguales,
  redondearPoligono,
  type PosicionLeaflet,
} from "@/lib/geo"
import { useFormato } from "@/context/configuracion-context"
import { Button } from "@/components/ui/button"

/** Polígono de solo lectura que se dibuja detrás, para ubicarse (D-037). */
export interface CapaDeContexto {
  id: string
  poligono: PoligonoGeoJson
  tipo: "finca" | "cuartel"
}

interface Props {
  /** Contorno actual. Controlado: lo que cambia el mapa sale por `onChange`. */
  valor: PoligonoGeoJson | null
  onChange: (poligono: PoligonoGeoJson | null) => void
  /** Qué se está dibujando; cambia los textos. */
  entidad: "finca" | "cuartel"
  /** Contorno de la finca y cuarteles vecinos, para dibujar encajando con ellos. */
  contexto?: CapaDeContexto[]
  /** `[latitud, longitud]` con que centrar cuando no hay polígono ni contexto. */
  centroInicial?: PosicionLeaflet | null
}

/** Mendoza: a dónde mirar cuando no hay nada que encuadrar. */
const CENTRO_POR_DEFECTO: PosicionLeaflet = [-33.0, -68.85]

/** El contorno que se está editando. Hex: Leaflet escribe el color como atributo SVG, no admite `var()`. */
const ESTILO_EDICION: L.PathOptions = { color: "#2a78d6", weight: 3, fillOpacity: 0.2 }
const ESTILO_FINCA: L.PathOptions = { color: "#eb6834", weight: 2, dashArray: "6 4", fillOpacity: 0.04 }
const ESTILO_CUARTEL: L.PathOptions = { color: "#898781", weight: 1, fillOpacity: 0.18 }

/** Eventos de Geoman tras los que el contorno pudo haber cambiado. */
const EVENTOS_DE_EDICION = ["pm:edit", "pm:vertexadded", "pm:vertexremoved", "pm:markerdragend"]

/** Metros hasta 1 km (sin decimales); desde ahí, kilómetros con dos decimales. */
function textoDistancia(metros: number): string {
  return metros < 1000
    ? `${Math.round(metros)} m`
    : `${(metros / 1000).toFixed(2).replace(".", ",")} km`
}

/** Lo que Leaflet entrega de una capa dibujada, como el polígono que entiende el backend. */
function poligonoDe(capa: L.Polygon): PoligonoGeoJson {
  const geometria = capa.toGeoJSON().geometry
  return redondearPoligono({ type: "Polygon", coordinates: geometria.coordinates as never })
}

/**
 * Editor del contorno de una finca o un cuartel sobre el mapa (D-037).
 *
 * Leaflet-Geoman dibuja y edita; los botones son propios porque el toolbar de la
 * librería está en inglés y no respeta el diseño. Solo admite **un** polígono:
 * para dibujar de nuevo hay que quitar el actual.
 *
 * **El mapa no es la única vía.** Dibujar exige puntero; quien no pueda usarlo
 * sigue cargando hectáreas, latitud y longitud a mano en el formulario, que es
 * como funcionaba antes y sigue funcionando mientras no haya polígono.
 *
 * No admite polígonos que se cruzan a sí mismos (`allowSelfIntersection`): es la
 * misma regla que aplica el backend, pero acá se evita en el momento de dibujar
 * en vez de rechazarlo al guardar.
 */
export function EditorPoligono({ valor, onChange, entidad, contexto = [], centroInicial }: Props) {
  const formato = useFormato()
  const [mapa, setMapa] = useState<L.Map | null>(null)
  const [dibujando, setDibujando] = useState(false)
  const capa = useRef<L.Polygon | null>(null)
  /** Último contorno que salió del propio mapa: distingue un cambio nuestro de uno de afuera. */
  const emitido = useRef<PoligonoGeoJson | null>(valor)
  const alCambiar = useRef(onChange)
  useEffect(() => {
    alCambiar.current = onChange
  })

  // Encuadre inicial: el contorno, si ya hay; si no, el contexto; si no, el punto.
  const inicio = useMemo(() => {
    const limites = limitesDe([...(valor ? [valor] : []), ...contexto.map((c) => c.poligono)])
    if (limites) return { bounds: limites, boundsOptions: { padding: [30, 30] as [number, number] } }
    return { center: centroInicial ?? CENTRO_POR_DEFECTO, zoom: centroInicial ? 15 : 9 }
    // Solo cuenta el estado al montar: `MapContainer` ignora el cambio de estas props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El diálogo se anima al abrirse: Leaflet mide el contenedor antes de que tenga
  // su tamaño final y deja tiles sin cargar. Se remide cada vez que cambia.
  useEffect(() => {
    if (!mapa) return
    const observador = new ResizeObserver(() => mapa.invalidateSize())
    observador.observe(mapa.getContainer())
    return () => observador.disconnect()
  }, [mapa])

  // Adopta una capa como el contorno editable y avisa cada vez que cambia.
  useEffect(() => {
    if (!mapa) return

    function adoptar(nueva: L.Polygon) {
      capa.current?.remove()
      capa.current = nueva
      nueva.setStyle(ESTILO_EDICION)
      nueva.pm.enable({ allowSelfIntersection: false })
      const emitirCambio = () => {
        emitido.current = poligonoDe(nueva)
        alCambiar.current(emitido.current)
      }
      EVENTOS_DE_EDICION.forEach((evento) => nueva.on(evento, emitirCambio))
      emitirCambio()
    }

    mapa.pm.setLang("es")
    mapa.pm.setGlobalOptions({ allowSelfIntersection: false, pathOptions: ESTILO_EDICION })

    const alCrear = (e: { layer: L.Layer }) => {
      setDibujando(false)
      adoptar(e.layer as L.Polygon)
    }
    // Mientras se dibuja, un cartelito junto al puntero dice cuántos metros hay
    // hasta el último vértice colocado. Al colocar otro, la referencia pasa a ser ese.
    const cartel = L.tooltip({ permanent: true, direction: "right", offset: [14, 0] })
    let ultimoVertice: L.LatLng | null = null
    const medir = (e: L.LeafletMouseEvent) => {
      if (!ultimoVertice) return
      cartel.setContent(textoDistancia(mapa.distance(ultimoVertice, e.latlng)))
      cartel.setLatLng(e.latlng)
      if (!mapa.hasLayer(cartel)) cartel.addTo(mapa)
    }
    const alEmpezar = (e: { workingLayer?: L.Layer }) => {
      setDibujando(true)
      ultimoVertice = null
      e.workingLayer?.on("pm:vertexadded", ((v: { latlng: L.LatLng }) => {
        ultimoVertice = v.latlng
      }) as unknown as L.LeafletEventHandlerFn)
      mapa.on("mousemove", medir)
    }
    const alTerminar = () => {
      setDibujando(false)
      ultimoVertice = null
      mapa.off("mousemove", medir)
      cartel.remove()
    }
    mapa.on("pm:create", alCrear as L.LeafletEventHandlerFn)
    mapa.on("pm:drawstart", alEmpezar as L.LeafletEventHandlerFn)
    mapa.on("pm:drawend", alTerminar)

    return () => {
      mapa.off("pm:create", alCrear as L.LeafletEventHandlerFn)
      mapa.off("pm:drawstart", alEmpezar as L.LeafletEventHandlerFn)
      mapa.off("pm:drawend", alTerminar)
      alTerminar()
      mapa.pm.disableDraw()
      capa.current?.remove()
      capa.current = null
    }
  }, [mapa])

  // Sincroniza con el valor que viene de afuera (el contorno guardado al abrir,
  // o un reset del formulario), sin pisar lo que el propio mapa acaba de emitir.
  useEffect(() => {
    if (!mapa) return
    if (poligonosIguales(valor, emitido.current) && (valor === null) === (capa.current === null)) {
      return
    }
    capa.current?.remove()
    capa.current = null
    emitido.current = valor
    if (!valor) return

    const nueva = L.polygon(aPosicionesLeaflet(valor), ESTILO_EDICION).addTo(mapa)
    capa.current = nueva
    nueva.pm.enable({ allowSelfIntersection: false })
    const emitirCambio = () => {
      emitido.current = poligonoDe(nueva)
      alCambiar.current(emitido.current)
    }
    EVENTOS_DE_EDICION.forEach((evento) => nueva.on(evento, emitirCambio))
  }, [mapa, valor])

  function empezarADibujar() {
    mapa?.pm.enableDraw("Polygon", { allowSelfIntersection: false, pathOptions: ESTILO_EDICION })
  }

  function cancelarDibujo() {
    mapa?.pm.disableDraw()
  }

  function quitar() {
    capa.current?.remove()
    capa.current = null
    emitido.current = null
    onChange(null)
  }

  const hectareas = valor ? areaEnHectareas(valor) : null

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {dibujando ? (
          <Button type="button" variant="outline" size="sm" onClick={cancelarDibujo}>
            <X className="size-4" aria-hidden="true" />
            Cancelar dibujo
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={empezarADibujar}
            disabled={valor !== null || !mapa}
          >
            <PencilRuler className="size-4" aria-hidden="true" />
            Dibujar contorno
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={quitar} disabled={valor === null}>
          <Trash2 className="size-4" aria-hidden="true" />
          Quitar contorno
        </Button>
        {hectareas !== null && (
          <span className="ml-auto text-sm font-medium tabular-nums" aria-live="polite">
            ≈ {formato.hectareas(hectareas)}
          </span>
        )}
      </div>

      <section
        aria-label={`Mapa para dibujar el contorno ${entidad === "finca" ? "de la finca" : "del cuartel"}`}
        className="isolate h-72 w-full overflow-hidden rounded-lg border"
      >
        <MapContainer {...inicio} ref={setMapa} scrollWheelZoom className="size-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {contexto.map((c) => (
            <Polygon
              key={`${c.tipo}-${c.id}`}
              positions={aPosicionesLeaflet(c.poligono)}
              pathOptions={c.tipo === "finca" ? ESTILO_FINCA : ESTILO_CUARTEL}
              // De solo lectura y sin captar clics: tienen que dejar dibujar encima.
              interactive={false}
            />
          ))}
        </MapContainer>
      </section>

      <p className="text-xs text-muted-foreground">
        {dibujando
          ? "Hacé clic en el mapa para marcar cada vértice y cerrá el contorno haciendo clic en el primero."
          : valor
            ? "Arrastrá los puntos para ajustar el contorno; el punto del medio de cada lado agrega uno nuevo, y clic derecho sobre un vértice lo quita."
            : `Dibujá el contorno ${entidad === "finca" ? "de la finca" : "del cuartel"} sobre el mapa, o cargá las medidas a mano más abajo.`}
        {contexto.length > 0 && (
          <>
            {" "}
            {contexto.some((c) => c.tipo === "finca") && "Línea punteada: contorno de la finca. "}
            {contexto.some((c) => c.tipo === "cuartel") && "En gris: otros cuarteles."}
          </>
        )}
      </p>
    </div>
  )
}
