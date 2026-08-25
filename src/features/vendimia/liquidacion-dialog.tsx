import { useEffect, useState } from "react"
import { z } from "zod"
import { Loader2, Receipt } from "lucide-react"
import { useLiquidacion, useRegistrarLiquidacion } from "./use-vendimia"
import { hoyIso } from "@/features/operaciones/catalogos/use-catalogo-costeable"
import type { RemitoDetalle } from "@/api/schemas/vendimia"
import { useFormato } from "@/context/configuracion-context"
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

function numeroPositivo(mensaje: string, minimo: number, decimales: number) {
  return z
    .string()
    .trim()
    .min(1, mensaje)
    .refine((v) => !Number.isNaN(Number(v)), "Ingresá un número válido")
    .refine((v) => Number(v) >= minimo, mensaje)
    .refine(
      (v) => new RegExp(`^\\d+(\\.\\d{1,${decimales}})?$`).test(v),
      `Máximo ${decimales} decimales`
    )
    .transform(Number)
}

const schema = z
  .object({
    bodega: z.string().trim().min(2, "Ingresá la bodega").max(150, "Máximo 150 caracteres"),
    // `@Min(0.01)` y `maxDecimalPlaces: 2` en el DTO.
    kgAceptados: numeroPositivo("Los kilos aceptados deben ser mayores que 0", 0.01, 2),
    // `@Min(0.0001)` y `maxDecimalPlaces: 4`.
    precioPorKg: numeroPositivo("El precio debe ser mayor que 0", 0.0001, 4),
    descuentos: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || !Number.isNaN(Number(v)), "Ingresá un número válido")
      .refine((v) => !v || Number(v) >= 0, "Los descuentos no pueden ser negativos")
      .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), "Máximo 2 decimales")
      .transform((v) => (v ? Number(v) : undefined)),
    fecha: z.string().min(1, "Ingresá la fecha de la liquidación"),
    numeroComprobante: z
      .string()
      .max(50, "Máximo 50 caracteres")
      .optional()
      .transform((v) => (v?.trim() ? v.trim() : undefined)),
  })
  // El backend responde 400 si el neto queda negativo; adelantarlo evita un
  // viaje de ida y vuelta para enterarse.
  .refine(
    (v) => v.kgAceptados * v.precioPorKg - (v.descuentos ?? 0) >= 0,
    {
      message: "Los descuentos no pueden superar el importe bruto",
      path: ["descuentos"],
    }
  )

/**
 * Liquidación de bodega (D-005, HU-27).
 *
 * Es **la única fuente de ingreso del sistema**: el `totalLiquidacion` del
 * remito es lo que se le paga a la cuadrilla por cosechar, o sea un costo. Sin
 * esta carga, el margen bruto del costeo queda en "no se sabe" — que es
 * distinto de cero.
 *
 * Los kilos aceptados no se derivan del remito: la bodega descuenta por materia
 * extraña, sanidad o diferencia de balanza, así que se cargan aparte y se
 * muestran los dos.
 */
export function LiquidacionDialog({ remito }: { remito: RemitoDetalle }) {
  const [abierto, setAbierto] = useState(false)
  const consulta = useLiquidacion(remito.id, remito.estado === "aprobado")
  const registrar = useRegistrarLiquidacion()
  const formato = useFormato()
  const existente = consulta.data ?? null

  const form = useFormularioApi({
    schema,
    defaultValues: {
      bodega: "",
      kgAceptados: "",
      precioPorKg: "",
      descuentos: "",
      fecha: hoyIso(),
      numeroComprobante: "",
    },
    exito: "Liquidación registrada",
    error: "No se pudo registrar la liquidación",
    onSubmit: async (valores) => {
      await registrar.mutateAsync({ remitoId: remito.id, ...valores })
    },
    onExito: () => setAbierto(false),
  })

  // Al abrir, precarga lo ya cargado: el `PUT` corrige en vez de duplicar, y
  // partir de los valores actuales es lo que hace usable una corrección.
  useEffect(() => {
    if (!abierto) return
    form.reset({
      bodega: existente?.bodega ?? "",
      kgAceptados: existente ? String(existente.kgAceptados) : String(remito.totalKg ?? ""),
      precioPorKg: existente ? String(existente.precioPorKg) : "",
      descuentos: existente ? String(existente.descuentos) : "",
      fecha: existente?.fecha ?? hoyIso(),
      numeroComprobante: existente?.numeroComprobante ?? "",
    })
    // `form` es estable; incluirlo dispararía un reset por tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, existente, remito.totalKg])

  if (remito.estado !== "aprobado") return null

  const kg = Number(form.watch("kgAceptados")) || 0
  const precio = Number(form.watch("precioPorKg")) || 0
  const descuentos = Number(form.watch("descuentos")) || 0
  const neto = kg * precio - descuentos

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant={existente ? "outline" : "default"}>
          <Receipt className="size-4" aria-hidden="true" />
          {existente ? "Editar liquidación" : "Cargar liquidación"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Liquidación de {remito.numeroRemito}</DialogTitle>
          <DialogDescription>
            Lo que la bodega pagó por esta entrega. Es el ingreso con el que se calcula el
            margen bruto del cuartel.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="bodega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bodega</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="kgAceptados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilos aceptados</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Despachados: {formato.kg(remito.totalKg)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="precioPorKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio por kg</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" min="0.0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="descuentos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descuentos</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
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
                    <FormLabel>Fecha de liquidación</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="numeroComprobante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N.º de comprobante</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="rounded-md bg-muted px-3 py-2 text-sm">
              Importe neto:{" "}
              <strong className="tabular-nums">{formato.dinero(neto)}</strong>
              <span className="text-muted-foreground">
                {" "}
                ({formato.dinero(kg * precio)} − {formato.dinero(descuentos)})
              </span>
            </p>

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {existente ? "Guardar cambios" : "Registrar liquidación"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
