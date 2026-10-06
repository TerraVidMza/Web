import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, X } from "lucide-react"
import { useHistorialDeLabores } from "./use-historial"
import { costoDeLabor, type RegistroLabor } from "@/api/schemas/operaciones"
import type { HistorialLaboresParams } from "@/api/endpoints/operaciones"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { useFormato } from "@/context/configuracion-context"
import { TablaPaginada } from "@/components/datos/tabla-paginada"
import { usePaginacion } from "@/components/datos/paginacion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Ubicacion } from "@/components/datos/ubicacion"

const FILTROS_VACIOS = { desde: "", hasta: "" }

/** Los insumos consumidos, cada uno con su costo congelado al sincronizar. */
function Insumos({ registro }: { registro: RegistroLabor }) {
  const formato = useFormato()

  if (registro.detalles.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <ul className="space-y-0.5">
      {registro.detalles.map((detalle) => (
        <li key={detalle.id} className="text-xs">
          <span className="font-medium">{detalle.insumo?.nombre ?? "Insumo"}</span>{" "}
          <span className="text-muted-foreground">
            {formato.numero(detalle.cantidadUsada, { maximumFractionDigits: 4 })}{" "}
            {detalle.insumo?.unidadMedida}
            {detalle.costoUnitarioAlSync !== null &&
              ` · ${formato.dinero(detalle.cantidadUsada * detalle.costoUnitarioAlSync)}`}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Historial de operaciones de un cuartel (HU-17).
 *
 * Es el segundo —y último— recurso de negocio que la historia le concede al
 * Auditor, además del log de auditoría.
 *
 * **El Capataz ve menos que los demás y no es un error de esta pantalla:** el
 * backend lo restringe a sus propios registros del día, y lo hace después de
 * aplicar los filtros del query string para que no puedan relajarlo. Se avisa
 * en pantalla para que no parezca que faltan datos.
 */
export function HistorialPage() {
  const { cuartelId } = useParams<{ cuartelId: string }>()
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const paginacion = usePaginacion()
  const formato = useFormato()
  const { user } = useAuth()

  const esCapataz = user?.rol === "Capataz"
  const puedeVerCostos = puede(user, "operaciones")

  const params = useMemo<HistorialLaboresParams>(
    () => ({
      page: paginacion.page,
      pageSize: paginacion.pageSize,
      ...(filtros.desde ? { desde: filtros.desde } : {}),
      ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
    }),
    [paginacion.page, paginacion.pageSize, filtros]
  )

  const consulta = useHistorialDeLabores(cuartelId ?? "", params)
  const hayFiltros = filtros.desde !== "" || filtros.hasta !== ""

  function cambiar(clave: keyof typeof filtros, valor: string) {
    setFiltros((previos) => ({ ...previos, [clave]: valor }))
    paginacion.reiniciar()
  }

  return (
    <div className="space-y-6">
      {/* El Auditor no puede listar cuarteles (403), así que este enlace no
          siempre lleva a algún lado para él. Se muestra solo a quien puede. */}
      {puede(user, "fincas") && (
        <Link
          to="/cuarteles"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a cuarteles
        </Link>
      )}

      <div>
        <h1 className="text-xl font-semibold">Historial de operaciones</h1>
        <p className="text-sm text-muted-foreground">
          Labores registradas en este cuartel, con los insumos consumidos en cada una.
        </p>
      </div>

      {esCapataz && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Como Capataz ves únicamente los registros que cargaste vos hoy. El historial
          completo del cuartel lo consultan el Propietario y el Agrónomo.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="historial-desde">Desde</Label>
          <Input
            id="historial-desde"
            type="date"
            value={filtros.desde}
            max={filtros.hasta || undefined}
            disabled={esCapataz}
            onChange={(e) => cambiar("desde", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="historial-hasta">Hasta</Label>
          <Input
            id="historial-hasta"
            type="date"
            value={filtros.hasta}
            min={filtros.desde || undefined}
            disabled={esCapataz}
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

      <TablaPaginada
        consulta={consulta}
        paginacion={paginacion}
        caption="Labores del cuartel con su fecha, responsable, insumos y costo"
        etiquetaTotal="labores"
        hayFiltros={hayFiltros}
        vacio={{
          titulo: "Este cuartel todavía no tiene labores registradas",
          descripcion: "Se cargan desde la aplicación móvil, en el campo.",
        }}
        vacioPorFiltro={{
          titulo: "Ninguna labor en el período elegido",
          descripcion: "Ampliá el rango de fechas.",
        }}
        encabezado={
          <>
            <TableHead>Fecha</TableHead>
            <TableHead>Labor</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Insumos</TableHead>
            <TableHead>Ubicación</TableHead>
            {puedeVerCostos && <TableHead className="text-right">Costo</TableHead>}
          </>
        }
        fila={(registro) => (
          <TableRow key={registro.id}>
            <TableCell className="whitespace-nowrap">
              {formato.fecha(registro.fecha)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="font-medium">{registro.tipoLabor?.nombre ?? "—"}</span>
                {/* El registro usó un ítem de catálogo dado de baja después de
                    la última descarga del dispositivo. El backend lo acepta
                    igual —el trabajo físico ocurrió— pero lo marca. */}
                {registro.inconsistenciaCatalogo && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-300"
                    title="Se registró con un ítem de catálogo que ya estaba dado de baja"
                  >
                    <AlertTriangle className="size-3" aria-hidden="true" />
                    Revisar
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formato.numero(registro.cantidad, { maximumFractionDigits: 2 })}{" "}
              <span className="text-muted-foreground">{registro.tipoLabor?.unidadMedida}</span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {registro.usuario?.nombre ?? "—"}
            </TableCell>
            <TableCell>
              <Insumos registro={registro} />
            </TableCell>
            <TableCell>
              <Ubicacion latitud={registro.latitud} longitud={registro.longitud} />
            </TableCell>
            {puedeVerCostos && (
              <TableCell className="text-right font-medium tabular-nums">
                {formato.dinero(costoDeLabor(registro))}
              </TableCell>
            )}
          </TableRow>
        )}
      />

      {puedeVerCostos && (
        <p className="text-xs text-muted-foreground">
          El costo de cada labor es el que regía el día en que se sincronizó, no el actual:
          por eso las vigencias de HU-16 no pueden ser retroactivas.
        </p>
      )}
    </div>
  )
}
