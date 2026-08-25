import { useState } from "react"
import { Link } from "react-router-dom"
import { HelpCircle, Info } from "lucide-react"
import { useEstadoCosecha } from "./use-vendimia"
import { useFincas } from "@/features/fincas/use-fincas"
import { useFormato } from "@/context/configuracion-context"
import { EstadoBadge } from "@/components/datos/estado-badge"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Card, CardContent } from "@/components/ui/card"
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function SinDato({ motivo }: { motivo: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground" title={motivo}>
      —
      <HelpCircle className="size-3" aria-hidden="true" />
      <span className="sr-only">{motivo}</span>
    </span>
  )
}

function Resumen({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="text-lg font-semibold tabular-nums">{valor}</p>
      {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
    </div>
  )
}

/**
 * Seguimiento de la vendimia por finca (HU-28).
 *
 * Los kilos se abren por estado del pesaje —liquidados, pendientes de remito y
 * observados— porque son tres situaciones distintas: lo cobrado, lo que falta
 * despachar y lo que un rechazo dejó trabado esperando revisión.
 */
export function CosechaPage() {
  const [fincaId, setFincaId] = useState("")
  const fincas = useFincas()
  const consulta = useEstadoCosecha(fincaId)
  const formato = useFormato()

  const cuarteles = consulta.data?.cuarteles ?? []
  const totales = consulta.data?.totales

  return (
    <div className="space-y-4">
      <div className="w-full space-y-1.5 sm:max-w-xs">
        <Label htmlFor="cosecha-finca">Finca</Label>
        <Select value={fincaId} onValueChange={setFincaId}>
          <SelectTrigger id="cosecha-finca" className="w-full">
            <SelectValue placeholder="Elegí una finca" />
          </SelectTrigger>
          <SelectContent>
            {fincas.data?.map((finca) => (
              <SelectItem key={finca.id} value={finca.id}>
                {finca.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!fincaId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Info className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Elegí una finca para ver su cosecha</p>
            <p className="text-sm text-muted-foreground">
              El seguimiento se arma por finca, cuartel por cuartel.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {totales && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Resumen
                titulo="Kilos cosechados"
                valor={formato.kg(totales.kgTotalesCosechados)}
                detalle={`${formato.kg(totales.kgLiquidados)} ya liquidados`}
              />
              <Resumen
                titulo="Pagado a cuadrillas"
                valor={formato.dinero(totales.montoLiquidadoTotal)}
                detalle="Costo de cosecha, no ingreso"
              />
              <Resumen
                titulo="Cuarteles cosechados"
                valor={String(totales.cuartelesCosechados)}
                detalle={`${totales.cuartelesEnCosecha} en curso`}
              />
              <Resumen
                titulo="Cuarteles pendientes"
                valor={String(totales.cuartelesPendientes)}
                detalle="Todavía sin ningún pesaje"
              />
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              <EstadoConsulta
                consulta={consulta}
                cantidad={cuarteles.length}
                vacio={{
                  titulo: "Esta finca no tiene cuarteles activos",
                  descripcion: "El seguimiento se arma sobre los cuarteles en actividad.",
                }}
              >
                <Table>
                  <TableCaption className="sr-only">
                    Avance de la cosecha por cuartel, con kilos por estado y rendimiento
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cuartel</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Cosechado</TableHead>
                      <TableHead className="text-right">Liquidado</TableHead>
                      <TableHead className="text-right">Sin remito</TableHead>
                      <TableHead className="text-right">Observado</TableHead>
                      <TableHead className="text-right">Rinde kg/ha</TableHead>
                      <TableHead className="text-right">A cuadrillas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuarteles.map((fila) => (
                      <TableRow key={fila.cuartelId}>
                        <TableCell className="font-medium">
                          <Link
                            to={`/cuarteles/${fila.cuartelId}/pesajes`}
                            className="text-primary hover:underline"
                          >
                            {fila.cuartelNombre}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <EstadoBadge estado={fila.estado} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formato.kg(fila.kgTotalesCosechados)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formato.kg(fila.kgLiquidados)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formato.kg(fila.kgPendientesDeRemito)}
                        </TableCell>
                        {/* Los observados vienen de un remito rechazado: no
                            vuelven solos a la cola, hay que revisarlos. */}
                        <TableCell
                          className={`text-right tabular-nums ${fila.kgObservados > 0 ? "text-destructive" : ""}`}
                        >
                          {formato.kg(fila.kgObservados)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fila.rendimientoKgPorHa === null ? (
                            <SinDato motivo="El cuartel no tiene superficie cargada" />
                          ) : (
                            formato.numero(fila.rendimientoKgPorHa, {
                              maximumFractionDigits: 0,
                            })
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formato.dinero(fila.montoLiquidadoTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {totales && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2}>Totales</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formato.kg(totales.kgTotalesCosechados)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formato.kg(totales.kgLiquidados)}
                        </TableCell>
                        <TableCell colSpan={3} />
                        <TableCell className="text-right tabular-nums">
                          {formato.dinero(totales.montoLiquidadoTotal)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </EstadoConsulta>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
