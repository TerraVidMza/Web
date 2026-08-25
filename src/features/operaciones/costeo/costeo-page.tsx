import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { HelpCircle, X } from "lucide-react"
import { useCosteo } from "./use-costeo"
import { useFincas } from "@/features/fincas/use-fincas"
import type { CosteoParams } from "@/api/endpoints/operaciones"
import { useFormato } from "@/context/configuracion-context"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { cn } from "@/lib/utils"

const TODAS = "todas"

const FILTROS_VACIOS = { fincaId: TODAS, desde: "", hasta: "" }

/**
 * Un valor que el backend devuelve como `null` **a propósito**.
 *
 * `costoPorHa` es `null` cuando el cuartel no tiene superficie cargada, y
 * `margenBruto` cuando no hay ninguna liquidación de bodega. Mostrar `$ 0` en
 * su lugar diría "no cuesta nada por hectárea" y "no ganó nada", que son
 * afirmaciones distintas de "todavía no se sabe" — y en una tabla de costos esa
 * diferencia es la que decide si alguien sale a buscar el dato o no.
 */
function Desconocido({ motivo }: { motivo: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground" title={motivo}>
      —
      <HelpCircle className="size-3" aria-hidden="true" />
      <span className="sr-only">{motivo}</span>
    </span>
  )
}

export function CosteoPage() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const fincas = useFincas()
  const formato = useFormato()

  const params = useMemo<CosteoParams>(
    () => ({
      ...(filtros.fincaId !== TODAS ? { fincaId: filtros.fincaId } : {}),
      ...(filtros.desde ? { desde: filtros.desde } : {}),
      ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
    }),
    [filtros]
  )

  const consulta = useCosteo(params)
  const cuarteles = consulta.data?.cuarteles ?? []
  const totales = consulta.data?.totales
  const hayFiltros = Object.entries(filtros).some(
    ([clave, valor]) => valor !== FILTROS_VACIOS[clave as keyof typeof FILTROS_VACIOS]
  )

  function cambiar(clave: keyof typeof filtros, valor: string) {
    setFiltros((previos) => ({ ...previos, [clave]: valor }))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="costeo-finca">Finca</Label>
          <Select value={filtros.fincaId} onValueChange={(v) => cambiar("fincaId", v)}>
            <SelectTrigger id="costeo-finca" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas</SelectItem>
              {fincas.data?.map((finca) => (
                <SelectItem key={finca.id} value={finca.id}>
                  {finca.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="costeo-desde">Desde</Label>
          <Input
            id="costeo-desde"
            type="date"
            value={filtros.desde}
            max={filtros.hasta || undefined}
            onChange={(e) => cambiar("desde", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="costeo-hasta">Hasta</Label>
          <Input
            id="costeo-hasta"
            type="date"
            value={filtros.hasta}
            min={filtros.desde || undefined}
            onChange={(e) => cambiar("hasta", e.target.value)}
          />
        </div>
      </div>

      {hayFiltros && (
        <Button variant="ghost" size="sm" onClick={() => setFiltros(FILTROS_VACIOS)}>
          <X className="size-4" aria-hidden="true" />
          Limpiar filtros
        </Button>
      )}

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={cuarteles.length}
            hayFiltros={hayFiltros}
            vacio={{
              titulo: "Todavía no hay cuarteles activos",
              descripcion: "El costeo se arma con las labores registradas en cada cuartel.",
            }}
            vacioPorFiltro={{
              titulo: "Ningún cuartel entra en el período elegido",
              descripcion: "Ampliá el rango de fechas o quitá el filtro de finca.",
            }}
          >
            <Table>
              <TableCaption className="sr-only">
                Costo e ingresos por cuartel en el período seleccionado
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuartel</TableHead>
                  <TableHead>Finca</TableHead>
                  <TableHead className="text-right">Hectáreas</TableHead>
                  <TableHead className="text-right">Labores</TableHead>
                  <TableHead className="text-right">Insumos</TableHead>
                  <TableHead className="text-right">Costo total</TableHead>
                  <TableHead className="text-right">Costo / ha</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Margen bruto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuarteles.map((fila) => (
                  <TableRow key={fila.cuartelId}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/cuarteles/${fila.cuartelId}/historial`}
                        className="text-primary hover:underline"
                      >
                        {fila.cuartelNombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fila.fincaNombre}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fila.hectareas === null ? (
                        <Desconocido motivo="El cuartel no tiene superficie cargada" />
                      ) : (
                        formato.numero(fila.hectareas, { maximumFractionDigits: 2 })
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.dinero(fila.costoLabores)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.dinero(fila.costoInsumos)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formato.dinero(fila.costoTotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fila.costoPorHa === null ? (
                        <Desconocido motivo="No se puede calcular sin la superficie del cuartel" />
                      ) : (
                        formato.dinero(fila.costoPorHa)
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.dinero(fila.ingresos)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        fila.margenBruto !== null &&
                          (fila.margenBruto < 0 ? "text-destructive" : "text-emerald-700 dark:text-emerald-400")
                      )}
                    >
                      {fila.margenBrutoDisponible && fila.margenBruto !== null ? (
                        formato.dinero(fila.margenBruto)
                      ) : (
                        <Desconocido motivo="Sin liquidaciones de bodega cargadas todavía" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              {totales && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2}>Totales</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.numero(totales.hectareas, { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.dinero(totales.costoLabores)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.dinero(totales.costoInsumos)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.dinero(totales.costoTotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {totales.costoPorHa === null ? (
                        <Desconocido motivo="Ningún cuartel tiene superficie cargada" />
                      ) : (
                        formato.dinero(totales.costoPorHa)
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.dinero(totales.ingresos)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {totales.margenBrutoDisponible && totales.margenBruto !== null ? (
                        formato.dinero(totales.margenBruto)
                      ) : (
                        <Desconocido motivo="Sin liquidaciones de bodega cargadas todavía" />
                      )}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </EstadoConsulta>
        </CardContent>
      </Card>
    </div>
  )
}
