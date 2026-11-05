import { toast } from "sonner";
import { MoreHorizontal, Pencil, Power, RotateCcw } from "lucide-react";
import { useActivarFinca, useDesactivarFinca } from "./use-fincas";
import { FincaDialog } from "./finca-dialog";
import type { Finca } from "@/api/schemas/finca";
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Editar y dar de baja una finca (HU-08).
 *
 * Los dos diálogos viven fuera del menú y no como items suyos: un
 * `DropdownMenuItem` que abre un diálogo desmonta el menú al cerrarse y se
 * lleva el diálogo con él. Por eso el menú solo tiene botones que disparan a
 * los triggers de al lado.
 */
export function AccionesFinca({ finca }: { finca: Finca }) {
  const desactivar = useDesactivarFinca();
  const activar = useActivarFinca();

  // Una finca dada de baja solo se puede reactivar: editarla o darla de baja de
  // nuevo no tiene sentido.
  if (!finca.activa) {
    return (
      <DialogoConfirmacion
        titulo={`¿Reactivar ${finca.nombre}?`}
        descripcion="Vuelve a aparecer en los listados. Sus cuarteles conservan el estado que tenían: los que se dieron de baja hay que reactivarlos uno por uno."
        textoConfirmar="Reactivar"
        tono="confirmacion"
        errorPorDefecto="No se pudo reactivar la finca"
        onConfirmar={async () => {
          await activar.mutateAsync(finca.id);
          toast.success(`${finca.nombre} está activa de nuevo`);
        }}
      >
        <Button
          variant="outline"
          size="sm"
          aria-label={`Reactivar ${finca.nombre}`}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reactivar
        </Button>
      </DialogoConfirmacion>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Acciones de ${finca.nombre}`}
        >
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
              La finca deja de aparecer en los listados, pero se puede reactivar
              desde «Ver dadas de baja». Su historial de labores y pesajes se
              conserva.
            </>
          }
          textoConfirmar="Dar de baja"
          errorPorDefecto="No se pudo dar de baja la finca"
          onConfirmar={async () => {
            await desactivar.mutateAsync(finca.id);
            toast.success(`${finca.nombre} quedó dada de baja`);
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
