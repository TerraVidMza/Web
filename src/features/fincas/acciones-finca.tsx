import { toast } from "sonner"
import { MoreHorizontal, Pencil, Power } from "lucide-react"
import { useDesactivarFinca } from "./use-fincas"
import { FincaDialog } from "./finca-dialog"
import type { Finca } from "@/api/schemas/finca"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Editar y dar de baja una finca (HU-08).
 *
 * Los dos diálogos viven fuera del menú y no como items suyos: un
 * `DropdownMenuItem` que abre un diálogo desmonta el menú al cerrarse y se
 * lleva el diálogo con él. Por eso el menú solo tiene botones que disparan a
 * los triggers de al lado.
 */
export function AccionesFinca({ finca }: { finca: Finca }) {
  const desactivar = useDesactivarFinca()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${finca.nombre}`}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <FincaDialog finca={finca}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Pencil className="size-4" aria-hidden="true" />
            Editar
          </DropdownMenuItem>
        </FincaDialog>

        <DialogoConfirmacion
          titulo={`¿Dar de baja ${finca.nombre}?`}
          descripcion={
            <>
              La finca deja de aparecer en los listados y no se puede volver a activar desde
              la aplicación. Su historial de labores y pesajes se conserva.
            </>
          }
          textoConfirmar="Dar de baja"
          errorPorDefecto="No se pudo dar de baja la finca"
          onConfirmar={async () => {
            await desactivar.mutateAsync(finca.id)
            toast.success(`${finca.nombre} quedó dada de baja`)
          }}
        >
          <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
            <Power className="size-4" aria-hidden="true" />
            Dar de baja
          </DropdownMenuItem>
        </DialogoConfirmacion>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
