import { useState, type ReactNode } from "react"
import { z } from "zod"
import { Info, Loader2 } from "lucide-react"
import { useActualizarUsuario, useRoles } from "./use-usuarios"
import type { Usuario } from "@/api/schemas/usuario"
import { ETIQUETA_ROL } from "@/auth/roles"
import { useAuth } from "@/context/auth-context"
import { email, nombreCorto, uuidRequerido } from "@/lib/campos"
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

const usuarioSchema = z.object({
  nombre: nombreCorto,
  email,
  rolId: uuidRequerido("Falta elegir el rol"),
  activo: z.enum(["si", "no"]).transform((v) => v === "si"),
})

function valoresIniciales(usuario: Usuario) {
  return {
    nombre: usuario.nombre,
    email: usuario.email,
    rolId: usuario.rolId,
    activo: usuario.activo ? ("si" as const) : ("no" as const),
  }
}

/**
 * Edición de un usuario y cambio de rol (HU-05, HU-06).
 *
 * El selector de rol se deshabilita cuando el usuario se está editando a sí
 * mismo: el backend responde 403 —"No puedes modificar tu propio rol"— porque
 * combinado con la imposibilidad de dar de baja al último Propietario, un
 * autocambio de rol podría dejar al sistema sin ninguno. Mejor decirlo antes
 * que dejar que lo descubra con un error.
 *
 * El estado también se edita acá, y no es un detalle: es la **única** forma de
 * reactivar a alguien, porque `:id/desactivar` solo va en una dirección.
 */
export function EditarUsuarioDialog({
  usuario,
  children,
}: {
  usuario: Usuario
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const actualizar = useActualizarUsuario()
  const roles = useRoles()
  const { user } = useAuth()
  const esUnoMismo = user?.id === usuario.id

  const form = useFormularioApi({
    schema: usuarioSchema,
    defaultValues: valoresIniciales(usuario),
    exito: "Usuario actualizado",
    error: "No se pudo actualizar el usuario",
    onSubmit: async (valores) => {
      await actualizar.mutateAsync({ id: usuario.id, ...valores })
    },
    onExito: () => setAbierto(false),
  })

  function alCambiar(nuevoAbierto: boolean) {
    setAbierto(nuevoAbierto)
    if (nuevoAbierto) form.reset(valoresIniciales(usuario))
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiar}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {usuario.nombre}</DialogTitle>
          <DialogDescription>
            La contraseña no se administra desde acá: cada usuario define la suya con el
            enlace que recibe por correo.
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={esUnoMismo}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full" data-campo="rolId">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.data?.map((rol) => (
                        <SelectItem key={rol.id} value={rol.id}>
                          {ETIQUETA_ROL[rol.nombreRol]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {esUnoMismo && (
                    <FormDescription className="flex items-start gap-1.5">
                      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      No podés cambiar tu propio rol. Pedíselo a otro Propietario.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full" data-campo="activo">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="si">Activo</SelectItem>
                      <SelectItem value="no">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Un usuario inactivo no puede iniciar sesión.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
