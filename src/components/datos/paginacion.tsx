import { useCallback, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TAMANIO_PAGINA_POR_DEFECTO, type Paginado } from "@/api/schemas/comunes"

/** Opciones acotadas por el techo duro de 100 del backend. */
const TAMANIOS = [10, 20, 50, 100] as const

export interface EstadoPaginacion {
  page: number
  pageSize: number
  irA: (page: number) => void
  cambiarTamanio: (pageSize: number) => void
  /** Volver a la primera página: se llama al cambiar cualquier filtro. */
  reiniciar: () => void
}

export function usePaginacion(pageSizeInicial = TAMANIO_PAGINA_POR_DEFECTO): EstadoPaginacion {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizeInicial)

  const cambiarTamanio = useCallback((nuevo: number) => {
    setPageSize(nuevo)
    // Quedarse en la página 7 al pasar de 10 a 100 filas por página deja al
    // usuario fuera del rango y con una tabla vacía.
    setPage(1)
  }, [])

  return {
    page,
    pageSize,
    irA: setPage,
    cambiarTamanio,
    reiniciar: useCallback(() => setPage(1), []),
  }
}

/**
 * Controles de página, no scroll infinito (D-f).
 *
 * Es una aplicación de oficina: hace falta poder ir a la página 4 y saber
 * cuántas filas hay en total. El scroll infinito pelea con las dos cosas.
 */
export function ControlesPaginacion({
  resultado,
  paginacion,
  etiqueta = "registros",
}: {
  resultado: Pick<Paginado<unknown>, "total" | "page" | "pageSize" | "totalPages">
  paginacion: EstadoPaginacion
  etiqueta?: string
}) {
  const { total, page, pageSize, totalPages } = resultado
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Mostrando {desde}–{hasta} de {total} {etiqueta}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="filas-por-pagina" className="text-sm text-muted-foreground">
            Filas
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => paginacion.cambiarTamanio(Number(v))}
          >
            <SelectTrigger id="filas-por-pagina" size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAMANIOS.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => paginacion.irA(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <span className="text-sm tabular-nums">
            {page} / {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => paginacion.irA(page + 1)}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
