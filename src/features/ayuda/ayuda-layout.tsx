import { NavLink, Outlet } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import { puede, type Permiso } from "@/auth/permisos"
import { cn } from "@/lib/utils"

const PESTANIAS: { to: string; label: string; exacta: boolean; permiso: Permiso }[] = [
  { to: "/ayuda", label: "Manual de usuario", exacta: true, permiso: "manual" },
  // Los pedidos son por empresa: el Administrador de plataforma no tiene una.
  { to: "/ayuda/soporte", label: "Pedir ayuda", exacta: false, permiso: "ayuda" },
]

/** Centro de ayuda (HU-36). */
export function AyudaLayout() {
  const { user } = useAuth()
  const visibles = PESTANIAS.filter((p) => puede(user, p.permiso))
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Ayuda</h1>
        <p className="text-sm text-muted-foreground">
          Cómo se usa cada parte del sistema, y cómo pedir ayuda si algo no funciona.
        </p>
      </div>

      <nav aria-label="Vistas de ayuda" className="flex gap-1 border-b">
        {visibles.map((pestania) => (
          <NavLink
            key={pestania.to}
            to={pestania.to}
            end={pestania.exacta}
            className={({ isActive }) =>
              cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )
            }
          >
            {pestania.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
