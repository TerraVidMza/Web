import { useState } from "react"
import { Link } from "react-router-dom"
import { MapPinned, Search } from "lucide-react"
import { useFincas } from "./use-fincas"
import { CrearFincaDialog } from "./crear-finca-dialog"
import { useAuth } from "@/context/auth-context"
import { useFormato } from "@/context/configuracion-context"
import { puede } from "@/auth/permisos"
import { ActivoBadge } from "@/components/datos/estado-badge"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Input } from "@/components/ui/input"
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

export function FincasPage() {
  const [busqueda, setBusqueda] = useState("")
  const consulta = useFincas(busqueda || undefined)
  const { user } = useAuth()
  const formato = useFormato()

  const fincas = consulta.data ?? []
  const puedeCrear = puede(user?.rol, "fincasEscritura")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fincas y Cuarteles</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná la estructura espacial de tu operación.
          </p>
        </div>
        {puedeCrear && <CrearFincaDialog />}
      </div>

      <div className="relative max-w-sm">
        <Search
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Buscar finca por nombre"
          placeholder="Buscar finca..."
          className="pl-8"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={fincas.length}
            hayFiltros={busqueda.length > 0}
            vacio={{
              titulo: "No hay fincas cargadas todavía",
              descripcion: puedeCrear
                ? "Creá la primera con el botón de arriba."
                : "Cuando el Propietario cargue una, va a aparecer acá.",
            }}
            vacioPorFiltro={{
              titulo: `Ninguna finca coincide con "${busqueda}"`,
              descripcion: "Probá con otro nombre o limpiá la búsqueda.",
            }}
          >
            <Table>
              <TableCaption className="sr-only">
                Fincas de la empresa con su superficie y cantidad de cuarteles activos
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Hectáreas</TableHead>
                  <TableHead className="text-right">Cuarteles</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fincas.map((finca) => (
                  <TableRow key={finca.id}>
                    <TableCell className="font-medium">{finca.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {finca.ubicacion ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.hectareas(finca.hectareas)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.numero(finca.cuartelesActivos)}
                    </TableCell>
                    <TableCell>
                      <ActivoBadge activo={finca.activa} etiquetas={["Activa", "Inactiva"]} />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/fincas/${finca.id}/cuarteles`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <MapPinned className="size-4" aria-hidden="true" />
                        Cuarteles
                        <span className="sr-only"> de {finca.nombre}</span>
                      </Link>
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
