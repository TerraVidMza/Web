import { toast } from "sonner"
import { MoreHorizontal, Pencil, UserX } from "lucide-react"
import { useDesactivarUsuario } from "./use-usuarios"
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
            descripcion="No va a poder iniciar sesión. Podés reactivarlo después desde Editar."
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
