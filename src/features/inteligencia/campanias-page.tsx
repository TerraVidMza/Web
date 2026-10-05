import { useState, type ReactNode } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { CalendarCheck, CalendarClock, Loader2, MoreHorizontal, Pencil, Plus, Target } from "lucide-react"
import {
  useActualizarCampania,
  useCambiarCierreCampania,
  useCampanias,
  useCrearCampania,
} from "./use-inteligencia"
import type { Campania } from "@/api/schemas/inteligencia"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { useFormato } from "@/context/configuracion-context"
import { hoyIso } from "@/features/operaciones/catalogos/use-catalogo-costeable"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MetasCosechaDialog } from "./metas-cosecha-dialog"

const schema = z
  .object({
    nombre: z.string().trim().min(2, "Ingresá un nombre").max(50, "Máximo 50 caracteres"),
    fechaDesde: z.string().min(1, "Ingresá la fecha de inicio"),
    fechaHasta: z.string().min(1, "Ingresá la fecha de fin"),
  })
  // El backend lo valida con un CHECK; adelantarlo ahorra el viaje.
  .refine((v) => v.fechaHasta > v.fechaDesde, {
    message: "El fin tiene que ser posterior al inicio",
    path: ["fechaHasta"],
  })

function CampaniaDialog({
  campania,
  children,
}: {
  campania?: Campania
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearCampania()
  const actualizar = useActualizarCampania()
  const esEdicion = campania !== undefined

  function iniciales() {
    return {
      nombre: campania?.nombre ?? "",
      fechaDesde: campania?.fechaDesde ?? "",
      fechaHasta: campania?.fechaHasta ?? "",
    }
  }

  const form = useFormularioApi({
    schema,
    defaultValues: iniciales(),
    exito: esEdicion ? "Campaña actualizada" : "Campaña creada",
    error: esEdicion ? "No se pudo actualizar la campaña" : "No se pudo crear la campaña",
    onSubmit: async (valores) => {
      if (esEdicion) {
        await actualizar.mutateAsync({ id: campania.id, ...valores })
      } else {
        await crear.mutateAsync(valores)
      }
    },
    onExito: () => setAbierto(false),
  })

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (v) form.reset(iniciales())
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${campania.nombre}` : "Nueva campaña"}
          </DialogTitle>
          <DialogDescription>
            Las campañas de la empresa no pueden solaparse: la base lo impide, porque si dos
            se pisaran «la campaña actual» sería ambigua.
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
                    <Input placeholder="2025/2026" {...field} />
                  </FormControl>
                  <FormDescription>Como la nombra el productor.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fechaDesde"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desde</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaHasta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Inclusive.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {esEdicion ? "Guardar cambios" : "Crear campaña"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/** La abierta que contiene hoy. Es la que el resto del sistema usa de corte. */
function esActual(campania: Campania, hoy = hoyIso()): boolean {
  return !campania.cerrada && campania.fechaDesde <= hoy && hoy <= campania.fechaHasta
}

/**
 * ABM de campañas (D-014).
 *
 * Es entidad nueva y sin pantalla en Figma, así que se diseñó en código (D-g).
 * Importa más de lo que parece: **el dashboard, la baja de cuartel de HU-09 y la
 * comparación de HU-31 usan la campaña abierta como corte temporal**. Sin
 * ninguna cargada, el dashboard cae al año calendario y lo informa.
 */
export function CampaniasPage() {
  const consulta = useCampanias()
  const cambiarCierre = useCambiarCierreCampania()
  const { user } = useAuth()
  const formato = useFormato()

  const campanias = consulta.data ?? []
  const puedeEscribir = puede(user, "campaniasEscritura")
  const hayActual = campanias.some((c) => esActual(c))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          El período que usan el dashboard, la comparación entre campañas y la baja de
          cuarteles como corte temporal.
        </p>
        {puedeEscribir && (
          <CampaniaDialog>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nueva campaña
            </Button>
          </CampaniaDialog>
        )}
      </div>

      {!hayActual && campanias.length > 0 && (
        <output className="block rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          No hay ninguna campaña abierta que contenga la fecha de hoy. Mientras tanto, el
          dashboard cuenta los kilos por año calendario.
        </output>
      )}

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={campanias.length}
            vacio={{
              titulo: "Todavía no hay campañas cargadas",
              descripcion:
                "Sin una campaña, el dashboard cuenta los kilos por año calendario — que en Mendoza parte la vendimia al medio.",
            }}
          >
            <Table>
              <TableCaption className="sr-only">
                Campañas de la empresa, con su rango de fechas y estado
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hasta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanias.map((campania) => (
                  <TableRow key={campania.id}>
                    <TableCell className="font-medium">{campania.nombre}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formato.fecha(campania.fechaDesde)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formato.fecha(campania.fechaHasta)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {campania.cerrada ? (
                          <Badge variant="outline">Cerrada</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted">
                            Abierta
                          </Badge>
                        )}
                        {esActual(campania) && <Badge>Actual</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {puedeEscribir && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Acciones de ${campania.nombre}`}
                            >
                              <MoreHorizontal className="size-4" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <CampaniaDialog campania={campania}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="size-4" aria-hidden="true" />
                                Editar
                              </DropdownMenuItem>
                            </CampaniaDialog>

                            <MetasCosechaDialog campania={campania}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Target className="size-4" aria-hidden="true" />
                                Metas de cosecha
                              </DropdownMenuItem>
                            </MetasCosechaDialog>

                            <DialogoConfirmacion
                              titulo={
                                campania.cerrada
                                  ? `¿Reabrir ${campania.nombre}?`
                                  : `¿Cerrar ${campania.nombre}?`
                              }
                              descripcion={
                                campania.cerrada
                                  ? "Vuelve a poder ser «la actual» si hoy cae dentro de su rango."
                                  : "Sigue siendo consultable y comparable, pero deja de ser «la actual» aunque hoy caiga dentro de su rango. Es lo que permite terminar la vendimia antes de que se agote el período."
                              }
                              textoConfirmar={campania.cerrada ? "Reabrir" : "Cerrar campaña"}
                              tono="confirmacion"
                              errorPorDefecto="No se pudo cambiar el estado de la campaña"
                              onConfirmar={async () => {
                                await cambiarCierre.mutateAsync({
                                  id: campania.id,
                                  cerrar: !campania.cerrada,
                                })
                                toast.success(
                                  campania.cerrada
                                    ? `${campania.nombre} quedó reabierta`
                                    : `${campania.nombre} quedó cerrada`
                                )
                              }}
                            >
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                {campania.cerrada ? (
                                  <CalendarClock className="size-4" aria-hidden="true" />
                                ) : (
                                  <CalendarCheck className="size-4" aria-hidden="true" />
                                )}
                                {campania.cerrada ? "Reabrir" : "Cerrar campaña"}
                              </DropdownMenuItem>
                            </DialogoConfirmacion>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </EstadoConsulta>
        </CardContent>
      </Card>
    </div>
  )
}
