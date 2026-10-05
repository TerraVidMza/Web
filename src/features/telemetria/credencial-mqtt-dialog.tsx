import { useState, type ReactNode } from "react"
import { Check, Copy, KeyRound, Loader2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { generarCredencialMqtt, type CredencialMqtt } from "@/api/endpoints/telemetria"
import type { Sensor } from "@/api/schemas/telemetria"
import { mensajeDeError } from "@/api/errores"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(valor)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-muted px-2 py-1.5 font-mono text-sm break-all">
          {valor}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Copiar ${etiqueta.toLowerCase()}`}
          onClick={() => void copiar()}
        >
          {copiado ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * Credencial MQTT de un sensor (D-026 del backend).
 *
 * La contraseña se muestra **una sola vez**: el broker guarda solo su hash.
 * Generar otra invalida la anterior, por eso hay un paso de confirmación antes
 * y el diálogo no la pide sola al abrirse.
 */
export function CredencialMqttDialog({ sensor, children }: { sensor: Sensor; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const [credencial, setCredencial] = useState<CredencialMqtt | null>(null)
  const [generando, setGenerando] = useState(false)

  async function generar() {
    setGenerando(true)
    try {
      setCredencial(await generarCredencialMqtt(sensor.id))
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo generar la credencial"))
    } finally {
      setGenerando(false)
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(valor) => {
        setAbierto(valor)
        // Al cerrar se descarta: la contraseña no queda en memoria.
        if (!valor) setCredencial(null)
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Credencial MQTT de {sensor.codigo}</DialogTitle>
          <DialogDescription>
            Con esta credencial el nodo publica sus lecturas por MQTT con TLS. Solo puede
            publicar en el tópico de este sensor.
          </DialogDescription>
        </DialogHeader>

        {credencial ? (
          <div className="space-y-3">
            <p className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Copiala ahora: la contraseña no se vuelve a mostrar. Si se pierde, generá una
              nueva.
            </p>
            {credencial.broker && <Dato etiqueta="Broker" valor={credencial.broker} />}
            <Dato etiqueta="Usuario" valor={credencial.usuario} />
            <Dato etiqueta="Contraseña" valor={credencial.password} />
            <Dato etiqueta="Tópico" valor={credencial.topico} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Si el sensor ya tenía una credencial, deja de servir en cuanto generes la nueva: el
            nodo se desconecta hasta que la cargues.
          </p>
        )}

        <DialogFooter>
          {credencial ? (
            <Button type="button" onClick={() => setAbierto(false)}>
              Listo, ya la copié
            </Button>
          ) : (
            <Button type="button" disabled={generando} onClick={() => void generar()}>
              {generando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="size-4" aria-hidden="true" />
              )}
              Generar credencial
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
