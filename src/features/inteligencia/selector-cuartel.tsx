import { useFincas } from "@/features/fincas/use-fincas"
import { useCuartelesDeFinca } from "@/features/cuarteles/use-cuarteles"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Elegir finca y después cuartel.
 *
 * En dos pasos y no en una lista plana porque el endpoint de cuarteles por
 * finca es el que devuelve los activos con sus relaciones; y porque una empresa
 * con diez fincas de veinte cuarteles daría un desplegable de doscientos.
 */
export function SelectorCuartel({
  fincaId,
  cuartelId,
  onFinca,
  onCuartel,
}: {
  fincaId: string
  cuartelId: string
  onFinca: (id: string) => void
  onCuartel: (id: string) => void
}) {
  const fincas = useFincas()
  const cuarteles = useCuartelesDeFinca(fincaId)

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="selector-finca">Finca</Label>
        <Select value={fincaId} onValueChange={onFinca}>
          <SelectTrigger id="selector-finca" className="w-full">
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

      <div className="space-y-1.5">
        <Label htmlFor="selector-cuartel">Cuartel</Label>
        <Select value={cuartelId} onValueChange={onCuartel} disabled={!fincaId}>
          <SelectTrigger id="selector-cuartel" className="w-full">
            <SelectValue placeholder="Elegí una finca primero" />
          </SelectTrigger>
          <SelectContent>
            {cuarteles.data?.map((cuartel) => (
              <SelectItem key={cuartel.id} value={cuartel.id}>
                {cuartel.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
