import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const PESTANIAS = [
  { to: "/operaciones", label: "Costeo", exacta: true },
  { to: "/operaciones/insumos", label: "Insumos", exacta: false },
  { to: "/operaciones/tipos-labor", label: "Tipos de labor", exacta: false },
]

/**
 * Las tres vistas de Operaciones (HU-15, HU-16).
 *
 * Son rutas y no un `<Tabs>` con estado local para que cada una tenga URL
 * propia: en una aplicación de oficina hace falta poder mandarle a alguien el
 * enlace del catálogo de insumos, no "entrá a Operaciones y hacé clic en la
 * segunda pestaña".
 */
export function OperacionesLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Operaciones</h1>
        <p className="text-sm text-muted-foreground">
          Costo de cada cuartel y los catálogos con los que se calcula.
        </p>
      </div>

      <nav aria-label="Vistas de operaciones" className="flex gap-1 border-b">
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
