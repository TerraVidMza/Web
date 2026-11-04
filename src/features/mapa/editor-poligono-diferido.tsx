import { lazy, Suspense, type ComponentProps } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Leaflet toca `window` al cargarse y pesa lo suyo: solo se descarga cuando se
// abre un diálogo que dibuja, no con la pantalla de fincas.
const Editor = lazy(() => import("./editor-poligono").then((m) => ({ default: m.EditorPoligono })))

export function EditorPoligonoDiferido(props: ComponentProps<typeof Editor>) {
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full" />}>
      <Editor {...props} />
    </Suspense>
  )
}
