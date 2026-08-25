import { useState, type ReactNode } from "react"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  useActualizarCatalogoCosteable,
  useCrearCatalogoCosteable,
} from "./use-catalogo-costeable"
import type { CatalogoCosteableConfig } from "./config"
import {
  ETIQUETA_UNIDAD,
  unidadMedidaSchema,
  type Insumo,
  type UnidadMedida,
} from "@/api/schemas/operaciones"
import { nombreCorto } from "@/lib/campos"
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

const descripcion = z
  .string()
  .max(300, "Máximo 300 caracteres")
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : undefined))

/**
 * El costo inicial admite `0` (`@Min(0)` en el DTO de alta), a diferencia de los
 * cambios posteriores, que exigen un valor positivo (`@IsPositive`). No es un
 * descuido del backend: un insumo propio o donado tiene costo cero, pero
 * "corregir" un costo a cero borraría un dato en vez de registrar uno.
 */
const costoInicial = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), "Ingresá un número válido")
  .refine((v) => !v || Number(v) >= 0, "El costo no puede ser negativo")
  .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), "Máximo 2 decimales")
  .transform((v) => (v ? Number(v) : undefined))

const camposBase = z.object({
  nombre: nombreCorto,
  descripcion,
  unidadMedida: unidadMedidaSchema,
  costoUnitarioInicial: costoInicial,
})

/**
 * Los dos schemas tienen **la misma forma de entrada y de salida**; el de alta
 * solo agrega una condición. Eso es lo que permite un único `useFormularioApi`
 * —y por lo tanto un único juego de campos— en vez de dos formularios gemelos
 * con la deriva que eso trae.
 *
 * El costo no aparece al editar porque no se sobrescribe: se agrega una
 * vigencia nueva. Ofrecer el campo sugeriría que reescribe el precio histórico.
 */
const schemaEdicion = camposBase
const schemaAlta = camposBase.refine(
  (valores) => valores.costoUnitarioInicial !== undefined,
  { message: "Ingresá el costo inicial", path: ["costoUnitarioInicial"] }
)

type Valores = z.output<typeof camposBase>

export function CatalogoDialog({
  config,
  item,
  children,
}: {
  config: CatalogoCosteableConfig
  /** Ausente = alta. */
  item?: Insumo
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearCatalogoCosteable(config)
  const actualizar = useActualizarCatalogoCosteable(config)
  const esEdicion = item !== undefined

  function iniciales() {
    return {
      nombre: item?.nombre ?? "",
      descripcion: item?.descripcion ?? "",
      unidadMedida: (item?.unidadMedida ?? "kg") as UnidadMedida,
      costoUnitarioInicial: "",
    }
  }

  const form = useFormularioApi({
    schema: esEdicion ? schemaEdicion : schemaAlta,
    defaultValues: iniciales(),
    exito: esEdicion ? "Cambios guardados" : `Se creó ${config.articulo} ${config.singular}`,
    error: esEdicion
      ? `No se pudo actualizar ${config.articulo} ${config.singular}`
      : `No se pudo crear ${config.articulo} ${config.singular}`,
    onSubmit: async (valores: Valores) => {
      const { costoUnitarioInicial, ...comunes } = valores
      if (esEdicion) {
        await actualizar.mutateAsync({ id: item.id, ...comunes })
        return
      }
      if (costoUnitarioInicial === undefined) {
        // Inalcanzable: lo garantiza el refine de `schemaAlta`. Se comprueba de
        // todos modos para no mandar un 0 silencioso si ese refine se rompe.
        throw new Error("Falta el costo inicial")
      }
      await crear.mutateAsync({ ...comunes, costoUnitarioInicial })
    },
    onExito: () => setAbierto(false),
  })

  function alCambiar(nuevoAbierto: boolean) {
    setAbierto(nuevoAbierto)
    if (nuevoAbierto) form.reset(iniciales())
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiar}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${item.nombre}` : `Nuevo ${config.singular}`}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "El costo no se edita acá: se agrega una vigencia nueva, para no reescribir el histórico."
              : "El costo inicial rige desde hoy. Después se cambia agregando una nueva vigencia."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unidadMedida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad de medida</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full" data-campo="unidadMedida">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unidadMedidaSchema.options.map((unidad) => (
                        <SelectItem key={unidad} value={unidad}>
                          {ETIQUETA_UNIDAD[unidad]} ({unidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{config.ayudaUnidad}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!esEdicion && (
              <FormField
                control={form.control}
                name="costoUnitarioInicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo unitario inicial</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Puede ser 0 si no tiene costo. Rige desde hoy.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {esEdicion ? "Guardar cambios" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
