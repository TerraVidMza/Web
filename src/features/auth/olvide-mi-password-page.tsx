import { useState } from "react"
import { z } from "zod"
import { Link } from "react-router-dom"
import { CheckCircle2, Loader2 } from "lucide-react"
import { olvideMiPassword } from "@/api/endpoints/auth"
import { email } from "@/lib/campos"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { MarcoAuth } from "./marco-auth"

const schema = z.object({ email })

/** HU-03. El backend ya lo soportaba entero y el login no tenía ni el enlace. */
export function OlvideMiPasswordPage() {
  const [enviado, setEnviado] = useState(false)

  const form = useFormularioApi({
    schema,
    defaultValues: { email: "" },
    error: "No se pudo procesar la solicitud",
    onSubmit: async (valores) => {
      await olvideMiPassword(valores.email)
      setEnviado(true)
    },
  })

  if (enviado) {
    return (
      <MarcoAuth
        titulo="Revisá tu correo"
        descripcion="Si el email existe, te enviamos las instrucciones para recuperar tu contraseña."
        pie={
          <p className="text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        }
      >
        <output className="flex w-full flex-col items-center gap-2 py-2 text-center">
          <CheckCircle2 className="size-8 text-emerald-600" aria-hidden="true" />
          {/* La respuesta del backend es genérica a propósito: confirmar que la
              cuenta existe permitiría enumerar usuarios. La pantalla mantiene
              esa ambigüedad. */}
          <p className="text-sm text-muted-foreground">
            El enlace vence en 30 minutos y sirve una sola vez.
          </p>
        </output>
      </MarcoAuth>
    )
  }

  return (
    <MarcoAuth
      titulo="Recuperar contraseña"
      descripcion="Ingresá tu email y te enviamos un enlace para definir una nueva."
      pie={
        <p className="text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Volver al inicio de sesión
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
                  <Input type="email" autoComplete="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ErrorDelServidor form={form} />

          <Button type="submit" className="w-full" disabled={form.enviando}>
            {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Enviar instrucciones
          </Button>
        </form>
      </Form>
    </MarcoAuth>
  )
}
