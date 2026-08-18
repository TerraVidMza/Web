import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useCreateFinca } from "@/hooks/use-fincas"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const fincaSchema = z.object({
  nombre: z.string().min(2, "Ingresá un nombre").max(100),
  ubicacion: z.string().max(200).optional(),
  hectareas: z
    .string()
    .min(1, "Ingresá las hectáreas")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Debe ser un número positivo"),
})

type FincaFormValues = z.infer<typeof fincaSchema>

export function CreateFincaDialog() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const createFinca = useCreateFinca()

  const form = useForm<FincaFormValues>({
    resolver: zodResolver(fincaSchema),
    defaultValues: { nombre: "", ubicacion: "", hectareas: "" },
  })

  async function onSubmit(values: FincaFormValues) {
    if (!user) return
    try {
      await createFinca.mutateAsync({
        nombre: values.nombre,
        ubicacion: values.ubicacion || undefined,
        hectareas: Number(values.hectareas),
        empresaId: user.empresaId,
      })
      toast.success("Finca creada correctamente")
      form.reset()
      setOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo crear la finca"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nueva finca
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva finca</DialogTitle>
          <DialogDescription>Cargá los datos básicos de la finca. Podrás editarla luego.</DialogDescription>
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
                    <Input placeholder="Finca El Rosal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ubicacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Luján de Cuyo, Mendoza" {...field} />
                  </FormControl>
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
              <Button type="submit" disabled={createFinca.isPending}>
                {createFinca.isPending && <Loader2 className="size-4 animate-spin" />}
                Crear finca
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
