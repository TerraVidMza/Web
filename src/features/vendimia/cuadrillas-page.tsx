import { useEffect, useState } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { DollarSign, Info, Loader2, MoreHorizontal, Pencil, Plus, Power } from "lucide-react"
import {
  useActualizarCuadrilla,
  useCrearCuadrilla,
  useCuadrillas,
  useDesactivarCuadrilla,
  useFijarTarifa,
  useTarifas,
} from "./use-vendimia"
import { clasificarVigencias, hoyIso } from "@/features/operaciones/catalogos/use-catalogo-costeable"
import { useFincas } from "@/features/fincas/use-fincas"
import type { Cuadrilla } from "@/api/schemas/vendimia"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { useFormato } from "@/context/configuracion-context"
import { nombreCorto } from "@/lib/campos"
import { ActivoBadge } from "@/components/datos/estado-badge"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const enteroPositivo = z
  .string()
  .trim()
  .min(1, "Ingresá la cantidad")
  .refine((v) => /^\d+$/.test(v), "Tiene que ser un número entero")
  .transform(Number)
  .refine((v) => v >= 1, "Al menos una persona")

const cuadrillaSchema = z.object({
  nombre: nombreCorto,
  cantidadIntegrantes: enteroPositivo,
})

function CuadrillaDialog({
  fincaId,
  cuadrilla,
  children,
}: {
  fincaId: string
  cuadrilla?: Cuadrilla
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearCuadrilla()
  const actualizar = useActualizarCuadrilla()
  const esEdicion = cuadrilla !== undefined

  const form = useFormularioApi({
    schema: cuadrillaSchema,
    defaultValues: {
      nombre: cuadrilla?.nombre ?? "",
      cantidadIntegrantes: cuadrilla ? String(cuadrilla.cantidadIntegrantes) : "",
    },
    exito: esEdicion ? "Cambios guardados" : "Cuadrilla creada",
    error: esEdicion ? "No se pudo actualizar la cuadrilla" : "No se pudo crear la cuadrilla",
    onSubmit: async (valores) => {
      if (esEdicion) {
        await actualizar.mutateAsync({ id: cuadrilla.id, ...valores })
      } else {
        // Sin `tarifaPorKgInicial`: la tarifa la fija solo el Propietario desde
        // el diálogo de tarifas, y el service la descarta si la manda otro rol.
        await crear.mutateAsync({ fincaId, ...valores })
      }
    },
    onExito: () => setAbierto(false),
  })

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (v) {
          form.reset({
            nombre: cuadrilla?.nombre ?? "",
            cantidadIntegrantes: cuadrilla ? String(cuadrilla.cantidadIntegrantes) : "",
          })
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${cuadrilla.nombre}` : "Nueva cuadrilla"}
          </DialogTitle>
          <DialogDescription>
            La tarifa a destajo se asigna aparte, y solo la fija el Propietario.
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
                    <Input placeholder="Cuadrilla Norte" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cantidadIntegrantes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Integrantes</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ErrorDelServidor form={form} />
            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {esEdicion ? "Guardar cambios" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/** `@IsPositive()` + `@EsFechaNoRetroactiva()`, igual que los costos de HU-16. */
const tarifaSchema = z.object({
  tarifaPorKg: z
    .string()
    .trim()
    .min(1, "Ingresá la tarifa")
    .refine((v) => !Number.isNaN(Number(v)), "Ingresá un número válido")
    .refine((v) => Number(v) > 0, "La tarifa debe ser mayor que 0")
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Máximo 2 decimales")
    .transform(Number),
  validFrom: z
    .string()
    .min(1, "Ingresá la fecha de vigencia")
    .refine((v) => v >= hoyIso(), "La vigencia no puede ser retroactiva"),
})

function TarifasDialog({
  cuadrilla,
  onCerrar,
}: {
  cuadrilla: Cuadrilla | null
  onCerrar: () => void
}) {
  const [mostrandoAlta, setMostrandoAlta] = useState(false)
  const consulta = useTarifas(cuadrilla?.id ?? null)
  const fijar = useFijarTarifa()
  const formato = useFormato()
  const { user } = useAuth()
  const puedeFijar = puede(user?.rol, "cuadrillasTarifas")

  const form = useFormularioApi({
    schema: tarifaSchema,
    defaultValues: { tarifaPorKg: "", validFrom: hoyIso() },
    exito: "Tarifa registrada",
    error: "No se pudo registrar la tarifa",
    onSubmit: async (valores) => {
      await fijar.mutateAsync({ id: cuadrilla!.id, ...valores })
    },
    onExito: () => setMostrandoAlta(false),
  })

  useEffect(() => {
    if (cuadrilla === null) setMostrandoAlta(false)
  }, [cuadrilla])

  // Mismo criterio que los costos de HU-16: el historial viene ordenado por
  // fecha descendente, así que una tarifa futura encabeza la lista sin regir.
  const tarifas = clasificarVigencias(consulta.data ?? [])

  return (
    <Dialog
      open={cuadrilla !== null}
      onOpenChange={(abierto) => {
        if (!abierto) onCerrar()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tarifas de {cuadrilla?.nombre}</DialogTitle>
          <DialogDescription>
            Tarifa a destajo por kilo cosechado. Cada cambio es una vigencia nueva: los
            pesajes ya registrados conservan la que regía ese día.
          </DialogDescription>
        </DialogHeader>

        <EstadoConsulta
          consulta={consulta}
          cantidad={tarifas.length}
          vacio={{
            titulo: "Todavía no tiene tarifa",
            descripcion: puedeFijar
              ? "Cargá la primera abajo."
              : "La asigna el Propietario.",
          }}
          filasEsqueleto={3}
        >
          <ul className="divide-y">
            {tarifas.map((tarifa) => (
              <li key={tarifa.id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {formato.dinero(tarifa.tarifaPorKg)}
                  </span>
                  <span className="text-sm text-muted-foreground">por kg</span>
                  {tarifa.esVigente && <Badge>Vigente</Badge>}
                  {tarifa.esFuturo && <Badge variant="outline">Programada</Badge>}
                </div>
                <span className="text-sm text-muted-foreground">
                  desde {formato.fecha(tarifa.validFrom)}
                </span>
              </li>
            ))}
          </ul>
        </EstadoConsulta>

        {puedeFijar && (
          <>
            <Separator />
            {mostrandoAlta ? (
              <Form {...form}>
                <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="tarifaPorKg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nueva tarifa</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rige desde</FormLabel>
                          <FormControl>
                            <Input type="date" min={hoyIso()} {...field} />
                          </FormControl>
                          <FormDescription>Hoy o más adelante.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <ErrorDelServidor form={form} />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMostrandoAlta(false)}
                      disabled={form.enviando}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={form.enviando}>
                      {form.enviando && (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      )}
                      Registrar tarifa
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <Button variant="outline" onClick={() => setMostrandoAlta(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Nueva tarifa
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Cuadrillas de cosecha (HU-23).
 *
 * Se listan **por finca**: `GET /cuadrillas` exige `fincaId`, y una cuadrilla
 * pertenece a una finca concreta.
 */
export function CuadrillasPage() {
  const [fincaId, setFincaId] = useState("")
  const [viendoTarifasDe, setViendoTarifasDe] = useState<Cuadrilla | null>(null)
  const fincas = useFincas()
  const consulta = useCuadrillas(fincaId)
  const desactivar = useDesactivarCuadrilla()
  const { user } = useAuth()

  const puedeCrear = puede(user?.rol, "cuadrillas")
  const puedeEditar = puede(user?.rol, "cuadrillasEdicion")
  const puedeVerTarifas = puede(user?.rol, "cuadrillasEdicion")
  const puedeDarDeBaja = puede(user?.rol, "cuadrillasTarifas")
  const cuadrillas = consulta.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full space-y-1.5 sm:max-w-xs">
          <Label htmlFor="cuadrillas-finca">Finca</Label>
          <Select value={fincaId} onValueChange={setFincaId}>
            <SelectTrigger id="cuadrillas-finca" className="w-full">
              <SelectValue placeholder="Elegí una finca" />
            </SelectTrigger>
            <SelectContent>
              {fincas.data?.map((finca) => (
                <SelectItem key={finca.id} value={finca.id}>
                  {finca.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {fincaId && puedeCrear && (
          <CuadrillaDialog fincaId={fincaId}>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nueva cuadrilla
            </Button>
          </CuadrillaDialog>
        )}
      </div>

      {!fincaId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Info className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Elegí una finca para ver sus cuadrillas</p>
            <p className="text-sm text-muted-foreground">
              Cada cuadrilla pertenece a una finca, así que el listado siempre es de una.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EstadoConsulta
              consulta={consulta}
              cantidad={cuadrillas.length}
              vacio={{
                titulo: "Esta finca no tiene cuadrillas",
                descripcion: puedeCrear
                  ? "Creá la primera con el botón de arriba."
                  : "Las carga el Propietario, el Agrónomo o el Capataz.",
              }}
            >
              <Table>
                <TableCaption className="sr-only">
                  Cuadrillas de la finca, con su cantidad de integrantes y estado
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Integrantes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-32">
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuadrillas.map((cuadrilla) => (
                    <TableRow key={cuadrilla.id}>
                      <TableCell className="font-medium">{cuadrilla.nombre}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cuadrilla.cantidadIntegrantes}
                      </TableCell>
                      <TableCell>
                        <ActivoBadge
                          activo={cuadrilla.activa}
                          etiquetas={["Activa", "Inactiva"]}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {puedeVerTarifas && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Tarifas de ${cuadrilla.nombre}`}
                              onClick={() => setViendoTarifasDe(cuadrilla)}
                            >
                              <DollarSign className="size-4" aria-hidden="true" />
                              Tarifas
                            </Button>
                          )}

                          {(puedeEditar || puedeDarDeBaja) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Acciones de ${cuadrilla.nombre}`}
                                >
                                  <MoreHorizontal className="size-4" aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {puedeEditar && (
                                  <CuadrillaDialog fincaId={fincaId} cuadrilla={cuadrilla}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Pencil className="size-4" aria-hidden="true" />
                                      Editar
                                    </DropdownMenuItem>
                                  </CuadrillaDialog>
                                )}
                                {puedeDarDeBaja && cuadrilla.activa && (
                                  <DialogoConfirmacion
                                    titulo={`¿Dar de baja ${cuadrilla.nombre}?`}
                                    descripcion="Deja de ofrecerse al registrar pesajes. Los ya cargados conservan su tarifa y no cambian."
                                    textoConfirmar="Dar de baja"
                                    errorPorDefecto="No se pudo dar de baja la cuadrilla"
                                    onConfirmar={async () => {
                                      await desactivar.mutateAsync(cuadrilla.id)
                                      toast.success(`${cuadrilla.nombre} quedó dada de baja`)
                                    }}
                                  >
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Power className="size-4" aria-hidden="true" />
                                      Dar de baja
                                    </DropdownMenuItem>
                                  </DialogoConfirmacion>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </EstadoConsulta>
          </CardContent>
        </Card>
      )}

      <TarifasDialog cuadrilla={viendoTarifasDe} onCerrar={() => setViendoTarifasDe(null)} />
    </div>
  )
}
