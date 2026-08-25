import { useState } from "react"
import { Link } from "react-router-dom"
import { MapPinned, Plus, Search } from "lucide-react"
import { useFincas } from "./use-fincas"
import { FincaDialog } from "./finca-dialog"
import { AccionesFinca } from "./acciones-finca"
import { useAuth } from "@/context/auth-context"
import { useFormato } from "@/context/configuracion-context"
import { puede } from "@/auth/permisos"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Button } from "@/components/ui/button"
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

/** `ListarFincasDto.search` es `@Length(1, 100)`: más largo es un 400. */
const LARGO_MAXIMO_BUSQUEDA = 100

export function FincasPage() {
  const [busqueda, setBusqueda] = useState("")
  const consulta = useFincas(busqueda || undefined)
  const { user } = useAuth()
  const formato = useFormato()

  const fincas = consulta.data ?? []
  const puedeEscribir = puede(user?.rol, "fincasEscritura")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fincas</h1>
          <p className="text-sm text-muted-foreground">
            Las fincas activas de tu empresa.{" "}
            <Link to="/cuarteles" className="text-primary hover:underline">
              Buscar cuarteles en todas
            </Link>
            .
          </p>
        </div>
        {puedeEscribir && (
          <FincaDialog>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nueva finca
            </Button>
          </FincaDialog>
        )}
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
          maxLength={LARGO_MAXIMO_BUSQUEDA}
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
              descripcion: puedeEscribir
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
                Fincas activas de la empresa con su superficie y cantidad de cuarteles
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Hectáreas</TableHead>
                  <TableHead className="text-right">Cuarteles</TableHead>
                  <TableHead className="w-24">
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
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/fincas/${finca.id}/cuarteles`}>
                            <MapPinned className="size-4" aria-hidden="true" />
                            Cuarteles
                            <span className="sr-only"> de {finca.nombre}</span>
                          </Link>
                        </Button>
                        {puedeEscribir && <AccionesFinca finca={finca} />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </EstadoConsulta>
        </CardContent>
      </Card>

      {/* El backend solo devuelve las fincas activas: `findAll` filtra por
          `activa: true` y no acepta un parámetro para incluir las dadas de
          baja. Decirlo es más honesto que una columna "Estado" que siempre
          dice lo mismo. */}
      <p className="text-xs text-muted-foreground">
        Las fincas dadas de baja no se listan. Como para darlas de baja hay que dar de baja
        antes sus cuarteles, esos cuarteles quedan visibles en la búsqueda marcando «incluir
        inactivos».
      </p>
    </div>
  )
}
