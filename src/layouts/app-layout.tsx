import { NavLink, Outlet } from "react-router-dom"
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  Radio,
  Grape,
  Users,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { RolNombre } from "@/types/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: RolNombre[]
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/fincas", label: "Fincas y Cuarteles", icon: Map },
  { to: "/operaciones", label: "Operaciones", icon: ClipboardList },
  { to: "/telemetria", label: "Telemetría IoT", icon: Radio },
  { to: "/vendimia", label: "Vendimia", icon: Grape },
  { to: "/usuarios", label: "Usuarios", icon: Users, roles: [RolNombre.PROPIETARIO] },
  { to: "/configuracion", label: "Configuración", icon: Settings, roles: [RolNombre.PROPIETARIO] },
  { to: "/ayuda", label: "Ayuda", icon: HelpCircle },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.rol)))

  const iniciales = user?.email?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Grape className="size-5 text-primary" />
          <span className="font-semibold">TerraVid</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center gap-2 rounded-md px-2 py-2">
            <Avatar className="size-8">
              <AvatarFallback>{iniciales}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.email}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.rol}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => void logout()} title="Cerrar sesión">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Grape className="size-5 text-primary" />
            <span className="font-semibold">TerraVid</span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => void logout()}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
