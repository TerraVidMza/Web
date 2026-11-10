import type { ReactNode } from "react"
import { Logo } from "@/components/logo"
import { BotonTema } from "@/components/theme-provider"
import logoCompleto from "@/assets/logo-completo.png"
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
  /** Login: el logo completo (racimo, nombre y lema) como protagonista. Resto de pantallas de auth: logo chico y título visible. */
  logoGrande?: boolean
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="absolute right-4 top-4">
        <BotonTema />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          {logoGrande ? (
            // Logo a color con letras violetas oscuras: en modo oscuro se apoya
            // sobre un panel blanco para que no se pierda contra el fondo.
            <img
              src={logoCompleto}
              alt=""
              className="mx-auto mb-2 block h-44 w-auto max-w-full rounded-xl object-contain dark:bg-white dark:p-3"
            />
          ) : (
            <Logo className="mb-2 h-10 w-10" />
          )}
          {/* El título va en un `<h1>`: `CardTitle` de shadcn es un `<div>`, y
              una pantalla sin encabezado deja a quien navega con lector de
              pantalla sin saber dónde está. Con el logo completo el nombre ya
              se ve escrito en la imagen: el título queda solo para lectores. */}
          <CardTitle asChild>
            <h1 className={logoGrande ? "sr-only" : undefined}>{titulo}</h1>
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
