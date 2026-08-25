import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const PESTANIAS = [
  { to: "/inteligencia", label: "Comparar campañas", exacta: true },
  { to: "/inteligencia/correlacion", label: "Correlación", exacta: false },
  { to: "/inteligencia/recomendaciones", label: "Recomendaciones", exacta: false },
  { to: "/inteligencia/campanias", label: "Campañas", exacta: false },
]

/** Las cuatro vistas de inteligencia agronómica (HU-29, 30, 31 + campañas). */
export function InteligenciaLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Inteligencia agronómica</h1>
        <p className="text-sm text-muted-foreground">
          Qué cambió entre campañas, qué relación hay entre el clima y el costo, y qué
          conviene hacer al respecto.
        </p>
      </div>

      <nav aria-label="Vistas de inteligencia" className="flex flex-wrap gap-1 border-b">
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
