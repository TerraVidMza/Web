import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useCuarteles } from "@/hooks/use-cuarteles"
import { CreateCuartelDialog } from "./create-cuartel-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function CuartelesPage() {
  const { fincaId } = useParams<{ fincaId: string }>()
  const { data: cuarteles, isLoading, isError } = useCuarteles(fincaId ?? "")

  return (
    <div className="space-y-6">
      <div>
        <Link to="/fincas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Volver a fincas
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cuarteles</h1>
          <p className="text-sm text-muted-foreground">Cuarteles de la finca seleccionada.</p>
        </div>
        {fincaId && <CreateCuartelDialog fincaId={fincaId} />}
      </div>

      <Card>
        <CardContent className="p-0">
          {isError && <p className="p-6 text-sm text-destructive">No se pudieron cargar los cuarteles.</p>}

          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : cuarteles && cuarteles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Variedad</TableHead>
                  <TableHead>Sistema de conducción</TableHead>
                  <TableHead className="text-right">Hectáreas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuarteles.map((cuartel) => (
                  <TableRow key={cuartel.id}>
                    <TableCell className="font-medium">{cuartel.nombre}</TableCell>
                    <TableCell>{cuartel.variedad?.nombre ?? "—"}</TableCell>
                    <TableCell>{cuartel.sistemaConduccion?.nombre ?? "—"}</TableCell>
                    <TableCell className="text-right">{cuartel.hectareas ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={cuartel.activo ? "default" : "secondary"}>
                        {cuartel.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Esta finca todavía no tiene cuarteles cargados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
