import { useState } from "react"
import { z } from "zod"
import { Info, Loader2, Plus } from "lucide-react"
import { useCrearUsuario, useRoles } from "./use-usuarios"
import { ETIQUETA_ROL } from "@/auth/roles"
import { passwordSegura } from "@/api/schemas/auth"
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

/**
 * La contraseña es **opcional** (HU-05).
 *
 * El diálogo anterior la exigía con `z.string().min(8)`, o sea que forzaba
 * justo el camino que la historia desaconseja: dejarla vacía hace que el
 * backend genere una temporal, mande el correo de bienvenida con un enlace de
 * 48 h y marque `debeCambiarPassword`, de modo que el Propietario nunca llega a
 * conocer la contraseña de otra persona.
 *
 * Cuando sí se escribe, se valida con **la misma regla que el backend**
 * (`passwordSegura`): antes pedía 8 caracteres a secas y el servidor exige
 * además una letra y un número, así que `12345678` pasaba acá y fallaba allá.
 */
const usuarioSchema = z.object({
  nombre: nombreCorto,
  email,
  rolId: uuidRequerido("Seleccioná un rol"),
  password: z
    .string()
    .optional()
    .refine(
      (v) => !v || passwordSegura.safeParse(v).success,
      "Mínimo 8 caracteres, con al menos una letra y un número"
    )
    .transform((v) => (v ? v : undefined)),
})

export function CrearUsuarioDialog() {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearUsuario()
  const roles = useRoles()

  const form = useFormularioApi({
    schema: usuarioSchema,
    defaultValues: { nombre: "", email: "", rolId: "", password: "" },
    exito: "Usuario creado. Le llegará un correo para definir su contraseña.",
    error: "No se pudo crear el usuario",
    // Sin `empresaId`: la toma del token. Mandarla devolvía
    // `property empresaId should not exist` y rechazaba el alta entera.
    onSubmit: async (valores) => {
      await crear.mutateAsync(valores)
    },
    onExito: () => setAbierto(false),
  })

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden="true" />
          Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Dejá la contraseña vacía para que el sistema le envíe un enlace de alta. Es el
            camino recomendado: así vos nunca conocés su contraseña.
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
                    <Input placeholder="Nombre y apellido" {...field} />
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
                    <Input
                      type="email"
                      autoComplete="off"
                      placeholder="usuario@terravid.demo"
                      {...field}
                    />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full" data-campo="rolId">
                        <SelectValue placeholder="Seleccioná un rol" />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña (opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription className="flex items-start gap-1.5">
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    Si la dejás vacía, le llega un enlace válido por 48 horas para que
                    defina la suya.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
