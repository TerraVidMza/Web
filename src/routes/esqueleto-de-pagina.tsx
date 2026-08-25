import { Skeleton } from "@/components/ui/skeleton"

/** Fallback de `<Suspense>` mientras se descarga el chunk de la ruta. */
export function EsqueletoDePagina() {
  return (
    <output className="block space-y-6 p-4 md:p-6" aria-label="Cargando la sección">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </output>
  )
}
