import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Paginado } from "@/api/schemas/comunes"
import { EstadoConsulta, type ConsultaMinima } from "./estado-consulta"
import { ControlesPaginacion, type EstadoPaginacion } from "./paginacion"

interface Props<T> {
  consulta: ConsultaMinima & { data?: Paginado<T> }
  paginacion: EstadoPaginacion
  /** Describe la tabla para lectores de pantalla; no se muestra en pantalla. */
  caption: string
  encabezado: ReactNode
  fila: (item: T) => ReactNode
  vacio: { titulo: string; descripcion?: string; accion?: ReactNode }
  vacioPorFiltro?: { titulo: string; descripcion?: string; accion?: ReactNode }
  hayFiltros?: boolean
  etiquetaTotal?: string
}

/**
 * Tabla sobre el envelope paginado del backend (W4).
 *
 * Son 8 los endpoints paginados. Sin esta primitiva, cada pantalla nueva
 * reimplementa `page`/`pageSize`/`totalPages` o —más probable— muestra las
 * primeras 20 filas sin decirlo.
 */
export function TablaPaginada<T>({
  consulta,
  paginacion,
  caption,
  encabezado,
  fila,
  vacio,
  vacioPorFiltro,
  hayFiltros,
  etiquetaTotal,
}: Props<T>) {
  const datos = consulta.data?.data ?? []

  return (
    <Card>
      <CardContent className="p-0">
        <EstadoConsulta
          consulta={consulta}
          cantidad={datos.length}
          hayFiltros={hayFiltros}
          vacio={vacio}
          vacioPorFiltro={vacioPorFiltro}
        >
          <Table>
            <TableCaption className="sr-only">{caption}</TableCaption>
            <TableHeader>
              <TableRow>{encabezado}</TableRow>
            </TableHeader>
            <TableBody>{datos.map(fila)}</TableBody>
          </Table>
          {consulta.data && (
            <ControlesPaginacion
              resultado={consulta.data}
              paginacion={paginacion}
              etiqueta={etiquetaTotal}
            />
          )}
        </EstadoConsulta>
      </CardContent>
    </Card>
  )
}
