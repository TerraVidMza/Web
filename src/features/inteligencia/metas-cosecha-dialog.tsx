import { useState, type ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { avanceDeCampania, fijarMetaCosecha } from "@/api/endpoints/inteligencia"
import type { Campania } from "@/api/schemas/inteligencia"
import { mensajeDeError } from "@/api/errores"
import { useFormato } from "@/context/configuracion-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function FilaMeta({
  campaniaId,
  cuartel,
}: {
  campaniaId: string
  cuartel: { cuartelId: string; cuartelNombre: string; fincaNombre: string; metaKg: number | null; kgCosechados: number }
}) {
  const formato = useFormato()
  const queryClient = useQueryClient()
  const [valor, setValor] = useState(cuartel.metaKg === null ? "" : String(cuartel.metaKg))
  const [guardando, setGuardando] = useState(false)
  const original = cuartel.metaKg === null ? "" : String(cuartel.metaKg)
  const numero = valor === "" ? 0 : Number(valor)
  const invalido = Number.isNaN(numero) || numero < 0

  async function guardar() {
    setGuardando(true)
    try {
      await fijarMetaCosecha(campaniaId, cuartel.cuartelId, numero)
      await queryClient.invalidateQueries({ queryKey: ["campanias", campaniaId, "avance"] })
      toast.success(`Meta de ${cuartel.cuartelNombre} guardada`)
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo guardar la meta"))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <TableRow>
      <TableCell>
        <span className="font-medium">{cuartel.cuartelNombre}</span>
        <span className="block text-xs text-muted-foreground">{cuartel.fincaNombre}</span>
      </TableCell>
      <TableCell className="text-right tabular-nums">{formato.kg(cuartel.kgCosechados)}</TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          step={100}
          inputMode="numeric"
          aria-label={`Meta en kg de ${cuartel.cuartelNombre}`}
          aria-invalid={invalido || undefined}
          className="w-32"
          placeholder="Sin meta"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          disabled={valor === original || invalido || guardando}
          onClick={() => void guardar()}
        >
          {guardando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Guardar
        </Button>
      </TableCell>
    </TableRow>
  )
}

/**
 * Metas de cosecha por cuartel de una campaña (D-027 del backend, W-028).
 * Las usa la app de campo para el indicador de avance. Vaciar el campo y
 * guardar borra la meta.
 */
export function MetasCosechaDialog({ campania, children }: { campania: Campania; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const formato = useFormato()
  const consulta = useQuery({
    queryKey: ["campanias", campania.id, "avance"],
    queryFn: () => avanceDeCampania(campania.id),
    enabled: abierto,
  })
  const avance = consulta.data

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Metas de cosecha — {campania.nombre}</DialogTitle>
          <DialogDescription>
            Kilos que se espera cosechar en cada cuartel. La app de campo muestra el avance contra
            esta meta.
            {avance?.metaKg != null &&
              ` Total: ${formato.kg(avance.kgCosechados)} de ${formato.kg(avance.metaKg)}.`}
          </DialogDescription>
        </DialogHeader>

        {consulta.isPending ? (
          <Loader2 className="mx-auto size-6 animate-spin" aria-label="Cargando" />
        ) : consulta.isError ? (
          <p className="text-sm text-destructive">{mensajeDeError(consulta.error, "No se pudo cargar el avance")}</p>
        ) : avance && avance.cuarteles.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuartel</TableHead>
                <TableHead className="text-right">Cosechado</TableHead>
                <TableHead>Meta (kg)</TableHead>
                <TableHead>
                  <span className="sr-only">Guardar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {avance.cuarteles.map((c) => (
                <FilaMeta key={c.cuartelId} campaniaId={campania.id} cuartel={c} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No hay cuarteles activos.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
