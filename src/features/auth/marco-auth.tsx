import type { ReactNode } from "react"
import { Logo } from "@/components/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/** Marco común de las cuatro pantallas de autenticación. */
export function MarcoAuth({
  titulo,
  descripcion,
  children,
  pie,
  logoGrande = false,
}: {
  titulo: string
  descripcion: string
  children: ReactNode
  pie?: ReactNode
  /** Login: logo grande como protagonista. Resto de pantallas de auth: chico. */
  logoGrande?: boolean
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Logo className={logoGrande ? "mb-2 h-20 w-20" : "mb-2 h-10 w-10"} />
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
