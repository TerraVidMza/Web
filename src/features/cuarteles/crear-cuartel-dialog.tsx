import { useState } from "react"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { useCrearCuartel } from "./use-cuarteles"
import { useCatalogo } from "@/features/catalogos/use-catalogos"
import { CatalogoTipo } from "@/api/schemas/catalogo"
import {
  anioImplantacion,
  clon,
  hectareasOpcional,
  latitud,
  longitud,
  nombreCorto,
  uuidRequerido,
} from "@/lib/campos"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const cuartelSchema = z.object({
  nombre: nombreCorto,
  variedadId: uuidRequerido("Falta elegir la variedad"),
  sistemaConduccionId: uuidRequerido("Falta elegir el sistema de conducción"),
  clon,
  anioImplantacion,
  hectareas: hectareasOpcional,
  latitud,
  longitud,
})

export function CrearCuartelDialog({ fincaId }: { fincaId: string }) {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearCuartel()
  const variedades = useCatalogo(CatalogoTipo.variedad)
  const sistemas = useCatalogo(CatalogoTipo.sistema_conduccion)

  const form = useFormularioApi({
    schema: cuartelSchema,
    defaultValues: {
      nombre: "",
      variedadId: "",
      sistemaConduccionId: "",
      clon: "",
      anioImplantacion: "",
      hectareas: "",
      latitud: "",
      longitud: "",
    },
    exito: "Cuartel creado correctamente",
    error: "No se pudo crear el cuartel",
    onSubmit: async (valores) => {
      await crear.mutateAsync({ ...valores, fincaId })
    },
    onExito: () => setAbierto(false),
  })

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden="true" />
          Nuevo cuartel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo cuartel</DialogTitle>
          <DialogDescription>
            Definí la parametrización técnica del cuartel dentro de la finca. El estado de
            cosecha lo maneja el sistema a partir de los pesajes, no se carga acá.
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
                      <SelectTrigger className="w-full" data-campo="variedadId">
                        <SelectValue placeholder="Seleccioná una variedad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {variedades.data?.map((item) => (
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
                      <SelectTrigger className="w-full" data-campo="sistemaConduccionId">
                        <SelectValue placeholder="Seleccioná un sistema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sistemas.data?.map((item) => (
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="clon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clon</FormLabel>
                    <FormControl>
                      <Input placeholder="R5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anioImplantacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año de implantación</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="2015" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="hectareas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hectáreas</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="latitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitud</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitud</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Crear cuartel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
