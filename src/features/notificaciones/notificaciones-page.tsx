import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCheck } from "lucide-react"
import { useMarcarLeida, useMarcarTodasLeidas, useNotificaciones } from "./use-notificaciones"
import { useFormato } from "@/context/configuracion-context"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { ControlesPaginacion, usePaginacion } from "@/components/datos/paginacion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export function NotificacionesPage() {
  const [soloNoLeidas, setSoloNoLeidas] = useState(false)
  const paginacion = usePaginacion()
  const formato = useFormato()
  const marcarLeida = useMarcarLeida()
  const marcarTodas = useMarcarTodasLeidas()

  const params = useMemo(
    () => ({
      page: paginacion.page,
      pageSize: paginacion.pageSize,
      ...(soloNoLeidas ? { soloNoLeidas: true } : {}),
    }),
    [paginacion.page, paginacion.pageSize, soloNoLeidas]
  )

  const consulta = useNotificaciones(params)
  const notificaciones = consulta.data?.data ?? []
  const noLeidas = consulta.data?.noLeidas ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            {noLeidas > 0
              ? `Tenés ${noLeidas} sin leer.`
              : "Estás al día: no hay notificaciones sin leer."}
          </p>
        </div>
        {noLeidas > 0 && (
          <Button
            variant="outline"
            disabled={marcarTodas.isPending}
            onClick={() => marcarTodas.mutate()}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <Tabs
        value={soloNoLeidas ? "no-leidas" : "todas"}
        onValueChange={(v) => {
          setSoloNoLeidas(v === "no-leidas")
          paginacion.reiniciar()
        }}
      >
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="no-leidas">Sin leer{noLeidas > 0 && ` (${noLeidas})`}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={notificaciones.length}
            hayFiltros={soloNoLeidas}
            vacio={{
              titulo: "No tenés notificaciones",
              descripcion: "Acá van a aparecer las alertas de sensores y los avisos del sistema.",
            }}
            vacioPorFiltro={{
              titulo: "No tenés notificaciones sin leer",
              descripcion: "Cambiá a “Todas” para ver el historial.",
            }}
          >
            <ul className="divide-y">
              {notificaciones.map((notificacion) => (
                <li
                  key={notificacion.id}
                  className={cn("p-4", !notificacion.leida && "bg-accent/30")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{notificacion.titulo}</p>
                        <Badge variant="outline" className="text-xs">
                          {notificacion.tipo}
                        </Badge>
                        {!notificacion.leida && (
                          <Badge className="text-xs">Sin leer</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notificacion.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        {formato.fechaHora(notificacion.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {notificacion.urlAccion && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={notificacion.urlAccion}>Ver</Link>
                        </Button>
                      )}
                      {!notificacion.leida && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={marcarLeida.isPending}
                          onClick={() => marcarLeida.mutate(notificacion.id)}
                        >
                          Marcar leída
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {consulta.data && (
              <ControlesPaginacion
                resultado={consulta.data}
                paginacion={paginacion}
                etiqueta="notificaciones"
              />
            )}
          </EstadoConsulta>
        </CardContent>
      </Card>
    </div>
  )
}
