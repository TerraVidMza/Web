import { useMemo, useState } from "react"
import { Info, TriangleAlert } from "lucide-react"
import { useCorrelacion } from "./use-inteligencia"
import { SelectorCuartel } from "./selector-cuartel"
import { useSensores } from "@/features/telemetria/use-telemetria"
import { ETIQUETA_TIPO_SENSOR } from "@/api/schemas/telemetria"
import type { CorrelacionParams } from "@/api/endpoints/inteligencia"
import { useFormato } from "@/context/configuracion-context"
import { GraficoLinea } from "@/components/datos/grafico-linea"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function haceDias(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  return fecha.toISOString().slice(0, 10)
}

/**
 * Correlación entre una variable de sensor y el costo del cuartel (HU-29).
 *
 * Las dos series van en **gráficos separados** que comparten el eje de fechas,
 * no en uno con dos ejes Y: la alineación de dos escalas distintas es
 * arbitraria e inventa una correlación visual que no está en el dato. La
 * correlación real la dice el coeficiente, que calcula el backend.
 */
export function CorrelacionPage() {
  const [fincaId, setFincaId] = useState("")
  const [cuartelId, setCuartelId] = useState("")
  const [sensorId, setSensorId] = useState("")
  const [desde, setDesde] = useState(haceDias(30))
  const [hasta, setHasta] = useState(haceDias(0))
  const formato = useFormato()

  const sensores = useSensores(fincaId)

  // Sin sensor o sin fechas el backend responde 400: no se pide hasta tenerlos.
  const params = useMemo<CorrelacionParams | null>(
    () => (sensorId && desde && hasta ? { sensorId, desde, hasta } : null),
    [sensorId, desde, hasta]
  )

  const consulta = useCorrelacion(cuartelId, params)
  const datos = consulta.data

  return (
    <div className="space-y-4">
      <SelectorCuartel
        fincaId={fincaId}
        cuartelId={cuartelId}
        onFinca={(id) => {
          setFincaId(id)
          setCuartelId("")
          setSensorId("")
        }}
        onCuartel={setCuartelId}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="correlacion-sensor">Sensor</Label>
          <Select value={sensorId} onValueChange={setSensorId} disabled={!fincaId}>
            <SelectTrigger id="correlacion-sensor" className="w-full">
              <SelectValue placeholder="Elegí una finca primero" />
            </SelectTrigger>
            <SelectContent>
              {sensores.data?.map((sensor) => (
                <SelectItem key={sensor.id} value={sensor.id}>
                  {sensor.codigo} — {ETIQUETA_TIPO_SENSOR[sensor.tipo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="correlacion-desde">Desde</Label>
          <Input
            id="correlacion-desde"
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="correlacion-hasta">Hasta</Label>
          <Input
            id="correlacion-hasta"
            type="date"
            value={hasta}
            min={desde}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
      </div>

      {!cuartelId || !sensorId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Info className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Elegí un cuartel y un sensor</p>
            <p className="text-sm text-muted-foreground">
              La correlación cruza lo que midió el sensor con lo que costó trabajar ese
              cuartel, día por día.
            </p>
          </CardContent>
        </Card>
      ) : (
        <EstadoConsulta
          consulta={consulta}
          cantidad={datos ? 1 : 0}
          vacio={{ titulo: "Sin datos para el período" }}
          filasEsqueleto={4}
        >
          {datos && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Coeficiente de correlación de Pearson
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-semibold tabular-nums">
                      {formato.numero(datos.coeficienteCorrelacion, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {datos.interpretacion}
                    </span>
                  </div>

                  {/*
                    El backend emite el mensaje y el umbral; el cliente no los
                    duplica. Con datos insuficientes el coeficiente igual viene,
                    pero presentarlo como veredicto sería el error: parecería un
                    juicio agronómico sobre el cuartel cuando en realidad falta
                    período.
                  */}
                  {!datos.datosSuficientes && datos.mensaje && (
                    <output className="flex items-start gap-2 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      {datos.mensaje}
                    </output>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {datos.diasConDatosEnComun} de {datos.diasRequeridos} días necesarios con
                    dato en las dos series.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Las dos series, día por día
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <GraficoLinea
                    puntos={datos.serieSensor}
                    titulo={`${datos.sensor.codigo} — ${ETIQUETA_TIPO_SENSOR[datos.sensor.tipo]}`}
                    tono="serie1"
                  />
                  <GraficoLinea
                    puntos={datos.serieCosto}
                    titulo="Costo diario del cuartel"
                    tono="serie2"
                    formatoValor="dinero"
                  />
                  <p className="text-xs text-muted-foreground">
                    Van en gráficos separados a propósito: son magnitudes de escalas
                    distintas, y superponerlas en un eje común inventaría una relación
                    visual que el dato no respalda. La relación real es el coeficiente de
                    arriba.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </EstadoConsulta>
      )}
    </div>
  )
}
