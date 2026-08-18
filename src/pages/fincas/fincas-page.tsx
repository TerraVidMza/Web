import { useState } from "react"
import { Link } from "react-router-dom"
import { MapPinned, Search } from "lucide-react"
import { useFincas } from "@/hooks/use-fincas"
import { CreateFincaDialog } from "./create-finca-dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function FincasPage() {
  const [search, setSearch] = useState("")
  const { data: fincas, isLoading, isError } = useFincas(search || undefined)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fincas y Cuarteles</h1>
          <p className="text-sm text-muted-foreground">Gestioná la estructura espacial de tu operación.</p>
        </div>
        <CreateFincaDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar finca..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isError && (
            <p className="p-6 text-sm text-destructive">No se pudieron cargar las fincas.</p>
          )}

          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : fincas && fincas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Hectáreas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fincas.map((finca) => (
                  <TableRow key={finca.id}>
                    <TableCell className="font-medium">{finca.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{finca.ubicacion ?? "—"}</TableCell>
                    <TableCell className="text-right">{finca.hectareas}</TableCell>
                    <TableCell>
                      <Badge variant={finca.activa ? "default" : "secondary"}>
                        {finca.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/fincas/${finca.id}/cuarteles`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <MapPinned className="size-4" />
                        Cuarteles
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No hay fincas cargadas todavía. Creá la primera con el botón de arriba.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
