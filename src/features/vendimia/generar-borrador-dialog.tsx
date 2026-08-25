import { useState } from "react"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { FilePlus2, Loader2 } from "lucide-react"
import { useGenerarBorrador } from "./use-vendimia"
import { hoyIso } from "@/features/operaciones/catalogos/use-catalogo-costeable"
import { useFincas } from "@/features/fincas/use-fincas"
import { useCuartelesDeFinca } from "@/features/cuarteles/use-cuarteles"
import { uuidRequerido } from "@/lib/campos"
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
  fincaId: uuidRequerido("Falta elegir la finca"),
  cuartelId: uuidRequerido("Falta elegir el cuartel"),
  fecha: z.string().min(1, "Ingresá la jornada a liquidar"),
})

/**
 * Arma el borrador con los pesajes pendientes de una jornada (HU-26).
 *
 * **La fecha es obligatoria acá aunque el DTO la acepte ausente.** Sin ella el
 * backend arrastra todos los pesajes pendientes del cuartel, de cualquier día:
 * un remito documenta el despacho de una jornada, no el acumulado histórico. El
 * campo quedó opcional en el backend para no romper clientes viejos; esta
 * pantalla es nueva y no tiene por qué heredar ese comportamiento.
 */
export function GenerarBorradorDialog() {
  const [abierto, setAbierto] = useState(false)
  const generar = useGenerarBorrador()
  const fincas = useFincas()
  const navigate = useNavigate()

  const form = useFormularioApi({
    schema,
    defaultValues: { fincaId: "", cuartelId: "", fecha: hoyIso() },
    exito: null,
    error: "No se pudo generar el borrador",
    onSubmit: async (valores) => {
      const remito = await generar.mutateAsync({
        cuartelId: valores.cuartelId,
        fecha: valores.fecha,
      })
      setAbierto(false)
      // Al detalle directamente: lo primero que se hace con un borrador recién
      // creado es revisar qué pesajes entraron antes de aprobarlo.
      navigate(`/remitos/${remito.id}`)
    },
  })

  const fincaElegida = form.watch("fincaId")
  const cuarteles = useCuartelesDeFinca(fincaElegida || "")

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button>
          <FilePlus2 className="size-4" aria-hidden="true" />
          Generar borrador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar borrador de remito</DialogTitle>
          <DialogDescription>
            Toma los pesajes pendientes de remito del cuartel en esa jornada. Si no hay
            ninguno, el backend lo rechaza.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="fincaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finca</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v)
                      // El cuartel elegido pertenece a la finca anterior.
                      form.setValue("cuartelId", "")
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full" data-campo="fincaId">
                        <SelectValue placeholder="Seleccioná una finca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fincas.data?.map((finca) => (
                        <SelectItem key={finca.id} value={finca.id}>
                          {finca.nombre}
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
              name="cuartelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuartel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!fincaElegida}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full" data-campo="cuartelId">
                        <SelectValue placeholder="Elegí una finca primero" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cuarteles.data?.map((cuartel) => (
                        <SelectItem key={cuartel.id} value={cuartel.id}>
                          {cuartel.nombre}
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
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jornada</FormLabel>
                  <FormControl>
                    <Input type="date" max={hoyIso()} {...field} />
                  </FormControl>
                  <FormDescription>
                    Solo entran los pesajes de este día.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Generar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
