import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Info, LineChart, MoreHorizontal, Pencil, Plus, Power } from "lucide-react"
import { useDesactivarSensor, useSensores } from "./use-telemetria"
import { SensorDialog } from "./sensor-dialog"
import { useFincas } from "@/features/fincas/use-fincas"
import { ETIQUETA_TIPO_SENSOR } from "@/api/schemas/telemetria"
import { useFormato } from "@/context/configuracion-context"
import { ActivoBadge } from "@/components/datos/estado-badge"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

/**
 * Sensores de una finca con su última lectura (HU-18).
 *
 * El backend resuelve la última lectura de todos los sensores con **una** sola
 * consulta (`DISTINCT ON`), así que este listado también funciona como tablero
 * de "qué está midiendo cada nodo ahora" sin pagar un N+1.
 */
export function SensoresPage() {
  const [fincaId, setFincaId] = useState("")
  const fincas = useFincas()
  const consulta = useSensores(fincaId)
  const desactivar = useDesactivarSensor()
  const formato = useFormato()

  const sensores = consulta.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full space-y-1.5 sm:max-w-xs">
          <Label htmlFor="sensores-finca">Finca</Label>
          <Select value={fincaId} onValueChange={setFincaId}>
            <SelectTrigger id="sensores-finca" className="w-full">
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

        {fincaId && (
          <SensorDialog fincaId={fincaId}>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo sensor
            </Button>
          </SensorDialog>
        )}
      </div>

      {!fincaId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Info className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Elegí una finca para ver sus sensores</p>
            <p className="text-sm text-muted-foreground">
              Cada nodo se instala en una finca concreta.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EstadoConsulta
              consulta={consulta}
              cantidad={sensores.length}
              vacio={{
                titulo: "Esta finca no tiene sensores",
                descripcion: "Dalos de alta con el código con el que se aprovisionó el nodo.",
              }}
            >
              <Table>
                <TableCaption className="sr-only">
                  Sensores de la finca con su tipo, última lectura y estado
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Última lectura</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-32">
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sensores.map((sensor) => (
                    <TableRow key={sensor.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/sensores/${sensor.id}`}
                          className="text-primary hover:underline"
                        >
                          {sensor.codigo}
                        </Link>
                        {sensor.descripcion && (
                          <p className="text-xs text-muted-foreground">{sensor.descripcion}</p>
                        )}
                      </TableCell>
                      <TableCell>{ETIQUETA_TIPO_SENSOR[sensor.tipo]}</TableCell>
                      <TableCell>
                        {sensor.ultimaLectura ? (
                          <div className="flex flex-col">
                            <span className="tabular-nums">
                              {formato.numero(sensor.ultimaLectura.valor, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              {sensor.ultimaLectura.unidad}
                            </span>
                            {/* El timestamp es el que reportó el nodo, no el de
                                recepción: pueden diferir si estuvo sin señal. */}
                            <span className="text-xs text-muted-foreground">
                              {formato.fechaHora(sensor.ultimaLectura.sensorTimestamp)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Todavía no reportó
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ActivoBadge activo={sensor.activo} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/sensores/${sensor.id}`}>
                              <LineChart className="size-4" aria-hidden="true" />
                              Serie
                              <span className="sr-only"> de {sensor.codigo}</span>
                            </Link>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Acciones de ${sensor.codigo}`}
                              >
                                <MoreHorizontal className="size-4" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <SensorDialog fincaId={fincaId} sensor={sensor}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Pencil className="size-4" aria-hidden="true" />
                                  Editar
                                </DropdownMenuItem>
                              </SensorDialog>

                              {sensor.activo && (
                                <DialogoConfirmacion
                                  titulo={`¿Dar de baja ${sensor.codigo}?`}
                                  descripcion="Deja de aparecer en los listados. Las lecturas ya recibidas se conservan, pero las nuevas del nodo se van a rechazar."
                                  textoConfirmar="Dar de baja"
                                  errorPorDefecto="No se pudo dar de baja el sensor"
                                  onConfirmar={async () => {
                                    await desactivar.mutateAsync(sensor.id)
                                    toast.success(`${sensor.codigo} quedó dado de baja`)
                                  }}
                                >
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Power className="size-4" aria-hidden="true" />
                                    Dar de baja
                                  </DropdownMenuItem>
                                </DialogoConfirmacion>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </EstadoConsulta>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
