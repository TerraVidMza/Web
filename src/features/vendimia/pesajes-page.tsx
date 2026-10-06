import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { usePesajesDeCuartel } from "./use-vendimia"
import { useFormato } from "@/context/configuracion-context"
import { EstadoBadge } from "@/components/datos/estado-badge"
import { TablaPaginada } from "@/components/datos/tabla-paginada"
import { usePaginacion } from "@/components/datos/paginacion"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Ubicacion } from "@/components/datos/ubicacion"

/**
 * Pesajes de un cuartel, en modo lectura (HU-26, decisión D-d).
 *
 * Se registran desde Mobile, en el campo. La oficina los ve pero no los carga:
 * es de donde sale el costeo y el seguimiento de la cosecha.
 */
export function PesajesPage() {
  const { cuartelId } = useParams<{ cuartelId: string }>()
  const paginacion = usePaginacion()
  const formato = useFormato()

  const params = useMemo(
    () => ({ page: paginacion.page, pageSize: paginacion.pageSize }),
    [paginacion.page, paginacion.pageSize]
  )

  const consulta = usePesajesDeCuartel(cuartelId ?? "", params)

  return (
    <div className="space-y-6">
      <Link
        to="/vendimia/cosecha"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al estado de cosecha
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Pesajes del cuartel</h1>
        <p className="text-sm text-muted-foreground">
          Se cargan desde la aplicación móvil, en el campo. Acá se consultan en modo lectura.
        </p>
      </div>

      <TablaPaginada
        consulta={consulta}
        paginacion={paginacion}
        caption="Pesajes de vendimia del cuartel, con su cuadrilla, kilos y estado"
        etiquetaTotal="pesajes"
        vacio={{
          titulo: "Este cuartel todavía no tiene pesajes",
          descripcion: "Aparecen a medida que las cuadrillas cargan la cosecha.",
        }}
        encabezado={
          <>
            <TableHead>Fecha</TableHead>
            <TableHead>Cuadrilla</TableHead>
            <TableHead className="text-right">Kilos</TableHead>
            <TableHead className="text-right">Tarifa</TableHead>
            <TableHead className="text-right">A pagar</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Remito</TableHead>
            <TableHead>Ubicación</TableHead>
          </>
        }
        fila={(pesaje) => (
          <TableRow key={pesaje.id}>
            <TableCell className="whitespace-nowrap">{formato.fecha(pesaje.fecha)}</TableCell>
            <TableCell>{pesaje.cuadrilla?.nombre ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formato.kg(pesaje.kgTotales)}
            </TableCell>
            {/* La tarifa que regía el día del pesaje, no la actual: por eso las
                vigencias de HU-23 no pueden ser retroactivas. */}
            <TableCell className="text-right tabular-nums">
              {formato.dinero(pesaje.tarifaUtilizada)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formato.dinero(pesaje.montoLiquidacion)}
            </TableCell>
            <TableCell>
              <EstadoBadge estado={pesaje.estado} />
            </TableCell>
            <TableCell>
              {pesaje.remitoId ? (
                <Link
                  to={`/remitos/${pesaje.remitoId}`}
                  className="text-sm text-primary hover:underline"
                >
                  Ver remito
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Ubicacion latitud={pesaje.latitud} longitud={pesaje.longitud} />
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}
