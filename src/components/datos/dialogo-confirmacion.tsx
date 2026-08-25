import { useState, type ReactNode } from "react"
import { AlertDialog } from "radix-ui"
import { AlertTriangle, CircleHelp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mensajeDeError } from "@/api/errores"
import { cn } from "@/lib/utils"

interface Props {
  /** El disparador; se renderiza tal cual con `asChild`. */
  children: ReactNode
  titulo: string
  descripcion: ReactNode
  textoConfirmar: string
  /** Debe lanzar si falla: el error se muestra dentro del diálogo. */
  onConfirmar: () => Promise<void>
  /** Mensaje de respaldo si el backend no manda uno. */
  errorPorDefecto?: string
  /**
   * `destructivo` para bajas y borrados; `confirmacion` para acciones que
   * conviene revisar pero no destruyen nada —aprobar un remito, por ejemplo—.
   * Pintar de rojo un "Aprobar" enseña a ignorar el color.
   */
  tono?: "destructivo" | "confirmacion"
}

/**
 * Confirmación de una acción destructiva.
 *
 * Usa `AlertDialog` y no `Dialog`: el rol `alertdialog` hace que un lector de
 * pantalla anuncie el contenido al abrirse en vez de esperar a que el usuario
 * lo recorra, y no se cierra con un clic afuera.
 *
 * **El error se muestra acá adentro y el diálogo no se cierra.** Es deliberado:
 * las bajas de este sistema fallan con reglas de negocio que el backend explica
 * bien —"La finca tiene 3 cuartel(es) activo(s). Dales de baja primero.", "El
 * cuartel tiene 2 labor(es) y 1 pesaje(s) registrados en la campaña actual"— y
 * mandar eso a un toast que se va solo desperdicia la única indicación de qué
 * hacer a continuación.
 */
export function DialogoConfirmacion({
  children,
  titulo,
  descripcion,
  textoConfirmar,
  onConfirmar,
  errorPorDefecto = "No se pudo completar la operación",
  tono = "destructivo",
}: Props) {
  const esDestructivo = tono === "destructivo"
  const Icono = esDestructivo ? AlertTriangle : CircleHelp
  const [abierto, setAbierto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function alCambiar(nuevoAbierto: boolean) {
    setAbierto(nuevoAbierto)
    if (!nuevoAbierto) setError(null)
  }

  async function confirmar() {
    setEnviando(true)
    setError(null)
    try {
      await onConfirmar()
      setAbierto(false)
    } catch (e) {
      setError(mensajeDeError(e, errorPorDefecto))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AlertDialog.Root open={abierto} onOpenChange={alCambiar}>
      <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <AlertDialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4",
            "rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-md",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          )}
        >
          <div className="flex gap-3">
            <div
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                esDestructivo ? "bg-destructive/10" : "bg-primary/10"
              )}
            >
              <Icono
                className={cn("size-4", esDestructivo ? "text-destructive" : "text-primary")}
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1.5">
              <AlertDialog.Title className="font-heading text-base leading-snug font-medium">
                {titulo}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-muted-foreground">
                {descripcion}
              </AlertDialog.Description>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={enviando}>
                Cancelar
              </Button>
            </AlertDialog.Cancel>
            {/* Fuera de `AlertDialog.Action`: ese componente cierra el diálogo
                al hacer clic, y acá el cierre depende de que la request salga
                bien. */}
            <Button
              variant={esDestructivo ? "destructive" : "default"}
              disabled={enviando}
              onClick={() => void confirmar()}
            >
              {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {textoConfirmar}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
