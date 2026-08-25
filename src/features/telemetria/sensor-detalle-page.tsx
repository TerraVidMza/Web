import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, LineChart, Table2 } from "lucide-react"
import { useSensor, useSerie, useUmbral } from "./use-telemetria"
import { UmbralDialog } from "./umbral-dialog"
import { ETIQUETA_TIPO_SENSOR, type Granularidad } from "@/api/schemas/telemetria"
import type { SerieParams } from "@/api/endpoints/telemetria"
import { useFormato } from "@/context/configuracion-context"
import { GraficoSerie } from "@/components/datos/grafico-serie"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/** Hace N días, en `YYYY-MM-DD`. */
function haceDias(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  return fecha.toISOString().slice(0, 10)
}

const RANGOS = [
  { dias: 7, etiqueta: "7 días", granularidad: "hora" as Granularidad },
  { dias: 30, etiqueta: "30 días", granularidad: "dia" as Granularidad },
  { dias: 90, etiqueta: "90 días", granularidad: "dia" as Granularidad },
]

/**
 * Serie de un sensor y sus umbrales (HU-20, HU-21).
 *
 * El gráfico viene con una **vista de tabla** al lado, no como un extra: es el
 * relevo de accesibilidad para quien no puede leer la forma —y de paso es lo
 * que se copia y pega cuando alguien quiere los números.
 */
export function SensorDetallePage() {
  const { sensorId } = useParams<{ sensorId: string }>()
  const [rango, setRango] = useState(RANGOS[0])
  const [vista, setVista] = useState<"grafico" | "tabla">("grafico")
  const formato = useFormato()

  const sensor = useSensor(sensorId ?? "")
  const umbral = useUmbral(sensorId ?? "")

  const params = useMemo<SerieParams>(
    () => ({ desde: haceDias(rango.dias), granularidad: rango.granularidad }),
    [rango]
  )
  const serie = useSerie(sensorId ?? "", params)

  const puntos = serie.data?.puntos ?? []
  const unidad = sensor.data?.ultimaLectura?.unidad ?? ""

  return (
    <div className="space-y-6">
      <Link
        to="/telemetria"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a sensores
      </Link>

      <EstadoConsulta
        consulta={sensor}
        cantidad={sensor.data ? 1 : 0}
        vacio={{ titulo: "No se encontró el sensor" }}
        filasEsqueleto={3}
      >
        {sensor.data && (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold">{sensor.data.codigo}</h1>
                <p className="text-sm text-muted-foreground">
                  {ETIQUETA_TIPO_SENSOR[sensor.data.tipo]}
                  {sensor.data.descripcion && ` · ${sensor.data.descripcion}`}
                </p>
              </div>
              <UmbralDialog sensor={sensor.data} />
            </div>

            <Card>
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Una sola serie: el título la nombra y no hace falta caja
                      de leyenda. Los umbrales sí van etiquetados en el gráfico,
                      porque un color de estado no puede significar solo. */}
                  <CardTitle className="text-base">
                    {ETIQUETA_TIPO_SENSOR[sensor.data.tipo]} — promedio por{" "}
                    {rango.granularidad === "hora" ? "hora" : "día"}
                  </CardTitle>

                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="rango-serie" className="sr-only">
                      Período
                    </Label>
                    <Select
                      value={String(rango.dias)}
                      onValueChange={(v) =>
                        setRango(RANGOS.find((r) => String(r.dias) === v) ?? RANGOS[0])
                      }
                    >
                      <SelectTrigger id="rango-serie" size="sm" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RANGOS.map((opcion) => (
                          <SelectItem key={opcion.dias} value={String(opcion.dias)}>
                            {opcion.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Tabs
                      value={vista}
                      onValueChange={(v) => setVista(v as "grafico" | "tabla")}
                    >
                      <TabsList>
                        <TabsTrigger value="grafico">
                          <LineChart className="size-4" aria-hidden="true" />
                          Gráfico
                        </TabsTrigger>
                        <TabsTrigger value="tabla">
                          <Table2 className="size-4" aria-hidden="true" />
                          Tabla
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                {umbral.data && (
                  <p className="text-sm text-muted-foreground">
                    Alerta fuera de{" "}
                    {umbral.data.umbralMinimo ?? "−∞"} – {umbral.data.umbralMaximo ?? "+∞"}{" "}
                    {unidad}
                  </p>
                )}
              </CardHeader>

              <CardContent className={vista === "tabla" ? "p-0" : undefined}>
                <EstadoConsulta
                  consulta={serie}
                  cantidad={puntos.length}
                  vacio={{
                    titulo: "Sin lecturas en el período",
                    descripcion:
                      "El nodo no reportó nada en este rango, o todavía no está enviando.",
                  }}
                  filasEsqueleto={4}
                >
                  {vista === "grafico" ? (
                    <GraficoSerie
                      puntos={puntos}
                      unidad={unidad}
                      umbralMinimo={umbral.data?.umbralMinimo ?? null}
                      umbralMaximo={umbral.data?.umbralMaximo ?? null}
                      granularidad={serie.data?.granularidad ?? "dia"}
                    />
                  ) : (
                    <Table>
                      <TableCaption className="sr-only">
                        Serie agregada del sensor: promedio, mínimo y máximo por período
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Período</TableHead>
                          <TableHead className="text-right">Promedio</TableHead>
                          <TableHead className="text-right">Mínimo</TableHead>
                          <TableHead className="text-right">Máximo</TableHead>
                          <TableHead className="text-right">Lecturas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {puntos.map((punto) => (
                          <TableRow key={punto.periodo}>
                            <TableCell className="whitespace-nowrap">
                              {serie.data?.granularidad === "hora"
                                ? formato.fechaHora(punto.periodo)
                                : formato.fecha(punto.periodo)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formato.numero(punto.promedio, { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formato.numero(punto.minimo, { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formato.numero(punto.maximo, { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {punto.lecturas}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </EstadoConsulta>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              Cada punto es el agregado de un período completo, calculado en la zona horaria
              de la empresa ({serie.data?.zonaHoraria}). La banda del gráfico va del mínimo al
              máximo: el promedio solo escondería las oscilaciones.
            </p>
          </>
        )}
      </EstadoConsulta>
    </div>
  )
}
