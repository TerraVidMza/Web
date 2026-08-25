import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const PESTANIAS = [
  { to: "/vendimia", label: "Remitos", exacta: true },
  { to: "/vendimia/cosecha", label: "Estado de cosecha", exacta: false },
  { to: "/vendimia/cuadrillas", label: "Cuadrillas", exacta: false },
]

/** Las tres vistas del circuito de vendimia (HU-23, 26, 27, 28). */
export function VendimiaLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Vendimia</h1>
        <p className="text-sm text-muted-foreground">
          Del pesaje en el cuartel al remito aprobado y liquidado por la bodega.
        </p>
      </div>

      <nav aria-label="Vistas de vendimia" className="flex gap-1 border-b">
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
