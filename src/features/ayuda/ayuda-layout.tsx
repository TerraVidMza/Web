import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const PESTANIAS = [
  { to: "/ayuda", label: "Manual y FAQ", exacta: true },
  { to: "/ayuda/soporte", label: "Pedir ayuda", exacta: false },
]

/** Centro de ayuda (HU-36). */
export function AyudaLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Ayuda</h1>
        <p className="text-sm text-muted-foreground">
          Cómo se usa cada parte del sistema, y cómo pedir ayuda si algo no funciona.
        </p>
      </div>

      <nav aria-label="Vistas de ayuda" className="flex gap-1 border-b">
        {PESTANIAS.map((pestania) => (
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
