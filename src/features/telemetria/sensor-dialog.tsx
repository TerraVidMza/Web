import { useState, type ReactNode } from "react"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { useActualizarSensor, useCrearSensor } from "./use-telemetria"
import {
  ETIQUETA_TIPO_SENSOR,
  sensorTipoSchema,
  type Sensor,
  type SensorTipo,
} from "@/api/schemas/telemetria"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, "Ingresá el código")
    .max(50, "Máximo 50 caracteres"),
  tipo: sensorTipoSchema,
  descripcion: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
})

/**
 * Alta y edición de un sensor (HU-18).
 *
 * **El tipo no se puede cambiar después**, y no es una restricción de pantalla:
 * `UpdateSensorDto` solo acepta `codigo` y `descripcion`. Tiene sentido — las
 * lecturas ya ingeridas se interpretaron con ese tipo, y cambiarlo dejaría un
 * histórico de temperaturas etiquetado como humedad.
 *
 * El `codigo` sí se edita, pero es la etiqueta física con la que se aprovisiona
 * el nodo ESP32: cambiarlo sin cambiar el nodo corta la ingesta, porque el
 * dispositivo reporta por `codigoSensor`.
 */
export function SensorDialog({
  fincaId,
  sensor,
  children,
}: {
  fincaId: string
  sensor?: Sensor
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearSensor()
  const actualizar = useActualizarSensor()
  const esEdicion = sensor !== undefined

  function iniciales() {
    return {
      codigo: sensor?.codigo ?? "",
      tipo: (sensor?.tipo ?? "temperatura") as SensorTipo,
      descripcion: sensor?.descripcion ?? "",
    }
  }

  const form = useFormularioApi({
    schema,
    defaultValues: iniciales(),
    exito: esEdicion ? "Cambios guardados" : "Sensor creado",
    error: esEdicion ? "No se pudo actualizar el sensor" : "No se pudo crear el sensor",
    onSubmit: async (valores) => {
      if (esEdicion) {
        const { tipo: _tipo, ...editables } = valores
        await actualizar.mutateAsync({ id: sensor.id, ...editables })
      } else {
        await crear.mutateAsync({ fincaId, ...valores })
      }
    },
    onExito: () => setAbierto(false),
  })

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (v) form.reset(iniciales())
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? `Editar ${sensor.codigo}` : "Nuevo sensor"}</DialogTitle>
          <DialogDescription>
            El código es la etiqueta física del nodo: es lo que el ESP32 reporta al
            enviar lecturas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="SEN-01" {...field} />
                  </FormControl>
                  {esEdicion && (
                    <FormDescription>
                      Si lo cambiás, hay que reaprovisionar el nodo o dejará de ingresar
                      lecturas.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={esEdicion}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full" data-campo="tipo">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sensorTipoSchema.options.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {ETIQUETA_TIPO_SENSOR[tipo]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {esEdicion && (
                    <FormDescription>
                      No se cambia: las lecturas ya ingeridas se interpretaron con este
                      tipo.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Cabecera norte, a 1,5 m" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {esEdicion ? "Guardar cambios" : "Crear sensor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
