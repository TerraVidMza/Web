import { AlertTriangle, RotateCw } from "lucide-react"
import { useIndicadoresClave } from "./use-dashboard"
import {
  PanelAuditor,
  PanelCapataz,
  PanelEconomico,
  PanelEstadoCosecha,
  PanelOperativo,
} from "./paneles"
import { useAuth } from "@/context/auth-context"
import { ETIQUETA_ROL } from "@/auth/roles"
import { mensajeDeError } from "@/api/errores"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardPage() {
  const { user } = useAuth()
  const consulta = useIndicadoresClave()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de la operación. Sesión: {user?.email}
          {user && ` (${ETIQUETA_ROL[user.rol]})`}
        </p>
      </div>

      {consulta.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {consulta.isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
          <div role="alert">
            <p className="text-sm font-medium">No se pudo cargar el dashboard.</p>
            <p className="text-sm text-muted-foreground">{mensajeDeError(consulta.error)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void consulta.refetch()}>
            <RotateCw className="size-4" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      )}

      {/* El `switch` sobre el discriminante es lo que hace que TypeScript
          obligue a contemplar los cuatro roles. Sin la unión, el compilador
          dejaba pasar tarjetas que leían campos inexistentes. */}
      {consulta.data &&
        (() => {
          const datos = consulta.data
          switch (datos.rol) {
            case "Propietario":
            case "Agronomo":
              return (
                <>
                  <PanelOperativo datos={datos} />
                  <PanelEstadoCosecha datos={datos} />
                  <PanelEconomico datos={datos} />
                </>
              )
            case "Capataz":
              return (
                <>
                  <PanelOperativo datos={datos} />
                  <PanelEstadoCosecha datos={datos} />
                  <PanelCapataz datos={datos} />
                </>
              )
            case "Auditor":
              return <PanelAuditor datos={datos} />
          }
        })()}
    </div>
  )
}
