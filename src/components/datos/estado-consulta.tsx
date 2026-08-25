import type { ReactNode } from "react"
import { AlertTriangle, Inbox, RotateCw, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { mensajeDeError } from "@/api/errores"

/** Lo mínimo que `EstadoConsulta` necesita de un `useQuery`. */
export interface ConsultaMinima {
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => unknown
}

export function FilasEsqueleto({ filas = 5 }: { filas?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: filas }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

function Centrado({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">{children}</div>
  )
}

interface Props {
  consulta: ConsultaMinima
  /** Cantidad de filas efectivamente recibidas. */
  cantidad: number
  /**
   * Si hay algún filtro o búsqueda activa. **Es la distinción que importa:**
   * "no hay datos" y "el filtro no encontró nada" se veían iguales, y así fue
   * como el listado de Usuarios roto pasó por un estado vacío convincente con
   * doce usuarios en la base.
   */
  hayFiltros?: boolean
  vacio: { titulo: string; descripcion?: string; accion?: ReactNode }
  vacioPorFiltro?: { titulo: string; descripcion?: string; accion?: ReactNode }
  filasEsqueleto?: number
  children: ReactNode
}

/**
 * Carga, error y vacío en un solo lugar (W5).
 *
 * Antes cada pantalla los reinventaba: `isError` pintaba un `<p>` rojo sin
 * botón de reintentar, los esqueletos eran `Array.from({length: 4})` copiado en
 * tres archivos, y el estado vacío no distinguía sus dos causas.
 */
export function EstadoConsulta({
  consulta,
  cantidad,
  hayFiltros = false,
  vacio,
  vacioPorFiltro,
  filasEsqueleto = 5,
  children,
}: Props) {
  if (consulta.isPending) {
    return <FilasEsqueleto filas={filasEsqueleto} />
  }

  if (consulta.isError) {
    return (
      <Centrado>
        <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
        <div role="alert" className="space-y-1">
          <p className="text-sm font-medium">No se pudieron cargar los datos.</p>
          <p className="text-sm text-muted-foreground">{mensajeDeError(consulta.error)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void consulta.refetch()}>
          <RotateCw className="size-4" aria-hidden="true" />
          Reintentar
        </Button>
      </Centrado>
    )
  }

  if (cantidad === 0) {
    const sinResultados = hayFiltros && vacioPorFiltro
    const contenido = sinResultados ? vacioPorFiltro : vacio
    const Icono = sinResultados ? SearchX : Inbox
    return (
      <Centrado>
        <Icono className="size-8 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{contenido.titulo}</p>
          {contenido.descripcion && (
            <p className="text-sm text-muted-foreground">{contenido.descripcion}</p>
          )}
        </div>
        {contenido.accion}
      </Centrado>
    )
  }

  return <>{children}</>
}
