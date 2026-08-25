import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowDownAZ, ArrowUpAZ, Search, X } from "lucide-react"
import { useBuscarCuarteles, useVariedadesDeFinca } from "./use-cuarteles"
import { AccionesCuartel } from "./acciones-cuartel"
import { useFincas } from "@/features/fincas/use-fincas"
import { estadoCuartelSchema, type EstadoCuartel } from "@/api/schemas/cuartel"
import type { BuscarCuartelesParams } from "@/api/endpoints/cuarteles"
import { useFormato } from "@/context/configuracion-context"
import { etiquetaEstado } from "@/lib/estados"
import { ActivoBadge, EstadoBadge } from "@/components/datos/estado-badge"
import { TablaPaginada } from "@/components/datos/tabla-paginada"
import { usePaginacion } from "@/components/datos/paginacion"
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

const TODOS = "todos"

/** Lista blanca de `CAMPOS_ORDEN_CUARTEL`: el backend rechaza cualquier otra. */
const ORDENABLES = [
  { campo: "nombre", etiqueta: "Nombre" },
  { campo: "hectareas", etiqueta: "Hectáreas" },
  { campo: "anioImplantacion", etiqueta: "Año" },
] as const

type CampoOrden = (typeof ORDENABLES)[number]["campo"]

const FILTROS_VACIOS = {
  buscar: "",
  fincaId: TODOS,
  variedadId: TODOS,
  estado: TODOS,
  anioImplantacion: "",
  activo: "activos",
}

/**
 * Encabezado que ordena al hacer clic.
 *
 * A nivel de módulo y no dentro de la página: una función-componente declarada
 * dentro del render es un tipo nuevo en cada pasada, así que React desmonta y
 * vuelve a montar la celda —y el botón pierde el foco justo cuando se lo acaba
 * de dar—.
 */
function EncabezadoOrdenable({
  campo,
  etiqueta,
  ordenarPor,
  orden,
  onOrdenar,
}: {
  campo: CampoOrden
  etiqueta: string
  ordenarPor: CampoOrden
  orden: "ASC" | "DESC"
  onOrdenar: (campo: CampoOrden) => void
}) {
  const activo = ordenarPor === campo
  const Icono = orden === "ASC" ? ArrowDownAZ : ArrowUpAZ
  return (
    <TableHead aria-sort={activo ? (orden === "ASC" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
      >
        {etiqueta}
        {activo && <Icono className="size-3.5" aria-hidden="true" />}
        <span className="sr-only">
          {activo
            ? `, ordenado ${orden === "ASC" ? "ascendente" : "descendente"}. Cambiar orden`
            : `. Ordenar por ${etiqueta.toLowerCase()}`}
        </span>
      </button>
    </TableHead>
  )
}

/**
 * Búsqueda de cuarteles en toda la empresa (HU-11).
 *
 * Es un endpoint distinto del listado por finca: `GET /cuarteles/buscar`
 * atraviesa las fincas, viene paginado y acepta filtros y orden. El otro,
 * `GET /cuarteles?fincaId=`, devuelve un array plano con los activos de una
 * sola finca. Los dos existen y hacen cosas distintas.
 */
export function BuscarCuartelesPage() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [ordenarPor, setOrdenarPor] = useState<CampoOrden>("nombre")
  const [orden, setOrden] = useState<"ASC" | "DESC">("ASC")
  const paginacion = usePaginacion()
  const formato = useFormato()

  const fincas = useFincas()
  // Las variedades del filtro dependen de la finca elegida; sin finca no hay a
  // qué acotarlas, y el backend exige `fincaId` en ese endpoint.
  const fincaElegida = filtros.fincaId !== TODOS ? filtros.fincaId : undefined
  const variedades = useVariedadesDeFinca(fincaElegida)

  const params = useMemo<BuscarCuartelesParams>(
    () => ({
      page: paginacion.page,
      pageSize: paginacion.pageSize,
      ordenarPor,
      orden,
      ...(filtros.buscar ? { buscar: filtros.buscar } : {}),
      ...(filtros.fincaId !== TODOS ? { fincaId: filtros.fincaId } : {}),
      ...(filtros.variedadId !== TODOS ? { variedadId: filtros.variedadId } : {}),
      ...(filtros.estado !== TODOS ? { estado: filtros.estado as EstadoCuartel } : {}),
      ...(filtros.anioImplantacion
        ? { anioImplantacion: Number(filtros.anioImplantacion) }
        : {}),
      // `?activo=false` ya devuelve los inactivos: hasta el fix del backend
      // devolvía los activos, porque la conversión implícita del ValidationPipe
      // corría antes del @Transform y hacía `Boolean('false')`.
      activo: filtros.activo === "activos",
    }),
    [paginacion.page, paginacion.pageSize, ordenarPor, orden, filtros]
  )

  const consulta = useBuscarCuarteles(params)
  const hayFiltros = Object.entries(filtros).some(
    ([clave, valor]) => valor !== FILTROS_VACIOS[clave as keyof typeof FILTROS_VACIOS]
  )

  function cambiar<K extends keyof typeof filtros>(clave: K, valor: string) {
    setFiltros((previos) => {
      const siguiente = { ...previos, [clave]: valor }
      // Cambiar de finca invalida la variedad elegida: puede no existir en la
      // finca nueva, y el filtro devolveria cero resultados sin explicar por qué.
      if (clave === "fincaId") siguiente.variedadId = TODOS
      return siguiente
    })
    paginacion.reiniciar()
  }

  function limpiar() {
    setFiltros(FILTROS_VACIOS)
    paginacion.reiniciar()
  }

  function alternarOrden(campo: CampoOrden) {
    if (campo === ordenarPor) {
      setOrden((o) => (o === "ASC" ? "DESC" : "ASC"))
    } else {
      setOrdenarPor(campo)
      setOrden("ASC")
    }
    paginacion.reiniciar()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Buscar cuarteles</h1>
        <p className="text-sm text-muted-foreground">
          En todas las fincas de la empresa. Para el detalle de una sola,{" "}
          <Link to="/fincas" className="text-primary hover:underline">
            entrá desde Fincas
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1.5 xl:col-span-2">
          <Label htmlFor="filtro-buscar">Nombre</Label>
          <div className="relative">
            <Search
              className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="filtro-buscar"
              type="search"
              placeholder="Cuartel 1..."
              className="pl-8"
              maxLength={100}
              value={filtros.buscar}
              onChange={(e) => cambiar("buscar", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-finca">Finca</Label>
          <Select value={filtros.fincaId} onValueChange={(v) => cambiar("fincaId", v)}>
            <SelectTrigger id="filtro-finca" className="w-full">
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

        <div className="space-y-1.5">
          <Label htmlFor="filtro-variedad">Variedad</Label>
          <Select
            value={filtros.variedadId}
            onValueChange={(v) => cambiar("variedadId", v)}
            disabled={!fincaElegida}
          >
            <SelectTrigger id="filtro-variedad" className="w-full">
              <SelectValue placeholder="Elegí una finca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas</SelectItem>
              {variedades.data?.map((variedad) => (
                <SelectItem key={variedad.id} value={variedad.id}>
                  {variedad.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-estado">Cosecha</Label>
          <Select value={filtros.estado} onValueChange={(v) => cambiar("estado", v)}>
            <SelectTrigger id="filtro-estado" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {estadoCuartelSchema.options.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {etiquetaEstado(estado)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-activo">Estado</Label>
          <Select value={filtros.activo} onValueChange={(v) => cambiar("activo", v)}>
            <SelectTrigger id="filtro-activo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Dados de baja</SelectItem>
            </SelectContent>
          </Select>
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
        caption="Cuarteles de la empresa, con su finca, variedad, superficie y estado"
        etiquetaTotal="cuarteles"
        hayFiltros={hayFiltros}
        vacio={{
          titulo: "Todavía no hay cuarteles cargados",
          descripcion: "Se cargan desde cada finca.",
        }}
        vacioPorFiltro={{
          titulo: "Ningún cuartel coincide con los filtros",
          descripcion: "Probá quitando alguno o ampliando la búsqueda.",
          accion: (
            <Button variant="outline" size="sm" onClick={limpiar}>
              Limpiar filtros
            </Button>
          ),
        }}
        encabezado={
          <>
            <EncabezadoOrdenable
              campo="nombre"
              etiqueta="Nombre"
              ordenarPor={ordenarPor}
              orden={orden}
              onOrdenar={alternarOrden}
            />
            <TableHead>Finca</TableHead>
            <TableHead>Variedad</TableHead>
            <EncabezadoOrdenable
              campo="anioImplantacion"
              etiqueta="Año"
              ordenarPor={ordenarPor}
              orden={orden}
              onOrdenar={alternarOrden}
            />
            <EncabezadoOrdenable
              campo="hectareas"
              etiqueta="Hectáreas"
              ordenarPor={ordenarPor}
              orden={orden}
              onOrdenar={alternarOrden}
            />
            <TableHead>Cosecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </>
        }
        fila={(cuartel) => (
          <TableRow key={cuartel.id}>
            <TableCell className="font-medium">{cuartel.nombre}</TableCell>
            <TableCell>
              <Link
                to={`/fincas/${cuartel.fincaId}/cuarteles`}
                className="text-primary hover:underline"
              >
                {cuartel.finca?.nombre ?? "—"}
              </Link>
            </TableCell>
            <TableCell>{cuartel.variedad?.nombre ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">
              {cuartel.anioImplantacion ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formato.hectareas(cuartel.hectareas)}
            </TableCell>
            <TableCell>
              <EstadoBadge estado={cuartel.estado} />
            </TableCell>
            <TableCell>
              <ActivoBadge activo={cuartel.activo} />
            </TableCell>
            <TableCell>
              <AccionesCuartel cuartel={cuartel} />
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}
