import { useMemo, useState } from "react"
import { ArrowDown, ArrowRight, ArrowUp, HelpCircle, Info, TriangleAlert } from "lucide-react"
import { useCampanias, useComparacion } from "./use-inteligencia"
import { SelectorCuartel } from "./selector-cuartel"
import {
  INDICADORES_COMPARABLES,
  type ClaveIndicador,
  type Comparacion,
  type IndicadoresPeriodo,
} from "@/api/schemas/inteligencia"
import { ETIQUETA_TIPO_SENSOR } from "@/api/schemas/telemetria"
import type { CompararParams } from "@/api/endpoints/inteligencia"
import { useFormato } from "@/context/configuracion-context"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
import { cn } from "@/lib/utils"

function SinDato({ motivo }: { motivo: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground" title={motivo}>
      —
      <HelpCircle className="size-3" aria-hidden="true" />
      <span className="sr-only">{motivo}</span>
    </span>
  )
}

/**
 * Variación entre los dos períodos.
 *
 * El color lo decide `sentidoIndicadores`, que viene del backend: un costo que
 * sube es malo y unos kilos que suben son buenos, y eso no se puede inferir del
 * signo. La flecha acompaña al color para que el sentido no dependa del color
 * solo.
 */
function Variacion({
  valor,
  sentido,
}: {
  valor: number | null
  sentido: "mayor_es_mejor" | "menor_es_mejor" | undefined
}) {
  const formato = useFormato()

  if (valor === null) {
    return <SinDato motivo="No se puede comparar: falta el dato en alguno de los dos períodos" />
  }

  const sinCambio = Math.abs(valor) < 0.05
  const mejora = sentido === "menor_es_mejor" ? valor < 0 : valor > 0
  const Icono = sinCambio ? ArrowRight : valor > 0 ? ArrowUp : ArrowDown

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        sinCambio
          ? "text-muted-foreground"
          : mejora
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-destructive"
      )}
    >
      <Icono className="size-3.5" aria-hidden="true" />
      {valor > 0 ? "+" : ""}
      {formato.numero(valor, { maximumFractionDigits: 1 })}%
      <span className="sr-only">
        {sinCambio ? ", sin cambio" : mejora ? ", mejora" : ", empeora"}
      </span>
    </span>
  )
}

function nombrePeriodo(periodo: IndicadoresPeriodo, formato: ReturnType<typeof useFormato>) {
  if (periodo.nombre) return periodo.nombre
  return `${formato.fecha(periodo.desde)} – ${formato.fecha(periodo.hasta)}`
}

function valorFormateado(
  periodo: IndicadoresPeriodo,
  clave: ClaveIndicador,
  tipo: "kg" | "dinero",
  formato: ReturnType<typeof useFormato>
) {
  const valor = periodo[clave]
  if (valor === null) {
    return (
      <SinDato
        motivo={
          clave === "costoPorHa"
            ? "El cuartel no tiene superficie cargada"
            : "Sin liquidaciones de bodega en el período"
        }
      />
    )
  }
  return tipo === "kg" ? formato.kg(valor) : formato.dinero(valor)
}

function TablaIot({ comparacion }: { comparacion: Comparacion }) {
  const formato = useFormato()
  const variables = [
    ...new Set([
      ...Object.keys(comparacion.periodo1.promediosIot),
      ...Object.keys(comparacion.periodo2.promediosIot),
    ]),
  ].sort()

  if (variables.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Condiciones medidas en cada período</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableCaption className="sr-only">
            Promedios de telemetría por variable en cada período
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Variable</TableHead>
              <TableHead className="text-right">
                {nombrePeriodo(comparacion.periodo1, formato)}
              </TableHead>
              <TableHead className="text-right">
                {nombrePeriodo(comparacion.periodo2, formato)}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable) => {
              const a = comparacion.periodo1.promediosIot[variable]
              const b = comparacion.periodo2.promediosIot[variable]
              const agregacion = a?.agregacion ?? b?.agregacion
              return (
                <TableRow key={variable}>
                  <TableCell>
                    <span>{ETIQUETA_TIPO_SENSOR[variable] ?? variable}</span>
                    {/* La lluvia se suma y el resto se promedia: los milímetros
                        son un acumulado del período, y promediarlos daría "mm
                        por lectura", que no significa nada. */}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {agregacion === "total" ? "acumulado" : "promedio"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a ? formato.numero(a.valor, { maximumFractionDigits: 2 }) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {b ? formato.numero(b.valor, { maximumFractionDigits: 2 }) : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/**
 * Comparación de un cuartel entre dos campañas (HU-31).
 *
 * Es una **tabla y no un gráfico** a propósito: son siete indicadores de
 * unidades distintas —kilos, pesos, pesos por hectárea— comparados entre dos
 * períodos. Un gráfico de barras agrupadas obligaría a normalizarlos o a poner
 * varias escalas, y lo que el productor lee es la variación porcentual, que es
 * un número.
 */
export function ComparacionPage() {
  const [fincaId, setFincaId] = useState("")
  const [cuartelId, setCuartelId] = useState("")
  const [campaniaA, setCampaniaA] = useState("")
  const [campaniaB, setCampaniaB] = useState("")
  const campanias = useCampanias()
  const formato = useFormato()

  const params = useMemo<CompararParams | null>(
    () => (campaniaA && campaniaB ? { campaniaA, campaniaB } : null),
    [campaniaA, campaniaB]
  )

  const consulta = useComparacion(cuartelId, params)
  const datos = consulta.data

  return (
    <div className="space-y-4">
      <SelectorCuartel
        fincaId={fincaId}
        cuartelId={cuartelId}
        onFinca={(id) => {
          setFincaId(id)
          setCuartelId("")
        }}
        onCuartel={setCuartelId}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="campania-a">Campaña A</Label>
          <Select value={campaniaA} onValueChange={setCampaniaA}>
            <SelectTrigger id="campania-a" className="w-full">
              <SelectValue placeholder="Elegí una campaña" />
            </SelectTrigger>
            <SelectContent>
              {campanias.data?.map((campania) => (
                <SelectItem key={campania.id} value={campania.id}>
                  {campania.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campania-b">Campaña B</Label>
          <Select value={campaniaB} onValueChange={setCampaniaB}>
            <SelectTrigger id="campania-b" className="w-full">
              <SelectValue placeholder="Elegí una campaña" />
            </SelectTrigger>
            <SelectContent>
              {campanias.data?.map((campania) => (
                <SelectItem key={campania.id} value={campania.id}>
                  {campania.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {campanias.data?.length === 0 && (
        <output className="block rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Todavía no hay campañas cargadas. Cargalas en la pestaña Campañas para poder
          comparar.
        </output>
      )}

      {!cuartelId || !params ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Info className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Elegí un cuartel y dos campañas</p>
            <p className="text-sm text-muted-foreground">
              Se comparan kilos, costos, ingresos y las condiciones que midieron los
              sensores.
            </p>
          </CardContent>
        </Card>
      ) : (
        <EstadoConsulta
          consulta={consulta}
          cantidad={datos ? 1 : 0}
          vacio={{ titulo: "Sin datos para comparar" }}
          filasEsqueleto={5}
        >
          {datos && (
            <div className="space-y-4">
              {datos.mensaje && (
                <output className="flex items-start gap-2 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {datos.mensaje}
                </output>
              )}

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableCaption className="sr-only">
                      Indicadores del cuartel en cada período y su variación porcentual
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indicador</TableHead>
                        <TableHead className="text-right">
                          {nombrePeriodo(datos.periodo1, formato)}
                        </TableHead>
                        <TableHead className="text-right">
                          {nombrePeriodo(datos.periodo2, formato)}
                        </TableHead>
                        <TableHead className="text-right">Variación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {INDICADORES_COMPARABLES.map((indicador) => (
                        <TableRow key={indicador.clave}>
                          <TableCell className="font-medium">{indicador.etiqueta}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {valorFormateado(
                              datos.periodo1,
                              indicador.clave,
                              indicador.formato,
                              formato
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {valorFormateado(
                              datos.periodo2,
                              indicador.clave,
                              indicador.formato,
                              formato
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Variacion
                              valor={datos.variaciones[indicador.clave]}
                              sentido={datos.sentidoIndicadores[indicador.clave]}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <TablaIot comparacion={datos} />

              <p className="text-xs text-muted-foreground">
                Si una variación mejora o empeora lo decide el backend con
                <code className="mx-1">sentidoIndicadores</code>: un costo que sube es malo y
                unos kilos que suben son buenos, y eso no se deduce del signo.
              </p>
            </div>
          )}
        </EstadoConsulta>
      )}
    </div>
  )
}
