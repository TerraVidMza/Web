import { AlertTriangle, FileWarning, Grape, LandPlot, MapPinned, Wallet } from "lucide-react"
import { useDashboardIndicadores } from "@/hooks/use-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatKg, formatNumber } from "@/lib/format"
import { useAuth } from "@/context/auth-context"

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  hint?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useDashboardIndicadores()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de la operación. Sesión: {user?.email} ({user?.rol})
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">No se pudo cargar el dashboard. Intentá nuevamente más tarde.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard title="Fincas activas" value={formatNumber(data.fincasActivas)} icon={LandPlot} />
            <StatCard title="Cuarteles activos" value={formatNumber(data.cuartelesActivos)} icon={MapPinned} />
            <StatCard
              title="Alertas IoT pendientes"
              value={formatNumber(data.alertasIotPendientes)}
              icon={AlertTriangle}
              hint={data.alertasIotPendientes > 0 ? "Requieren revisión" : "Todo en orden"}
            />
            <StatCard
              title="Remitos pendientes"
              value={formatNumber(data.remitosPendientesAprobacion)}
              icon={FileWarning}
              hint="Esperando aprobación"
            />
            <StatCard
              title="Kg cosechados (campaña actual)"
              value={formatKg(data.kgCosechadosCampaniaActual)}
              icon={Grape}
            />
            <StatCard
              title="Costo operativo total"
              value={formatCurrency(data.costoLaboresTotal + data.costoInsumosTotal)}
              icon={Wallet}
              hint={`Labores ${formatCurrency(data.costoLaboresTotal)} · Insumos ${formatCurrency(data.costoInsumosTotal)}`}
            />
          </>
        )}
      </div>
    </div>
  )
}
