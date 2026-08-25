import { z } from "zod"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { restablecerPassword } from "@/api/endpoints/auth"
import { passwordSegura } from "@/api/schemas/auth"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { MarcoAuth } from "./marco-auth"

const schema = z
  .object({
    newPassword: passwordSegura,
    repetir: z.string(),
  })
  .refine((v) => v.newPassword === v.repetir, {
    message: "Las contraseñas no coinciden",
    path: ["repetir"],
  })

/**
 * Destino de los dos correos que manda el backend: el de bienvenida al alta de
 * usuario (48 h) y el de recuperación (30 min). Los dos apuntan a
 * `${APP_URL}/reset-password?token=...`, así que la ruta tiene que llamarse
 * exactamente así.
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token") ?? ""

  const form = useFormularioApi({
    schema,
    defaultValues: { newPassword: "", repetir: "" },
    error: "No se pudo restablecer la contraseña",
    onSubmit: async (valores) => {
      await restablecerPassword(token, valores.newPassword)
      toast.success("Contraseña actualizada. Ya podés iniciar sesión.")
      navigate("/login", { replace: true })
    },
  })

  if (!token) {
    return (
      <MarcoAuth
        titulo="Enlace inválido"
        descripcion="Este enlace no incluye un token de recuperación."
        pie={
          <p className="text-center text-sm">
            <Link to="/olvide-mi-password" className="text-primary hover:underline">
              Pedir un enlace nuevo
            </Link>
          </p>
        }
      >
        <p role="alert" className="text-center text-sm text-muted-foreground">
          Puede que lo hayas copiado incompleto. Pedí uno nuevo y abrilo directamente desde
          el correo.
        </p>
      </MarcoAuth>
    )
  }

  return (
    <MarcoAuth titulo="Definí tu contraseña" descripcion="El enlace sirve una sola vez.">
      <Form {...form}>
        <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
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
                <FormLabel>Repetir contraseña</FormLabel>
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
