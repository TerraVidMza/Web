import { toast } from "sonner"
import { MoreHorizontal, Pencil, RotateCcw, UserX } from "lucide-react"
import { useActivarUsuario, useDesactivarUsuario } from "./use-usuarios"
import { EditarUsuarioDialog } from "./editar-usuario-dialog"
import type { Usuario } from "@/api/schemas/usuario"
import { useAuth } from "@/context/auth-context"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AccionesUsuario({ usuario }: { usuario: Usuario }) {
  const desactivar = useDesactivarUsuario()
  const activar = useActivarUsuario()
  const { user } = useAuth()
  const esUnoMismo = user?.id === usuario.id

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${usuario.nombre}`}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditarUsuarioDialog usuario={usuario}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Pencil className="size-4" aria-hidden="true" />
            Editar
          </DropdownMenuItem>
        </EditarUsuarioDialog>

        {usuario.activo && !esUnoMismo && (
          <DialogoConfirmacion
            titulo={`¿Desactivar a ${usuario.nombre}?`}
            descripcion="No va a poder iniciar sesión. Podés reactivarlo después con «Reactivar»."
            textoConfirmar="Desactivar"
            errorPorDefecto="No se pudo desactivar el usuario"
            onConfirmar={async () => {
              await desactivar.mutateAsync(usuario.id)
              toast.success(`${usuario.nombre} quedó desactivado`)
            }}
          >
            <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
              <UserX className="size-4" aria-hidden="true" />
              Desactivar
            </DropdownMenuItem>
          </DialogoConfirmacion>
        )}

        {!usuario.activo && (
          <DialogoConfirmacion
            titulo={`¿Reactivar a ${usuario.nombre}?`}
            descripcion="Vuelve a poder iniciar sesión con su contraseña de siempre y conserva sus fincas asignadas."
            textoConfirmar="Reactivar"
            tono="confirmacion"
            errorPorDefecto="No se pudo reactivar el usuario"
            onConfirmar={async () => {
              await activar.mutateAsync(usuario.id)
              toast.success(`${usuario.nombre} está activo de nuevo`)
            }}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Reactivar
            </DropdownMenuItem>
          </DialogoConfirmacion>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
