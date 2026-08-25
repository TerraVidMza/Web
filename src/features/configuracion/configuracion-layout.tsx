import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const PESTANIAS = [
  { to: "/configuracion", label: "Parámetros", exacta: true },
  { to: "/configuracion/catalogos", label: "Tablas maestras", exacta: false },
]

/** Configuración del sistema y tablas maestras (HU-33, HU-34). */
export function ConfiguracionLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Parámetros de la empresa y los valores con los que se cargan los cuarteles.
        </p>
      </div>

      <nav aria-label="Vistas de configuración" className="flex gap-1 border-b">
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
