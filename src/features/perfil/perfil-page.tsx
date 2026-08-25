import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { KeyRound, Loader2 } from "lucide-react"
import { actualizarMiPerfil, miPerfil } from "@/api/endpoints/usuarios"
import { ETIQUETA_ROL } from "@/auth/roles"
import { nombreCorto } from "@/lib/campos"
import { CACHE } from "@/lib/cache"
import { useFormato } from "@/context/configuracion-context"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const schema = z.object({ nombre: nombreCorto })

/**
 * Datos personales (HU-04).
 *
 * El backend solo deja cambiar el nombre desde `PATCH /usuarios/me`: exponer
 * `rolId` o `activo` acá habilitaría que cualquier usuario se auto-asigne un rol
 * superior, y por eso su DTO no hereda del de alta.
 */
export function PerfilPage() {
  const queryClient = useQueryClient()
  const consulta = useQuery({
    queryKey: ["usuarios", "me"],
    queryFn: miPerfil,
    staleTime: CACHE.ESTRUCTURA,
  })
  const formato = useFormato()

  const guardar = useMutation({
    mutationFn: (nombre: string) => actualizarMiPerfil(nombre),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  })

  const form = useFormularioApi({
    schema,
    defaultValues: { nombre: "" },
    exito: "Datos actualizados",
    error: "No se pudieron guardar los datos",
    onSubmit: async (valores) => {
      await guardar.mutateAsync(valores.nombre)
    },
  })

  // El valor por defecto no se conoce hasta que responde la consulta.
  useEffect(() => {
    if (consulta.data) form.reset({ nombre: consulta.data.nombre })
    // `form` es estable entre renders; incluirlo dispararía un reset por tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta.data])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Tus datos personales y el acceso al sistema.
        </p>
      </div>

      <EstadoConsulta
        consulta={consulta}
        cantidad={consulta.data ? 1 : 0}
        vacio={{ titulo: "No se pudo cargar tu perfil" }}
        filasEsqueleto={3}
      >
        {consulta.data && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos personales</CardTitle>
                <CardDescription>
                  El email y el rol los administra el Propietario.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input autoComplete="name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-1.5">
                      <Label htmlFor="perfil-email">Email</Label>
                      <Input id="perfil-email" value={consulta.data.email} disabled readOnly />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="perfil-rol">Rol</Label>
                      <Input
                        id="perfil-rol"
                        value={ETIQUETA_ROL[consulta.data.rol.nombreRol]}
                        disabled
                        readOnly
                      />
                    </div>

                    <ErrorDelServidor form={form} />

                    <Button type="submit" disabled={form.enviando}>
                      {form.enviando && (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      )}
                      Guardar cambios
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Seguridad</CardTitle>
                  <CardDescription>
                    {consulta.data.debeCambiarPassword
                      ? "Tu contraseña es temporal: definí una propia."
                      : "Cambiá tu contraseña cuando quieras."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" asChild>
                    <Link to="/cambiar-password">
                      <KeyRound className="size-4" aria-hidden="true" />
                      Cambiar contraseña
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cuenta</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    {consulta.data.empresa && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Empresa</dt>
                        <dd className="text-right font-medium">
                          {consulta.data.empresa.nombre}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Último acceso</dt>
                      <dd className="text-right">{formato.fechaHora(consulta.data.ultimoAcceso)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Alta</dt>
                      <dd className="text-right">{formato.fecha(consulta.data.createdAt)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </EstadoConsulta>
    </div>
  )
}
