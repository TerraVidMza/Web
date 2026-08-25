import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useRoles, useUsuarios } from "./use-usuarios"
import { CrearUsuarioDialog } from "./crear-usuario-dialog"
import { AccionesUsuario } from "./acciones-usuario"
import { ETIQUETA_ROL } from "@/auth/roles"
import { useFormato } from "@/context/configuracion-context"
import { ActivoBadge } from "@/components/datos/estado-badge"
import { TablaPaginada } from "@/components/datos/tabla-paginada"
import { usePaginacion } from "@/components/datos/paginacion"
import { Input } from "@/components/ui/input"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TODOS = "todos"

export function UsuariosPage() {
  const [busqueda, setBusqueda] = useState("")
  const [rolId, setRolId] = useState<string>(TODOS)
  const [estado, setEstado] = useState<string>(TODOS)
  const paginacion = usePaginacion()
  const roles = useRoles()
  const formato = useFormato()

  const params = useMemo(
    () => ({
      page: paginacion.page,
      pageSize: paginacion.pageSize,
      ...(busqueda ? { buscar: busqueda } : {}),
      ...(rolId !== TODOS ? { rolId } : {}),
      ...(estado !== TODOS ? { activo: estado === "activos" } : {}),
    }),
    [paginacion.page, paginacion.pageSize, busqueda, rolId, estado]
  )

  const consulta = useUsuarios(params)
  const hayFiltros = busqueda.length > 0 || rolId !== TODOS || estado !== TODOS

  function alFiltrar<T>(setter: (valor: T) => void) {
    return (valor: T) => {
      setter(valor)
      // Filtrar estando en la página 5 deja al usuario mirando una tabla vacía
      // aunque haya resultados.
      paginacion.reiniciar()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administrá los usuarios de tu empresa y sus roles.
          </p>
        </div>
        <CrearUsuarioDialog />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Buscar por nombre o email"
            placeholder="Buscar por nombre o email..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => alFiltrar(setBusqueda)(e.target.value)}
          />
        </div>

        <Select value={rolId} onValueChange={alFiltrar(setRolId)}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por rol">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los roles</SelectItem>
            {roles.data?.map((rol) => (
              <SelectItem key={rol.id} value={rol.id}>
                {ETIQUETA_ROL[rol.nombreRol]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={estado} onValueChange={alFiltrar(setEstado)}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="inactivos">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TablaPaginada
        consulta={consulta}
        paginacion={paginacion}
        caption="Usuarios de la empresa con su rol, estado y último acceso"
        etiquetaTotal="usuarios"
        hayFiltros={hayFiltros}
        vacio={{ titulo: "No hay usuarios cargados todavía" }}
        vacioPorFiltro={{
          titulo: "Ningún usuario coincide con los filtros",
          descripcion: "Probá con otro texto, rol o estado.",
        }}
        encabezado={
          <>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Último acceso</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </>
        }
        fila={(usuario) => (
          <TableRow key={usuario.id}>
            <TableCell className="font-medium">{usuario.nombre}</TableCell>
            <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
            <TableCell>{ETIQUETA_ROL[usuario.rol.nombreRol]}</TableCell>
            <TableCell className="text-muted-foreground">
              {formato.fechaHora(usuario.ultimoAcceso)}
            </TableCell>
            <TableCell>
              <ActivoBadge activo={usuario.activo} />
            </TableCell>
            <TableCell>
              <AccionesUsuario usuario={usuario} />
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}
