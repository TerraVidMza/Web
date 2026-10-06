import { z } from "zod"
import { toast } from "sonner"
import { CheckCircle2, Loader2, MailWarning } from "lucide-react"
import { useCrearTicket, useTickets } from "./use-ayuda"
import { ETIQUETA_MODULO, moduloAyudaSchema, type ModuloAyuda } from "@/api/schemas/ayuda"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { useFormato } from "@/context/configuracion-context"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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

/** `@Length(10, 1000)`: una descripción de tres palabras no es un reporte. */
const schema = z.object({
  modulo: moduloAyudaSchema,
  descripcion: z
    .string()
    .trim()
    .min(10, "Contá qué pasó con al menos 10 caracteres: es lo único que ve soporte")
    .max(1000, "Máximo 1000 caracteres"),
})

/** Pedir ayuda, y —si sos Propietario— ver los pedidos de tu empresa (HU-36). */
export function SoportePage() {
  const crear = useCrearTicket()
  const { user } = useAuth()
  const formato = useFormato()
  const puedeVerTickets = puede(user, "ayudaAdministracion")
  const tickets = useTickets(puedeVerTickets)

  const form = useFormularioApi({
    schema,
    defaultValues: { modulo: "fincas" as ModuloAyuda, descripcion: "" },
    exito: null,
    error: "No se pudo enviar el pedido",
    onSubmit: async (valores) => {
      const ticket = await crear.mutateAsync(valores)
      // `emailEnviado` importa: el ticket queda registrado igual, pero si el
      // aviso no salió nadie del otro lado se enteró todavía. Decirlo evita
      // que alguien espere una respuesta que no va a llegar.
      if (ticket.emailEnviado) {
        toast.success("Pedido enviado. Te van a contactar por correo.")
      } else {
        toast.warning(
          "Tu pedido quedó registrado, pero el aviso por correo no pudo enviarse. Avisale al equipo técnico si es urgente.",
          { duration: 8000 }
        )
      }
    },
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedir ayuda</CardTitle>
          <CardDescription>
            Contanos qué pasó y en qué parte del sistema. El pedido llega al correo de
            soporte que está configurado para tu empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="modulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿En qué parte?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full sm:max-w-xs" data-campo="modulo">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {moduloAyudaSchema.options.map((opcion) => (
                          <SelectItem key={opcion} value={opcion}>
                            {ETIQUETA_MODULO[opcion]}
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
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Qué pasó?</FormLabel>
                    <FormControl>
                      <Textarea rows={5} maxLength={1000} {...field} />
                    </FormControl>
                    <FormDescription>
                      Qué estabas haciendo, qué esperabas que pasara y qué pasó en su lugar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ErrorDelServidor form={form} />

              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Enviar pedido
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {puedeVerTickets && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos de tu empresa</CardTitle>
            <CardDescription>
              Todo lo que reportaron los usuarios de tu empresa desde la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <EstadoConsulta
              consulta={tickets}
              cantidad={tickets.data?.length ?? 0}
              vacio={{
                titulo: "Nadie pidió ayuda todavía",
                descripcion: "Los pedidos que carguen tus usuarios van a aparecer acá.",
              }}
            >
              <ul className="divide-y">
                {tickets.data?.map((ticket) => (
                  <li key={ticket.id} className="space-y-1.5 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {ETIQUETA_MODULO[ticket.modulo as ModuloAyuda] ?? ticket.modulo}
                      </Badge>
                      <Badge variant={ticket.estado === "abierto" ? "default" : "secondary"}>
                        {ticket.estado === "abierto" ? "Abierto" : "Cerrado"}
                      </Badge>
                      {ticket.emailEnviado ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          Aviso enviado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <MailWarning className="size-3.5" aria-hidden="true" />
                          El aviso por correo no salió
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formato.fechaHora(ticket.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line">{ticket.descripcion}</p>
                    {ticket.usuario && (
                      <p className="text-xs text-muted-foreground">
                        {ticket.usuario.nombre} · {ticket.usuario.email}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </EstadoConsulta>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
