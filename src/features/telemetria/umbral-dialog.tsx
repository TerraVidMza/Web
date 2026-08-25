import { useEffect, useState } from "react"
import { z } from "zod"
import { Loader2, SlidersHorizontal, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { useFijarUmbral, useUmbral } from "./use-telemetria"
import type { Sensor } from "@/api/schemas/telemetria"
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
 * Un límite vacío significa **sin límite por ese lado**, no cero.
 *
 * El DTO del backend usa `@ValidateIf` en vez de `@IsOptional` justamente para
 * poder distinguir "no lo mandes" de "borralo", así que el cliente manda `null`
 * explícito cuando el campo queda vacío.
 */
const limite = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), "Ingresá un número válido")
  .transform((v) => (v ? Number(v) : null))

const schema = z
  .object({ umbralMinimo: limite, umbralMaximo: limite })
  .refine(
    (v) => v.umbralMinimo === null || v.umbralMaximo === null || v.umbralMinimo < v.umbralMaximo,
    { message: "El mínimo tiene que ser menor que el máximo", path: ["umbralMinimo"] }
  )
  .refine((v) => v.umbralMinimo !== null || v.umbralMaximo !== null, {
    message: "Configurá al menos uno de los dos límites",
    path: ["umbralMaximo"],
  })

/** Umbrales de alerta de un sensor (HU-21). */
export function UmbralDialog({ sensor }: { sensor: Sensor }) {
  const [abierto, setAbierto] = useState(false)
  const consulta = useUmbral(sensor.id)
  const fijar = useFijarUmbral()
  const umbral = consulta.data ?? null

  const form = useFormularioApi({
    schema,
    defaultValues: { umbralMinimo: "", umbralMaximo: "" },
    exito: null,
    error: "No se pudo guardar el umbral",
    onSubmit: async (valores) => {
      const guardado = await fijar.mutateAsync({ sensorId: sensor.id, ...valores })
      setAbierto(false)
      // `aviso` es `null` cuando no hay nada que advertir; cuando lo hay, es
      // información que el usuario necesita —por ejemplo, lecturas recientes
      // que ya quedarían fuera del rango recién configurado—.
      if (guardado.aviso) {
        toast.warning(guardado.aviso, { duration: 8000 })
      } else {
        toast.success("Umbral guardado")
      }
    },
  })

  useEffect(() => {
    if (!abierto) return
    form.reset({
      umbralMinimo: umbral?.umbralMinimo != null ? String(umbral.umbralMinimo) : "",
      umbralMaximo: umbral?.umbralMaximo != null ? String(umbral.umbralMaximo) : "",
    })
    // `form` es estable; incluirlo dispararía un reset por tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, umbral])

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Umbrales
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Umbrales de {sensor.codigo}</DialogTitle>
          <DialogDescription>
            Cuando una lectura sale de este rango, el sistema genera una alerta y avisa a
            los responsables de la finca.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="umbralMinimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="umbralMaximo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormDescription className="flex items-start gap-1.5">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Dejar un campo vacío significa <strong>sin límite por ese lado</strong>, no
              cero.
            </FormDescription>

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Guardar umbrales
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
