import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, CheckCheck } from "lucide-react"
import { useMarcarLeida, useMarcarTodasLeidas, useNotificaciones } from "./use-notificaciones"
import type { Notificacion } from "@/api/schemas/notificacion"
import { useFormato } from "@/context/configuracion-context"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

/** Más de esto en el panel y deja de ser un panel; el resto va a la página. */
const EN_EL_PANEL = 8

export function CampanaNotificaciones() {
  const [abierto, setAbierto] = useState(false)
  const consulta = useNotificaciones({ pageSize: EN_EL_PANEL })
  const marcarLeida = useMarcarLeida()
  const marcarTodas = useMarcarTodasLeidas()
  const navigate = useNavigate()
  const formato = useFormato()

  const noLeidas = consulta.data?.noLeidas ?? 0
  const notificaciones = consulta.data?.data ?? []

  function abrir(notificacion: Notificacion) {
    if (!notificacion.leida) marcarLeida.mutate(notificacion.id)
    setAbierto(false)
    // `urlAccion` la escribe el backend como ruta relativa de la app.
    if (notificacion.urlAccion) navigate(notificacion.urlAccion)
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={
            noLeidas > 0
              ? `Notificaciones: ${noLeidas} sin leer`
              : "Notificaciones: ninguna sin leer"
          }
        >
          <Bell className="size-4" aria-hidden="true" />
          {noLeidas > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white tabular-nums"
              aria-hidden="true"
            >
              {noLeidas > 9 ? "9+" : noLeidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-medium">Notificaciones</p>
          {noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={marcarTodas.isPending}
              onClick={() => marcarTodas.mutate()}
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Marcar todas
            </Button>
          )}
        </div>
        <Separator />

        {consulta.isPending ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : notificaciones.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No tenés notificaciones.
          </p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {notificaciones.map((notificacion) => (
              <li key={notificacion.id}>
                <button
                  type="button"
                  onClick={() => abrir(notificacion)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left transition-colors hover:bg-accent",
                    !notificacion.leida && "bg-accent/40"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notificacion.leida && (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        aria-label="Sin leer"
                      />
                    )}
                    <div className={cn("min-w-0 flex-1", notificacion.leida && "pl-4")}>
                      <p className="truncate text-sm font-medium">{notificacion.titulo}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {notificacion.descripcion}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formato.fechaHora(notificacion.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Separator />
        <Button
          variant="ghost"
          className="w-full rounded-t-none text-sm"
          onClick={() => {
            setAbierto(false)
            navigate("/notificaciones")
          }}
        >
          Ver todas
        </Button>
      </PopoverContent>
    </Popover>
  )
}
