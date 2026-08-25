import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useCuartelesDeFinca } from "./use-cuarteles"
import { CrearCuartelDialog } from "./crear-cuartel-dialog"
import { useAuth } from "@/context/auth-context"
import { useFormato } from "@/context/configuracion-context"
import { puede } from "@/auth/permisos"
import { ActivoBadge, EstadoBadge } from "@/components/datos/estado-badge"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function CuartelesPage() {
  const { fincaId } = useParams<{ fincaId: string }>()
  const consulta = useCuartelesDeFinca(fincaId ?? "")
  const { user } = useAuth()
  const formato = useFormato()

  const cuarteles = consulta.data ?? []
  const puedeCrear = puede(user?.rol, "cuartelesEscritura")

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/fincas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a fincas
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cuarteles</h1>
          <p className="text-sm text-muted-foreground">Cuarteles de la finca seleccionada.</p>
        </div>
        {fincaId && puedeCrear && <CrearCuartelDialog fincaId={fincaId} />}
      </div>

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={cuarteles.length}
            vacio={{
              titulo: "Esta finca todavía no tiene cuarteles",
              descripcion: puedeCrear
                ? "Creá el primero con el botón de arriba."
                : "Cuando se cargue alguno, va a aparecer acá.",
            }}
          >
            <Table>
              <TableCaption className="sr-only">
                Cuarteles de la finca, con su variedad, superficie y estado de cosecha
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Variedad</TableHead>
                  <TableHead>Sistema de conducción</TableHead>
                  <TableHead className="text-right">Año</TableHead>
                  <TableHead className="text-right">Hectáreas</TableHead>
                  <TableHead>Cosecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuarteles.map((cuartel) => (
                  <TableRow key={cuartel.id}>
                    <TableCell className="font-medium">{cuartel.nombre}</TableCell>
                    <TableCell>{cuartel.variedad?.nombre ?? "—"}</TableCell>
                    <TableCell>{cuartel.sistemaConduccion?.nombre ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {cuartel.anioImplantacion ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.hectareas(cuartel.hectareas)}
                    </TableCell>
                    <TableCell>
                      <EstadoBadge estado={cuartel.estado} />
                    </TableCell>
                    <TableCell>
                      <ActivoBadge activo={cuartel.activo} />
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
