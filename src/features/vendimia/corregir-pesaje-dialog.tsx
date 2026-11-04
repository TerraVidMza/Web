import { useState } from "react"
import { z } from "zod"
import { Loader2, Pencil } from "lucide-react"
import { useCorregirPesaje } from "./use-vendimia"
import type { Pesaje } from "@/api/schemas/vendimia"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

/** `@IsNumber() @Min(0.01)` en el backend; los kilos se cargan con hasta 2 decimales. */
const correccionSchema = z.object({
  kgTotales: z
    .string()
    .trim()
    .min(1, "Ingresá los kilos")
    .refine((v) => !Number.isNaN(Number(v)), "Ingresá un número válido")
    .transform(Number)
    .refine((v) => v >= 0.01, "Los kilos deben ser mayores que 0"),
  fecha: z.string().min(1, "Elegí la fecha"),
})

/**
 * Corrección de un pesaje observado, es decir, uno que quedó así porque el
 * remito que lo contenía fue rechazado. Al guardar vuelve a `pendiente_remito`
 * y entra en el próximo borrador. Todo cambio queda en el log de auditoría.
 */
export function CorregirPesajeDialog({ pesaje }: { pesaje: Pesaje }) {
  const [abierto, setAbierto] = useState(false)
  const corregir = useCorregirPesaje()

  const valores = () => ({
    kgTotales: String(pesaje.kgTotales),
    fecha: pesaje.fecha.slice(0, 10),
  })

  const form = useFormularioApi({
    schema: correccionSchema,
    defaultValues: valores(),
    exito: "Pesaje corregido: vuelve a la cola de remitos",
    error: "No se pudo corregir el pesaje",
    onSubmit: async (datos) => {
      await corregir.mutateAsync({ id: pesaje.id, ...datos })
    },
    onExito: () => setAbierto(false),
  })

  return (
    <Dialog
      open={abierto}
      onOpenChange={(nuevo) => {
        setAbierto(nuevo)
        if (nuevo) form.reset(valores())
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" aria-hidden="true" />
          Corregir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corregir pesaje</DialogTitle>
          <DialogDescription>
            Este pesaje quedó observado porque su remito fue rechazado. Al guardar, la
            tarifa y el monto se recalculan y vuelve a la cola para el próximo remito.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="kgTotales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kilos</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ErrorDelServidor form={form} />
            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Guardar corrección
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
