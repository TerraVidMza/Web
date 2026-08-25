import type { ReactNode } from "react"
import { Grape } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/** Marco común de las cuatro pantallas de autenticación. */
export function MarcoAuth({
  titulo,
  descripcion,
  children,
  pie,
}: {
  titulo: string
  descripcion: string
  children: ReactNode
  pie?: ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Grape className="size-5 text-primary" aria-hidden="true" />
          </div>
          {/* El título va en un `<h1>`: `CardTitle` de shadcn es un `<div>`, y
              una pantalla sin encabezado deja a quien navega con lector de
              pantalla sin saber dónde está. */}
          <CardTitle asChild>
            <h1>{titulo}</h1>
          </CardTitle>
          <CardDescription>{descripcion}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {pie}
        </CardContent>
      </Card>
    </div>
  )
}
