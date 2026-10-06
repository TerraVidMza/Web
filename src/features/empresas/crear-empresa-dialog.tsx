import { useState } from "react"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { useCrearEmpresa } from "./use-empresas"
import { email, nombreCorto } from "@/lib/campos"
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

/** El mismo formato que valida el backend (`CrearEmpresaDto`). */
export const cuit = z
  .string()
  .trim()
  .regex(/^\d{2}-\d{8}-\d$/, "Formato 30-12345678-9")

const empresaSchema = z.object({
  nombre: nombreCorto,
  cuit,
  propietarioNombre: nombreCorto,
  propietarioEmail: email,
})

/**
 * Alta de una empresa cliente con su primer Propietario (D-025 del backend).
 *
 * No hay campo de contraseña a propósito: el backend genera una temporal y le
 * manda al Propietario el correo de bienvenida, así el Administrador de
 * plataforma nunca la conoce.
 */
export function CrearEmpresaDialog() {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearEmpresa()

  const form = useFormularioApi({
    schema: empresaSchema,
    defaultValues: { nombre: "", cuit: "", propietarioNombre: "", propietarioEmail: "" },
    exito: "Empresa creada. El Propietario va a recibir un correo para definir su contraseña.",
    error: "No se pudo crear la empresa",
    onSubmit: async (v) => {
      await crear.mutateAsync({
        nombre: v.nombre,
        cuit: v.cuit,
        propietario: { nombre: v.propietarioNombre, email: v.propietarioEmail },
      })
    },
    onExito: () => {
      setAbierto(false)
      form.reset()
    },
  })

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden="true" />
          Nueva empresa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
          <DialogDescription>
            Se crea con los catálogos por defecto y con su primer Propietario, que recibe un
            enlace para definir su contraseña.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Bodega Los Andes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIT</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="30-12345678-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propietarioNombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Propietario</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre y apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propietarioEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Propietario</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormDescription>Le llega el enlace para definir su contraseña.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Crear empresa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
