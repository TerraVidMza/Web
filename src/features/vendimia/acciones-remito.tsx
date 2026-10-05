import { useState } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { Check, Loader2, X } from "lucide-react"
import { useAprobarRemito, useRechazarRemito } from "./use-vendimia"
import type { Remito } from "@/api/schemas/vendimia"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

/**
 * `@Length(10, 500)`: el motivo llega al Capataz como **única** explicación del
 * rechazo, así que un "no" no alcanza. La regla se replica acá para que el
 * usuario se entere antes de enviar y no después.
 */
const rechazoSchema = z.object({
  motivoRechazo: z
    .string()
    .trim()
    .min(10, "Explicá el motivo con al menos 10 caracteres: es lo único que ve el Capataz")
    .max(500, "Máximo 500 caracteres"),
})

function RechazarDialog({ remito }: { remito: Remito }) {
  const [abierto, setAbierto] = useState(false)
  const rechazar = useRechazarRemito()

  const form = useFormularioApi({
    schema: rechazoSchema,
    defaultValues: { motivoRechazo: "" },
    exito: `${remito.numeroRemito} quedó rechazado`,
    error: "No se pudo rechazar el remito",
    onSubmit: async (valores) => {
      await rechazar.mutateAsync({ id: remito.id, motivo: valores.motivoRechazo })
    },
    onExito: () => setAbierto(false),
  })

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        {/* Etiqueta explícita y no un sufijo `sr-only`: el botón se repite
            por fila, y el texto oculto además duplicaba el número de remito en
            el árbol accesible. */}
        <Button variant="outline" size="sm" aria-label={`Rechazar ${remito.numeroRemito}`}>
          <X className="size-4" aria-hidden="true" />
          Rechazar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar {remito.numeroRemito}</DialogTitle>
          <DialogDescription>
            Los pesajes del remito quedan <strong>observados</strong>, no vuelven a la cola:
            hay que corregirlos o anularlos antes de que entren en otro remito.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="motivoRechazo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo del rechazo</FormLabel>
                  <FormControl>
                    {/* Sin autoFocus: Radix ya lleva el foco al primer elemento del
                        diálogo, y forzarlo se salta el anuncio del título. */}
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormDescription>
                    Es lo único que va a ver quien cargó los pesajes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ErrorDelServidor form={form} />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Rechazar remito
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/** Aprobar y rechazar. Solo aparecen sobre un borrador y para quien puede. */
export function AccionesRemito({ remito }: { remito: Remito }) {
  const { user } = useAuth()
  const aprobar = useAprobarRemito()

  if (remito.estado !== "borrador" || !puede(user, "vendimiaAprobacion")) {
    return null
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <DialogoConfirmacion
        titulo={`¿Aprobar ${remito.numeroRemito}?`}
        descripcion="Los pesajes pasan a liquidados y el cuartel puede quedar marcado como cosechado. Después vas a poder cargar la liquidación de la bodega."
        textoConfirmar="Aprobar"
        tono="confirmacion"
        errorPorDefecto="No se pudo aprobar el remito"
        onConfirmar={async () => {
          await aprobar.mutateAsync(remito.id)
          toast.success(`${remito.numeroRemito} quedó aprobado`)
        }}
      >
        <Button size="sm" aria-label={`Aprobar ${remito.numeroRemito}`}>
          <Check className="size-4" aria-hidden="true" />
          Aprobar
        </Button>
      </DialogoConfirmacion>

      <RechazarDialog remito={remito} />
    </div>
  )
}
