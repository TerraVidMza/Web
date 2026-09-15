import { z } from "zod"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { email } from "@/lib/campos"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { MarcoAuth } from "./marco-auth"

const loginSchema = z.object({
  email,
  // Sin política acá: validar la del sistema en el login rechazaría contraseñas
  // antiguas todavía válidas y, de paso, le revelaría la política a quien esté
  // probando credenciales. Es el mismo criterio que el `LoginDto` del backend.
  password: z.string().min(1, "Ingresá tu contraseña"),
})

/** Adónde vuelve el usuario después de entrar. */
export function rutaDeDestino(state: unknown): string {
  const from = (state as { from?: { pathname?: string } } | null)?.from?.pathname
  // Volver al login sería un bucle.
  return from && from !== "/login" ? from : "/"
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const form = useFormularioApi({
    schema: loginSchema,
    defaultValues: { email: "", password: "" },
    error: "Credenciales inválidas",
    onSubmit: async (valores) => {
      const usuario = await login(valores.email, valores.password)
      // El redirect post-login estaba muerto: se calculaba el `from` de la ruta
      // protegida y después se navegaba a "/" igual, así que el usuario nunca
      // volvía a la página que quería abrir.
      const destino = usuario.debeCambiarPassword
        ? "/cambiar-password"
        : rutaDeDestino(location.state)
      navigate(destino, { replace: true })
    },
  })

  if (isAuthenticated) {
    return <Navigate to={rutaDeDestino(location.state)} replace />
  }

  return (
    <MarcoAuth
      titulo="TerraVid"
      descripcion="Ingresá con tu cuenta para continuar"
      logoGrande
      pie={
        <p className="text-center text-sm">
          <Link to="/olvide-mi-password" className="text-primary hover:underline">
            Olvidé mi contraseña
          </Link>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="username"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ErrorDelServidor form={form} />

          <Button type="submit" className="w-full" disabled={form.enviando}>
            {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Iniciar sesión
          </Button>
        </form>
      </Form>
    </MarcoAuth>
  )
}
