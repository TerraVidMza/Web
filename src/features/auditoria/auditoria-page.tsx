import { useMemo, useState } from "react"
import { History, X } from "lucide-react"
import { useAuditoria } from "./use-auditoria"
import { DetalleCambios } from "./detalle-cambios"
import {
  ACCIONES_AUDITABLES,
  ENTIDADES_AUDITABLES,
  etiquetaAccion,
  etiquetaEntidad,
} from "./vocabulario"
import { useFormato } from "@/context/configuracion-context"
import { ETIQUETA_ROL } from "@/auth/roles"
import { TablaPaginada } from "@/components/datos/tabla-paginada"
import { usePaginacion } from "@/components/datos/paginacion"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TODAS = "todas"

const FILTROS_VACIOS = { accion: TODAS, entidad: TODAS, desde: "", hasta: "" }

/**
 * Log de auditoría (HU-07).
 *
 * Es **la única pantalla del Auditor**: su alcance son este listado y el
 * historial de labores por cuartel, y hasta ahora Web no tenía ninguno de los
 * dos, así que el rol entraba al sistema y no podía hacer nada.
 */
export function AuditoriaPage() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const paginacion = usePaginacion()
  const formato = useFormato()

  const params = useMemo(
    () => ({
      page: paginacion.page,
      pageSize: paginacion.pageSize,
      ...(filtros.accion !== TODAS ? { accion: filtros.accion } : {}),
      ...(filtros.entidad !== TODAS ? { entidad: filtros.entidad } : {}),
      ...(filtros.desde ? { desde: filtros.desde } : {}),
      ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
    }),
    [paginacion.page, paginacion.pageSize, filtros]
  )

  const consulta = useAuditoria(params)
  const hayFiltros = Object.entries(filtros).some(
    ([clave, valor]) => valor !== FILTROS_VACIOS[clave as keyof typeof FILTROS_VACIOS]
  )

  function cambiar<K extends keyof typeof filtros>(clave: K, valor: string) {
    setFiltros((previos) => ({ ...previos, [clave]: valor }))
    paginacion.reiniciar()
  }

  function limpiar() {
    setFiltros(FILTROS_VACIOS)
    paginacion.reiniciar()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Log de auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Quién hizo cada cambio, cuándo y desde qué IP. El registro es de solo lectura.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="filtro-accion">Acción</Label>
          <Select value={filtros.accion} onValueChange={(v) => cambiar("accion", v)}>
            <SelectTrigger id="filtro-accion" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas las acciones</SelectItem>
              {ACCIONES_AUDITABLES.map((accion) => (
                <SelectItem key={accion} value={accion}>
                  {etiquetaAccion(accion)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-entidad">Entidad</Label>
          <Select value={filtros.entidad} onValueChange={(v) => cambiar("entidad", v)}>
            <SelectTrigger id="filtro-entidad" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas las entidades</SelectItem>
              {ENTIDADES_AUDITABLES.map((entidad) => (
                <SelectItem key={entidad} value={entidad}>
                  {etiquetaEntidad(entidad)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-desde">Desde</Label>
          <Input
            id="filtro-desde"
            type="date"
            value={filtros.desde}
            max={filtros.hasta || undefined}
            onChange={(e) => cambiar("desde", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-hasta">Hasta</Label>
          <Input
            id="filtro-hasta"
            type="date"
            value={filtros.hasta}
            min={filtros.desde || undefined}
            onChange={(e) => cambiar("hasta", e.target.value)}
          />
        </div>
      </div>

      {hayFiltros && (
        <Button variant="ghost" size="sm" onClick={limpiar}>
          <X className="size-4" aria-hidden="true" />
          Limpiar filtros
        </Button>
      )}

      <TablaPaginada
        consulta={consulta}
        paginacion={paginacion}
        caption="Registro de auditoría: acción, entidad afectada, responsable, fecha e IP"
        etiquetaTotal="eventos"
        hayFiltros={hayFiltros}
        vacio={{
          titulo: "Todavía no hay eventos registrados",
          descripcion: "El log se llena a medida que se usa el sistema.",
        }}
        vacioPorFiltro={{
          titulo: "Ningún evento coincide con los filtros",
          descripcion: "Ampliá el rango de fechas o quitá algún filtro.",
          accion: (
            <Button variant="outline" size="sm" onClick={limpiar}>
              Limpiar filtros
            </Button>
          ),
        }}
        encabezado={
          <>
            <TableHead>Fecha</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Entidad</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Cambios</TableHead>
            <TableHead>IP</TableHead>
          </>
        }
        fila={(evento) => (
          <TableRow key={evento.id}>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formato.fechaHora(evento.createdAt)}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono text-xs">
                {evento.accion}
              </Badge>
            </TableCell>
            <TableCell>
              {/*
                El Auditor no puede listar cuarteles —`GET /cuarteles` es
                `@Roles(P, A, C)`—, así que este enlace es su **única** vía de
                entrada al historial de operaciones que HU-17 sí le concede.
              */}
              {evento.entidad === "cuartel" && evento.entidadId ? (
                <Link
                  to={`/cuarteles/${evento.entidadId}/historial`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <History className="size-3.5" aria-hidden="true" />
                  Cuartel
                  <span className="sr-only">: ver su historial de operaciones</span>
                </Link>
              ) : (
                etiquetaEntidad(evento.entidad)
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{evento.actor?.nombre ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  {evento.actor?.email ?? evento.actorId}
                  {evento.actor?.rol && ` · ${ETIQUETA_ROL[evento.actor.rol.nombreRol]}`}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <DetalleCambios evento={evento} />
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {evento.ipAddress ?? "—"}
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}
