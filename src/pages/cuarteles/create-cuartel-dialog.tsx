import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import { useCreateCuartel } from "@/hooks/use-cuarteles"
import { useCatalogo } from "@/hooks/use-catalogos"
import { CatalogoTipo } from "@/types/catalogo"
import { getApiErrorMessage } from "@/lib/api"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const cuartelSchema = z.object({
  nombre: z.string().min(1, "Ingresá un nombre").max(100),
  variedadId: z.string().min(1, "Seleccioná una variedad"),
  sistemaConduccionId: z.string().min(1, "Seleccioná un sistema de conducción"),
  hectareas: z
    .string()
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Debe ser un número positivo")
    .optional(),
})

type CuartelFormValues = z.infer<typeof cuartelSchema>

export function CreateCuartelDialog({ fincaId }: { fincaId: string }) {
  const [open, setOpen] = useState(false)
  const createCuartel = useCreateCuartel()
  const { data: variedades } = useCatalogo(CatalogoTipo.VARIEDAD)
  const { data: sistemas } = useCatalogo(CatalogoTipo.SISTEMA_CONDUCCION)

  const form = useForm<CuartelFormValues>({
    resolver: zodResolver(cuartelSchema),
    defaultValues: { nombre: "", variedadId: "", sistemaConduccionId: "", hectareas: "" },
  })

  async function onSubmit(values: CuartelFormValues) {
    try {
      await createCuartel.mutateAsync({
        nombre: values.nombre,
        variedadId: values.variedadId,
        sistemaConduccionId: values.sistemaConduccionId,
        hectareas: values.hectareas ? Number(values.hectareas) : undefined,
        fincaId,
      })
      toast.success("Cuartel creado correctamente")
      form.reset()
      setOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo crear el cuartel"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nuevo cuartel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cuartel</DialogTitle>
          <DialogDescription>Definí la parametrización técnica del cuartel dentro de la finca.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Cuartel 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="variedadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variedad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccioná una variedad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {variedades?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sistemaConduccionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sistema de conducción</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccioná un sistema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sistemas?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hectareas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hectáreas</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createCuartel.isPending}>
                {createCuartel.isPending && <Loader2 className="size-4 animate-spin" />}
                Crear cuartel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
