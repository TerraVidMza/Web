import { useState } from "react";
import { z } from "zod";
import { Ban, Loader2, Pencil } from "lucide-react";
import { useAnularLabor, useCorregirLabor } from "./use-historial";
import type { RegistroLabor } from "@/api/schemas/operaciones";
import { useFormularioApi } from "@/components/formulario/use-formulario-api";
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/** `@IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01)` del backend. */
const correccionSchema = z.object({
  cantidad: z
    .string()
    .trim()
    .min(1, "Ingresá la cantidad")
    .refine((v) => !Number.isNaN(Number(v)), "Ingresá un número válido")
    .transform(Number)
    .refine((v) => v >= 0.01, "La cantidad debe ser mayor que 0")
    .refine((v) => Math.round(v * 100) / 100 === v, "Máximo 2 decimales"),
});

/** Mínimo 10 caracteres: es lo único que queda para entender después por qué. */
const anulacionSchema = z.object({
  motivoAnulacion: z
    .string()
    .trim()
    .min(10, "Explicá el motivo con al menos 10 caracteres: queda registrado")
    .max(500, "Máximo 500 caracteres"),
});

function CorregirDialog({ registro }: { registro: RegistroLabor }) {
  const [abierto, setAbierto] = useState(false);
  const corregir = useCorregirLabor();

  const form = useFormularioApi({
    schema: correccionSchema,
    defaultValues: { cantidad: String(registro.cantidad) },
    exito: "Labor corregida",
    error: "No se pudo corregir la labor",
    onSubmit: async (valores) => {
      await corregir.mutateAsync({
        id: registro.id,
        cantidad: valores.cantidad,
      });
    },
    onExito: () => setAbierto(false),
  });

  return (
    <Dialog
      open={abierto}
      onOpenChange={(nuevo) => {
        setAbierto(nuevo);
        if (nuevo) form.reset({ cantidad: String(registro.cantidad) });
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Corregir labor">
          <Pencil className="size-4" aria-hidden="true" />
          Corregir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corregir labor</DialogTitle>
          <DialogDescription>
            Cambia la cantidad cargada; el costo se recalcula con el costo
            unitario que ya tenía la labor. Solo se puede mientras la campaña
            siga abierta. Si el error es otro (cuartel, tipo de labor o
            insumos), anulá esta labor y cargá una nueva.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => void form.enviar(e)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="cantidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Cantidad
                    {registro.tipoLabor?.unidadMedida
                      ? ` (${registro.tipoLabor.unidadMedida})`
                      : ""}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ErrorDelServidor form={form} />
            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Guardar corrección
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AnularDialog({ registro }: { registro: RegistroLabor }) {
  const [abierto, setAbierto] = useState(false);
  const anular = useAnularLabor();

  const form = useFormularioApi({
    schema: anulacionSchema,
    defaultValues: { motivoAnulacion: "" },
    exito: "Labor anulada",
    error: "No se pudo anular la labor",
    onSubmit: async (valores) => {
      await anular.mutateAsync({
        id: registro.id,
        motivo: valores.motivoAnulacion,
      });
    },
    onExito: () => setAbierto(false),
  });

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Anular labor">
          <Ban className="size-4" aria-hidden="true" />
          Anular
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular labor</DialogTitle>
          <DialogDescription>
            La labor sale del historial y de todos los costos. No se borra:
            queda registrado quién la anuló y por qué.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => void form.enviar(e)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="motivoAnulacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de la anulación</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormDescription>
                    Obligatorio y queda en el registro de auditoría.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ErrorDelServidor form={form} />
            <DialogFooter>
              <Button
                type="submit"
                variant="destructive"
                disabled={form.enviando}
              >
                {form.enviando && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Anular labor
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Corregir la cantidad o anular una labor. Solo el Propietario y el Agrónomo:
 * el Capataz carga, pero no reescribe lo ya sincronizado (es costo).
 */
export function AccionesLabor({ registro }: { registro: RegistroLabor }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <CorregirDialog registro={registro} />
      <AnularDialog registro={registro} />
    </div>
  );
}
