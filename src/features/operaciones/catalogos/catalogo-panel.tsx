import { useState } from "react"
import { toast } from "sonner"
import { DollarSign, MoreHorizontal, Pencil, Plus, Power } from "lucide-react"
import {
  useCatalogoCosteable,
  useDesactivarCatalogoCosteable,
} from "./use-catalogo-costeable"
import { CatalogoDialog } from "./catalogo-dialog"
import { CostosDialog } from "./costos-dialog"
import type { CatalogoCosteableConfig } from "./config"
import type { Insumo } from "@/api/schemas/operaciones"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { ActivoBadge } from "@/components/datos/estado-badge"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * ABM de un catálogo costeable (HU-16): insumos o tipos de labor.
 *
 * El listado **no trae el costo vigente**: `GET /insumos` devuelve solo el
 * catálogo, y el precio vive en `/:id/costos`. Pedirlo por fila serían N+1
 * requests al dibujar la tabla, así que el costo se consulta al abrir el
 * diálogo de costos, que además muestra el historial completo — más útil que
 * un número suelto, y es lo que el endpoint da.
 */
export function CatalogoPanel({ config }: { config: CatalogoCosteableConfig }) {
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const [viendoCostosDe, setViendoCostosDe] = useState<Insumo | null>(null)
  const consulta = useCatalogoCosteable(config, incluirInactivos)
  const desactivar = useDesactivarCatalogoCosteable(config)
  const { user } = useAuth()

  const items = consulta.data ?? []
  // `@Roles(PROPIETARIO, AGRONOMO)` para crear y editar; la baja es solo del
  // Propietario. Son los decoradores del controller, no una regla inventada.
  const puedeEscribir = puede(user, "operaciones")
  const puedeDarDeBaja = puede(user, "catalogosEscritura")

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={incluirInactivos ? "todos" : "activos"}
          onValueChange={(v) => setIncluirInactivos(v === "todos")}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activos">Solo activos</SelectItem>
            <SelectItem value="todos">Incluir dados de baja</SelectItem>
          </SelectContent>
        </Select>

        {puedeEscribir && (
          <CatalogoDialog config={config}>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo {config.singular}
            </Button>
          </CatalogoDialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={items.length}
            hayFiltros={incluirInactivos}
            vacio={{
              titulo: `Todavía no hay ${config.plural.toLowerCase()}`,
              descripcion: puedeEscribir
                ? "Creá el primero con el botón de arriba."
                : "Los administra el Propietario o el Agrónomo.",
            }}
          >
            <Table>
              <TableCaption className="sr-only">
                {config.plural} de la empresa, con su unidad de medida y estado
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-32">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {item.descripcion ?? "—"}
                    </TableCell>
                    <TableCell>{item.unidadMedida}</TableCell>
                    <TableCell>
                      <ActivoBadge activo={item.activo} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          // Etiqueta explícita en vez de un sufijo `sr-only`:
                          // el botón se repite una vez por fila, y "Costos" a
                          // secas no distingue de cuál.
                          aria-label={`Costos de ${item.nombre}`}
                          onClick={() => setViendoCostosDe(item)}
                        >
                          <DollarSign className="size-4" aria-hidden="true" />
                          Costos
                        </Button>

                        {puedeEscribir && (
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
                              <CatalogoDialog config={config} item={item}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Pencil className="size-4" aria-hidden="true" />
                                  Editar
                                </DropdownMenuItem>
                              </CatalogoDialog>

                              {puedeDarDeBaja && item.activo && (
                                <DialogoConfirmacion
                                  titulo={`¿Dar de baja ${item.nombre}?`}
                                  descripcion="Deja de ofrecerse al cargar labores nuevas. Las ya registradas conservan su costo y no cambian."
                                  textoConfirmar="Dar de baja"
                                  errorPorDefecto={`No se pudo dar de baja ${config.articulo} ${config.singular}`}
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

      <CostosDialog
        config={config}
        item={viendoCostosDe}
        onCerrar={() => setViendoCostosDe(null)}
      />
    </div>
  )
}
