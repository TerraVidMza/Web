import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { X } from "lucide-react"
import { useRemitos } from "./use-vendimia"
import { AccionesRemito } from "./acciones-remito"
import { GenerarBorradorDialog } from "./generar-borrador-dialog"
import { useFincas } from "@/features/fincas/use-fincas"
import { estadoRemitoSchema, type EstadoRemito } from "@/api/schemas/vendimia"
import type { ListarRemitosParams } from "@/api/endpoints/vendimia"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { useFormato } from "@/context/configuracion-context"
import { etiquetaEstado } from "@/lib/estados"
import { EstadoBadge } from "@/components/datos/estado-badge"
import { TablaPaginada } from "@/components/datos/tabla-paginada"
import { usePaginacion } from "@/components/datos/paginacion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TODOS = "todos"

const FILTROS_VACIOS = { estado: TODOS, fincaId: TODOS }

/**
 * Panel de remitos (HU-26, HU-27).
 *
 * Arranca filtrado en **borradores**: es la bandeja de aprobación, que es para
 * lo que la abre un Propietario. Ver el histórico completo está a un clic.
 */
export function RemitosPage() {
  const [filtros, setFiltros] = useState({ ...FILTROS_VACIOS, estado: "borrador" })
  const paginacion = usePaginacion()
  const fincas = useFincas()
  const formato = useFormato()
  const { user } = useAuth()

  const params = useMemo<ListarRemitosParams>(
    () => ({
      page: paginacion.page,
      pageSize: paginacion.pageSize,
      ...(filtros.estado !== TODOS ? { estado: filtros.estado as EstadoRemito } : {}),
      ...(filtros.fincaId !== TODOS ? { fincaId: filtros.fincaId } : {}),
    }),
    [paginacion.page, paginacion.pageSize, filtros]
  )

  const consulta = useRemitos(params)
  const hayFiltros = filtros.estado !== TODOS || filtros.fincaId !== TODOS
  const puedeGenerar = puede(user, "vendimia")
  const puedeAprobar = puede(user, "vendimiaAprobacion")

  function cambiar(clave: keyof typeof filtros, valor: string) {
    setFiltros((previos) => ({ ...previos, [clave]: valor }))
    paginacion.reiniciar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 sm:max-w-lg">
          <div className="space-y-1.5">
            <Label htmlFor="remitos-estado">Estado</Label>
            <Select value={filtros.estado} onValueChange={(v) => cambiar("estado", v)}>
              <SelectTrigger id="remitos-estado" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {estadoRemitoSchema.options.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {etiquetaEstado(estado)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="remitos-finca">Finca</Label>
            <Select value={filtros.fincaId} onValueChange={(v) => cambiar("fincaId", v)}>
              <SelectTrigger id="remitos-finca" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {fincas.data?.map((finca) => (
                  <SelectItem key={finca.id} value={finca.id}>
                    {finca.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {puedeGenerar && <GenerarBorradorDialog />}
      </div>

      {hayFiltros && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFiltros(FILTROS_VACIOS)
            paginacion.reiniciar()
          }}
        >
          <X className="size-4" aria-hidden="true" />
          Ver todos
        </Button>
      )}

      <TablaPaginada
        consulta={consulta}
        paginacion={paginacion}
        caption="Remitos de vendimia con su cuartel, kilos despachados y estado"
        etiquetaTotal="remitos"
        hayFiltros={hayFiltros}
        vacio={{
          titulo: "Todavía no hay remitos",
          descripcion: "Se generan a partir de los pesajes pendientes de un cuartel.",
        }}
        vacioPorFiltro={{
          titulo: "Ningún remito con esos filtros",
          descripcion:
            filtros.estado === "borrador"
              ? "No hay remitos esperando aprobación."
              : "Probá con otro estado u otra finca.",
        }}
        encabezado={
          <>
            <TableHead>Número</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Cuartel</TableHead>
            <TableHead className="text-right">Kilos</TableHead>
            <TableHead className="text-right">A la cuadrilla</TableHead>
            <TableHead>Estado</TableHead>
            {puedeAprobar && (
              <TableHead className="w-52">
                <span className="sr-only">Acciones</span>
              </TableHead>
            )}
          </>
        }
        fila={(remito) => (
          <TableRow key={remito.id}>
            <TableCell className="font-medium">
              <Link to={`/remitos/${remito.id}`} className="text-primary hover:underline">
                {remito.numeroRemito}
              </Link>
            </TableCell>
            <TableCell className="whitespace-nowrap">{formato.fecha(remito.fecha)}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{remito.cuartel?.nombre ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  {remito.cuartel?.finca?.nombre}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formato.kg(remito.totalKg)}
            </TableCell>
            {/* `totalLiquidacion` es lo que se le paga a la cuadrilla por
                cosechar: un costo, no el ingreso. El ingreso es la liquidación
                de bodega, que se carga en el detalle. */}
            <TableCell className="text-right tabular-nums">
              {formato.dinero(remito.totalLiquidacion)}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <EstadoBadge estado={remito.estado} />
                {remito.motivoRechazo && (
                  <span
                    className="max-w-48 truncate text-xs text-muted-foreground"
                    title={remito.motivoRechazo}
                  >
                    {remito.motivoRechazo}
                  </span>
                )}
              </div>
            </TableCell>
            {puedeAprobar && (
              <TableCell>
                <AccionesRemito remito={remito} />
              </TableCell>
            )}
          </TableRow>
        )}
      />
    </div>
  )
}
