import { useState } from "react"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { clasificarVigencias, hoyIso, useCostos, useFijarCosto } from "./use-catalogo-costeable"
import type { CatalogoCosteableConfig } from "./config"
import type { Insumo } from "@/api/schemas/operaciones"
import { useFormato } from "@/context/configuracion-context"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

/** `@IsPositive()`: los cambios de costo, a diferencia del inicial, no aceptan 0. */
const schema = z.object({
  costoUnitario: z
    .string()
    .trim()
    .min(1, "Ingresá el costo")
    .refine((v) => !Number.isNaN(Number(v)), "Ingresá un número válido")
    .refine((v) => Number(v) > 0, "El costo debe ser mayor que 0")
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Máximo 2 decimales")
    .transform(Number),
  validFrom: z
    .string()
    .min(1, "Ingresá la fecha de vigencia")
    // Misma regla que `@EsFechaNoRetroactiva`: una fecha pasada reescribiría el
    // costo ya aplicado a labores históricas, que es lo que el versionado evita.
    .refine((v) => v >= hoyIso(), "La vigencia no puede ser retroactiva"),
})

export function CostosDialog({
  config,
  item,
  onCerrar,
}: {
  config: CatalogoCosteableConfig
  /** `null` cierra el diálogo. */
  item: Insumo | null
  onCerrar: () => void
}) {
  const [mostrandoAlta, setMostrandoAlta] = useState(false)
  const consulta = useCostos(config, item?.id ?? null)
  const fijar = useFijarCosto(config)
  const formato = useFormato()

  const form = useFormularioApi({
    schema,
    defaultValues: { costoUnitario: "", validFrom: hoyIso() },
    exito: "Nuevo costo registrado",
    error: "No se pudo registrar el costo",
    onSubmit: async (valores) => {
      await fijar.mutateAsync({ id: item!.id, ...valores })
    },
    onExito: () => setMostrandoAlta(false),
  })

  const costos = clasificarVigencias(consulta.data ?? [])

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(abierto) => {
        if (!abierto) {
          setMostrandoAlta(false)
          onCerrar()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Costos de {item?.nombre}</DialogTitle>
          <DialogDescription>
            Cada cambio es una vigencia nueva y no borra las anteriores: las labores ya
            registradas conservan el costo que regía ese día.
          </DialogDescription>
        </DialogHeader>

        <EstadoConsulta
          consulta={consulta}
          cantidad={costos.length}
          vacio={{ titulo: "Todavía no hay costos cargados" }}
          filasEsqueleto={3}
        >
          <ul className="divide-y">
            {costos.map((costo) => (
              <li key={costo.id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {formato.dinero(costo.costoUnitario)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    por {item?.unidadMedida}
                  </span>
                  {costo.esVigente && <Badge>Vigente</Badge>}
                  {/* El historial viene ordenado por fecha descendente, así que
                      un costo con vigencia futura encabeza la lista sin ser el
                      que rige hoy. Sin esta marca se leería como el actual. */}
                  {costo.esFuturo && <Badge variant="outline">Programado</Badge>}
                </div>
                <span className="text-sm text-muted-foreground">
                  desde {formato.fecha(costo.validFrom)}
                </span>
              </li>
            ))}
          </ul>
        </EstadoConsulta>

        <Separator />

        {mostrandoAlta ? (
          <Form {...form}>
            <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="costoUnitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo costo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rige desde</FormLabel>
                      <FormControl>
                        <Input type="date" min={hoyIso()} {...field} />
                      </FormControl>
                      <FormDescription>Hoy o más adelante.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <ErrorDelServidor form={form} />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrandoAlta(false)}
                  disabled={form.enviando}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.enviando}>
                  {form.enviando && (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  Registrar costo
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Button variant="outline" onClick={() => setMostrandoAlta(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo costo
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
