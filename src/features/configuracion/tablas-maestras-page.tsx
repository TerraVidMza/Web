import { useState } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react"
import {
  useActualizarCatalogo,
  useCatalogoCompleto,
  useCrearCatalogo,
  useDesactivarCatalogo,
  useEliminarCatalogo,
} from "./use-configuracion"
import { CatalogoTipo, type CatalogoItem } from "@/api/schemas/catalogo"
import { ActivoBadge } from "@/components/datos/estado-badge"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Los cuatro catálogos de HU-34.
 *
 * `estado_cuartel` **no es** el estado del ciclo de vendimia: ese es un enum de
 * código (`pendiente`/`en_cosecha`/`cosechado`) que mantiene el sistema a
 * partir de los pesajes. Este describe el ciclo de *plantación* —"Productivo",
 * "En implantación"— y son dimensiones independientes (D-013). Decirlo acá
 * evita que alguien intente editar desde el ABM un estado que el sistema
 * escribe solo.
 */
const CATALOGOS = [
  {
    tipo: CatalogoTipo.variedad,
    etiqueta: "Variedades",
    singular: "variedad",
    ayuda: "Las variedades de uva que se plantan en los cuarteles.",
  },
  {
    tipo: CatalogoTipo.sistema_conduccion,
    etiqueta: "Sistemas de conducción",
    singular: "sistema de conducción",
    ayuda: "Espaldero, parral, en vaso…",
  },
  {
    tipo: CatalogoTipo.estado_cuartel,
    etiqueta: "Estados de plantación",
    singular: "estado",
    ayuda:
      "El ciclo de plantación del cuartel («Productivo», «En implantación»). No es el estado de cosecha, que lo maneja el sistema a partir de los pesajes.",
  },
  {
    tipo: CatalogoTipo.unidad_medida,
    etiqueta: "Unidades de medida",
    singular: "unidad",
    ayuda: "Valores adicionales de unidad usados en los catálogos de la empresa.",
  },
] as const

const schema = z.object({
  nombre: z.string().trim().min(2, "Ingresá al menos 2 caracteres").max(100, "Máximo 100"),
})

function ValorDialog({
  tipo,
  singular,
  item,
  children,
}: {
  tipo: CatalogoTipo
  singular: string
  item?: CatalogoItem
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearCatalogo()
  const actualizar = useActualizarCatalogo()
  const esEdicion = item !== undefined

  const form = useFormularioApi({
    schema,
    defaultValues: { nombre: item?.nombre ?? "" },
    exito: esEdicion ? "Valor actualizado" : "Valor agregado",
    error: esEdicion ? "No se pudo actualizar el valor" : "No se pudo agregar el valor",
    onSubmit: async (valores) => {
      if (esEdicion) {
        await actualizar.mutateAsync({ id: item.id, nombre: valores.nombre })
      } else {
        await crear.mutateAsync({ tipo, nombre: valores.nombre })
      }
    },
    onExito: () => setAbierto(false),
  })

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (v) form.reset({ nombre: item?.nombre ?? "" })
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? `Editar ${item.nombre}` : `Nueva ${singular}`}</DialogTitle>
          <DialogDescription>
            El nombre tiene que ser único entre los valores activos de este catálogo.
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
            <ErrorDelServidor form={form} />
            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {esEdicion ? "Guardar cambios" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/** Tablas maestras por empresa (HU-34). */
export function TablasMaestrasPage() {
  const [tipoElegido, setTipoElegido] = useState<CatalogoTipo>(CatalogoTipo.variedad)
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const consulta = useCatalogoCompleto(tipoElegido, incluirInactivos)
  const desactivar = useDesactivarCatalogo()
  const eliminar = useEliminarCatalogo()

  const config = CATALOGOS.find((c) => c.tipo === tipoElegido)!
  const items = consulta.data ?? []

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="catalogo-tipo">Catálogo</Label>
          <Select
            value={tipoElegido}
            onValueChange={(v) => setTipoElegido(v as CatalogoTipo)}
          >
            <SelectTrigger id="catalogo-tipo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATALOGOS.map((catalogo) => (
                <SelectItem key={catalogo.tipo} value={catalogo.tipo}>
                  {catalogo.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="catalogo-estado">Estado</Label>
          <Select
            value={incluirInactivos ? "todos" : "activos"}
            onValueChange={(v) => setIncluirInactivos(v === "todos")}
          >
            <SelectTrigger id="catalogo-estado" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Solo activos</SelectItem>
              <SelectItem value="todos">Incluir dados de baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ValorDialog tipo={tipoElegido} singular={config.singular}>
          <Button>
            <Plus className="size-4" aria-hidden="true" />
            Agregar valor
          </Button>
        </ValorDialog>
      </div>

      <p className="text-sm text-muted-foreground">{config.ayuda}</p>

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={items.length}
            hayFiltros={incluirInactivos}
            vacio={{
              titulo: `Este catálogo está vacío`,
              descripcion: "Agregá el primer valor con el botón de arriba.",
            }}
          >
            <Table>
              <TableCaption className="sr-only">
                Valores del catálogo {config.etiqueta.toLowerCase()} de la empresa
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell>
                      <ActivoBadge activo={item.activo} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Acciones de ${item.nombre}`}
                          >
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <ValorDialog
                            tipo={tipoElegido}
                            singular={config.singular}
                            item={item}
                          >
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="size-4" aria-hidden="true" />
                              Editar
                            </DropdownMenuItem>
                          </ValorDialog>

                          {item.activo && (
                            <DialogoConfirmacion
                              titulo={`¿Dar de baja ${item.nombre}?`}
                              descripcion="Deja de ofrecerse en los formularios nuevos. Los cuarteles que ya lo usan lo conservan."
                              textoConfirmar="Dar de baja"
                              errorPorDefecto="No se pudo dar de baja el valor"
                              onConfirmar={async () => {
                                await desactivar.mutateAsync(item.id)
                                toast.success(`${item.nombre} quedó dado de baja`)
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

                          {/*
                            Eliminar y dar de baja no son lo mismo: la baja saca
                            el valor de los formularios nuevos, el borrado lo
                            hace desaparecer. El backend rechaza el borrado si
                            algún cuartel lo usa, y el mensaje dice cuántos.
                          */}
                          <DialogoConfirmacion
                            titulo={`¿Eliminar ${item.nombre}?`}
                            descripcion="Se borra definitivamente. Solo se puede si ningún cuartel lo está usando; si lo usan, dalo de baja en su lugar."
                            textoConfirmar="Eliminar"
                            errorPorDefecto="No se pudo eliminar el valor"
                            onConfirmar={async () => {
                              await eliminar.mutateAsync(item.id)
                              toast.success(`${item.nombre} fue eliminado`)
                            }}
                          >
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              Eliminar
                            </DropdownMenuItem>
                          </DialogoConfirmacion>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
