import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Printer } from "lucide-react"
import { useLiquidacion, useRemito } from "./use-vendimia"
import { AccionesRemito } from "./acciones-remito"
import { LiquidacionDialog } from "./liquidacion-dialog"
import { brutoDeLiquidacion } from "@/api/schemas/vendimia"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { useFormato } from "@/context/configuracion-context"
import { EstadoBadge } from "@/components/datos/estado-badge"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

/**
 * Remito imprimible (HU-27, decisión D-h / W-009).
 *
 * Se imprime con CSS y no con un PDF generado en el servidor: el endpoint ya
 * trae cuartel, finca y el detalle de pesajes, y un PDF del lado del backend
 * sería un módulo nuevo para un requisito que el navegador ya cubre.
 *
 * Las clases `print:` de Tailwind hacen el trabajo: se ocultan la navegación y
 * los botones, y el documento queda con el encabezado, el detalle y el pie.
 */
export function RemitoDetallePage() {
  const { remitoId } = useParams<{ remitoId: string }>()
  const consulta = useRemito(remitoId ?? "")
  const remito = consulta.data
  const { user } = useAuth()
  const formato = useFormato()

  const puedeVerLiquidacion = puede(user?.rol, "vendimiaAprobacion")
  const liquidacion = useLiquidacion(
    remitoId ?? "",
    puedeVerLiquidacion && remito?.estado === "aprobado"
  )

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link
          to="/vendimia"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a remitos
        </Link>
      </div>

      <EstadoConsulta
        consulta={consulta}
        cantidad={remito ? 1 : 0}
        vacio={{ titulo: "No se encontró el remito" }}
        filasEsqueleto={4}
      >
        {remito && (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold">{remito.numeroRemito}</h1>
                  <EstadoBadge estado={remito.estado} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Jornada del {formato.fecha(remito.fecha)} · generado el{" "}
                  {formato.fechaHora(remito.fechaGeneracion)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="size-4" aria-hidden="true" />
                  Imprimir
                </Button>
                {puedeVerLiquidacion && <LiquidacionDialog remito={remito} />}
                <AccionesRemito remito={remito} />
              </div>
            </div>

            {remito.motivoRechazo && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <strong>Motivo del rechazo:</strong> {remito.motivoRechazo}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Dato titulo="Finca" valor={remito.cuartel?.finca?.nombre ?? "—"} />
              <Dato titulo="Cuartel" valor={remito.cuartel?.nombre ?? "—"} />
              <Dato titulo="Variedad" valor={remito.cuartel?.variedad?.nombre ?? "—"} />
              <Dato titulo="Kilos despachados" valor={formato.kg(remito.totalKg)} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pesajes incluidos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableCaption className="sr-only">
                    Pesajes que componen el remito, con su cuadrilla y kilos
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cuadrilla</TableHead>
                      <TableHead className="text-right">Kilos</TableHead>
                      <TableHead className="text-right">Tarifa</TableHead>
                      <TableHead className="text-right">A pagar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remito.pesajes.map((pesaje) => (
                      <TableRow key={pesaje.id}>
                        <TableCell className="whitespace-nowrap">
                          {formato.fecha(pesaje.fecha)}
                        </TableCell>
                        <TableCell>{pesaje.cuadrilla?.nombre ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formato.kg(pesaje.kgTotales)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formato.dinero(pesaje.tarifaUtilizada)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formato.dinero(pesaje.montoLiquidacion)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>
                        Totales ({remito.pesajes.length} pesaje
                        {remito.pesajes.length === 1 ? "" : "s"})
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formato.kg(remito.totalKg)}
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-right tabular-nums">
                        {formato.dinero(remito.totalLiquidacion)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>

            {/* El pago a la cuadrilla es un costo de cosecha; el ingreso es lo
                que paga la bodega. Mostrarlos en bloques separados es lo que
                evita que se lean como lo mismo. */}
            {puedeVerLiquidacion && remito.estado === "aprobado" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Liquidación de la bodega</CardTitle>
                </CardHeader>
                <CardContent>
                  {liquidacion.data ? (
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Item titulo="Bodega" valor={liquidacion.data.bodega} />
                      <Item
                        titulo="Kilos aceptados"
                        valor={formato.kg(liquidacion.data.kgAceptados)}
                        nota={
                          liquidacion.data.kgAceptados !== remito.totalKg
                            ? `Despachados ${formato.kg(remito.totalKg)}`
                            : undefined
                        }
                      />
                      <Item
                        titulo="Precio por kg"
                        valor={formato.dinero(liquidacion.data.precioPorKg)}
                      />
                      <Item
                        titulo="Importe neto"
                        valor={formato.dinero(liquidacion.data.montoNeto)}
                        nota={`${formato.dinero(brutoDeLiquidacion(liquidacion.data))} − ${formato.dinero(liquidacion.data.descuentos)}`}
                      />
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Todavía no se cargó. Hasta que se registre, el margen bruto de este
                      cuartel figura como desconocido —no como cero—.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </EstadoConsulta>
    </div>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="font-medium">{valor}</p>
    </div>
  )
}

function Item({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd className="font-medium tabular-nums">{valor}</dd>
      {nota && <dd className="text-xs text-muted-foreground">{nota}</dd>}
    </div>
  )
}
