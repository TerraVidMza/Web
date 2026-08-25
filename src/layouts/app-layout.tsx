import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { Grape, LogOut, Menu, User } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useFormato } from "@/context/configuracion-context"
import { puede } from "@/auth/permisos"
import { ETIQUETA_ROL } from "@/auth/roles"
import { NAV_ITEMS } from "./nav-items"
import { CampanaNotificaciones } from "@/features/notificaciones/campana-notificaciones"
import { BotonTema } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function Navegacion({ alNavegar }: { alNavegar?: () => void }) {
  const { user } = useAuth()
  const visibles = NAV_ITEMS.filter((item) => puede(user?.rol, item.permiso))

  return (
    <nav aria-label="Secciones" className="flex-1 space-y-1 p-3">
      {visibles.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={alNavegar}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )
          }
        >
          <item.icon className="size-4" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function Marca() {
  const { nombreOrganizacion } = useFormato()
  return (
    <div className="flex items-center gap-2">
      <Grape className="size-5 text-primary" aria-hidden="true" />
      <span className="font-semibold">{nombreOrganizacion ?? "TerraVid"}</span>
    </div>
  )
}

function FichaUsuario({ compacta = false }: { compacta?: boolean }) {
  const { user, logout } = useAuth()
  const iniciales = user?.email?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-2">
      <Avatar className="size-8">
        <AvatarFallback>{iniciales}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user?.email}</p>
        <p className="truncate text-xs text-muted-foreground">
          {user && ETIQUETA_ROL[user.rol]}
        </p>
      </div>
      {!compacta && (
        <NavLink
          to="/perfil"
          className="rounded-md p-1.5 hover:bg-sidebar-accent"
          aria-label="Mi perfil"
          title="Mi perfil"
        >
          <User className="size-4" aria-hidden="true" />
        </NavLink>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => void logout()}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

export function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()

  return (
    <div className="flex min-h-svh">
      {/* Salto al contenido: sin esto, con teclado hay que tabular por todo el
          menú en cada página. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2"
      >
        Saltar al contenido
      </a>

      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Marca />
        </div>
        <Navegacion />
        <div className="border-t p-3">
          <FichaUsuario />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-2 border-b px-4">
          {/*
            Navegación mobile (W7). Abajo de 768 px el `<aside>` está oculto y
            el header solo tenía el logo y un botón de salir: **la aplicación no
            tenía forma de cambiar de sección en un teléfono.** `sheet.tsx` ya
            estaba instalado y sin usar.
          */}
          <div className="flex items-center gap-2">
            <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Abrir menú">
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
                <SheetHeader className="h-14 justify-center border-b px-4">
                  <SheetTitle asChild>
                    <div>
                      <Marca />
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <Navegacion alNavegar={() => setMenuAbierto(false)} />
                <div className="border-t p-3">
                  <FichaUsuario />
                </div>
              </SheetContent>
            </Sheet>
            <div className="md:hidden">
              <Marca />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <CampanaNotificaciones />
            <BotonTema />
          </div>
        </header>

        <main
          id="contenido"
          // La `key` reinicia el scroll al cambiar de ruta: sin esto se entra a
          // la pantalla nueva a la altura a la que estaba la anterior.
          key={location.pathname}
          className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
