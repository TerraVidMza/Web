import { toast } from "sonner"
import { Link } from "react-router-dom"
import { CheckCircle2, ShieldCheck } from "lucide-react"
import { useAlertasPendientes, useRevisarAlerta } from "./use-telemetria"
import { useFormato } from "@/context/configuracion-context"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Alertas de umbral pendientes de revisión (HU-22).
 *
 * El endpoint devuelve **solo las pendientes** y sin paginar: es una bandeja de
 * trabajo, no un histórico. Marcar como revisada la saca de acá.
 */
export function AlertasPage() {
  const consulta = useAlertasPendientes()
  const revisar = useRevisarAlerta()
  const formato = useFormato()

  const alertas = consulta.data ?? []

  return (
    <Card>
      <CardContent className="p-0">
        <EstadoConsulta
          consulta={consulta}
          cantidad={alertas.length}
          vacio={{
            titulo: "No hay alertas pendientes",
            descripcion: "Todos los sensores están midiendo dentro de sus umbrales.",
          }}
        >
          <ul className="divide-y">
            {alertas.map((alerta) => (
              <li key={alerta.id} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-red-300 text-red-800 dark:border-red-800 dark:text-red-300"
                    >
                      {alerta.tipoAlerta === "umbral_maximo" ? "Superó el máximo" : "Cayó del mínimo"}
                    </Badge>
                    {alerta.sensor && (
                      <Link
                        to={`/sensores/${alerta.sensorId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {alerta.sensor.codigo}
                      </Link>
                    )}
                    {alerta.sensor?.finca?.nombre && (
                      <span className="text-sm text-muted-foreground">
                        · {alerta.sensor.finca.nombre}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Midió{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {formato.numero(alerta.valorLectura, { maximumFractionDigits: 2 })}
                    </span>{" "}
                    contra un umbral de{" "}
                    <span className="tabular-nums">
                      {formato.numero(alerta.umbralSuperado, { maximumFractionDigits: 2 })}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formato.fechaHora(alerta.timestampLectura)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={revisar.isPending}
                  aria-label={`Marcar como revisada la alerta de ${alerta.sensor?.codigo ?? "sensor"}`}
                  onClick={async () => {
                    await revisar.mutateAsync(alerta.id)
                    toast.success("Alerta marcada como revisada")
                  }}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Revisada
                </Button>
              </li>
            ))}
          </ul>
        </EstadoConsulta>

        {alertas.length > 0 && (
          <p className="flex items-start gap-1.5 border-t px-4 py-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Marcar una alerta como revisada la saca de esta bandeja, pero no cambia el
            umbral: si la causa sigue, la próxima lectura fuera de rango genera otra.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
