import { NavLink, Outlet } from "react-router-dom"
import { useAlertasPendientes } from "./use-telemetria"
import { cn } from "@/lib/utils"

/** Las dos vistas de Telemetría (HU-18, 20, 21, 22). */
export function TelemetriaLayout() {
  const alertas = useAlertasPendientes()
  const pendientes = alertas.data?.length ?? 0

  const pestanias = [
    { to: "/telemetria", label: "Sensores", exacta: true, contador: 0 },
    { to: "/telemetria/alertas", label: "Alertas", exacta: false, contador: pendientes },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Telemetría IoT</h1>
        <p className="text-sm text-muted-foreground">
          Los nodos del campo, lo que están midiendo y las alertas de umbral.
        </p>
      </div>

      <nav aria-label="Vistas de telemetría" className="flex gap-1 border-b">
        {pestanias.map((pestania) => (
          <NavLink
            key={pestania.to}
            to={pestania.to}
            end={pestania.exacta}
            className={({ isActive }) =>
              cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )
            }
          >
            {pestania.label}
            {pestania.contador > 0 && (
              <span className="rounded-full bg-destructive px-1.5 text-xs font-medium text-white tabular-nums">
                {pestania.contador}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
