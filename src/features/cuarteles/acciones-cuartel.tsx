import { Link } from "react-router-dom"
import { toast } from "sonner"
import { History, MoreHorizontal, Pencil, Power } from "lucide-react"
import { useDesactivarCuartel } from "./use-cuarteles"
import { CuartelDialog } from "./cuartel-dialog"
import type { Cuartel } from "@/api/schemas/cuartel"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Editar y dar de baja un cuartel (HU-09).
 *
 * Editar es de Propietario y Agrónomo; la baja, solo del Propietario. No es una
 * distinción inventada: son los `@Roles` de `CuartelesController`.
 */
export function AccionesCuartel({ cuartel }: { cuartel: Cuartel }) {
  const { user } = useAuth()
  const desactivar = useDesactivarCuartel()
  const puedeEditar = puede(user?.rol, "cuartelesEscritura")
  const puedeDarDeBaja = puede(user?.rol, "cuartelesBaja")
  const puedeVerHistorial = puede(user?.rol, "historialLabores")

  if (!puedeEditar && !puedeDarDeBaja && !puedeVerHistorial) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${cuartel.nombre}`}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {puedeVerHistorial && (
          <DropdownMenuItem asChild>
            <Link to={`/cuarteles/${cuartel.id}/historial`}>
              <History className="size-4" aria-hidden="true" />
              Ver historial
            </Link>
          </DropdownMenuItem>
        )}

        {puedeEditar && (
          <CuartelDialog fincaId={cuartel.fincaId} cuartel={cuartel}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </DropdownMenuItem>
          </CuartelDialog>
        )}

        {puedeDarDeBaja && cuartel.activo && (
          <DialogoConfirmacion
            titulo={`¿Dar de baja ${cuartel.nombre}?`}
            descripcion="El cuartel deja de aparecer en los listados y de aceptar labores y pesajes. Su historial se conserva."
            textoConfirmar="Dar de baja"
            errorPorDefecto="No se pudo dar de baja el cuartel"
            onConfirmar={async () => {
              await desactivar.mutateAsync(cuartel.id)
              toast.success(`${cuartel.nombre} quedó dado de baja`)
            }}
          >
            <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
              <Power className="size-4" aria-hidden="true" />
              Dar de baja
            </DropdownMenuItem>
          </DialogoConfirmacion>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
