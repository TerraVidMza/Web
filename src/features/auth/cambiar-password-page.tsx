import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { Loader2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { cambiarPassword } from "@/api/endpoints/auth"
import { passwordSegura } from "@/api/schemas/auth"
import { useAuth } from "@/context/auth-context"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { MarcoAuth } from "./marco-auth"

const schema = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
    newPassword: passwordSegura,
    repetir: z.string(),
  })
  .refine((v) => v.newPassword === v.repetir, {
    message: "Las contraseñas no coinciden",
    path: ["repetir"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "La nueva contraseña tiene que ser distinta de la actual",
    path: ["newPassword"],
  })

/**
 * Cambio de contraseña, obligatorio cuando el backend marcó la actual como
 * temporal (HU-05).
 *
 * `POST /auth/cambiar-password` existía y **nadie lo llamaba**: un usuario dado
 * de alta por el camino recomendado entraba al sistema con `debeCambiarPassword`
 * en `true`, no había ninguna pantalla que se lo pidiera, y seguía usando la
 * contraseña temporal que le llegó por mail.
 */
export function CambiarPasswordPage() {
  const { debeCambiarPassword, actualizarUsuario } = useAuth()
  const navigate = useNavigate()

  const form = useFormularioApi({
    schema,
    defaultValues: { currentPassword: "", newPassword: "", repetir: "" },
    error: "No se pudo cambiar la contraseña",
    onSubmit: async (valores) => {
      await cambiarPassword(valores.currentPassword, valores.newPassword)
      // El backend limpia `debeCambiarPassword` al fijar una contraseña propia;
      // se refleja acá para que el guard deje de redirigir sin re-loguear.
      actualizarUsuario({ debeCambiarPassword: false })
      toast.success("Contraseña actualizada")
      navigate("/", { replace: true })
    },
  })

  return (
    <MarcoAuth
      titulo={debeCambiarPassword ? "Cambiá tu contraseña" : "Cambiar contraseña"}
      descripcion={
        debeCambiarPassword
          ? "Tu contraseña es temporal. Definí una propia para continuar."
          : "Necesitás tu contraseña actual para poder cambiarla."
      }
    >
      {debeCambiarPassword && (
        <output className="flex items-start gap-2 rounded-md bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Ingresaste con la contraseña temporal que te llegó por correo. Nadie más debería
            conocerla.
          </span>
        </output>
      )}

      <Form {...form}>
        <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña actual</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>
                  Entre 8 y 72 caracteres, con al menos una letra y un número.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="repetir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repetir nueva contraseña</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ErrorDelServidor form={form} />

          <Button type="submit" className="w-full" disabled={form.enviando}>
            {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Guardar contraseña
          </Button>
        </form>
      </Form>
    </MarcoAuth>
  )
}
