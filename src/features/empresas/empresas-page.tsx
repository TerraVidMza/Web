import { toast } from "sonner"
import { useCambiarEstadoEmpresa, useEmpresas } from "./use-empresas"
import { CrearEmpresaDialog } from "./crear-empresa-dialog"
import { mensajeDeError } from "@/api/errores"
import { DialogoConfirmacion } from "@/components/datos/dialogo-confirmacion"
import { useFormato } from "@/context/configuracion-context"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

/**
 * Empresas cliente de la plataforma (D-025 del backend). Es la única pantalla
 * del Administrador de plataforma, además de su perfil.
 */
export function EmpresasPage() {
  const consulta = useEmpresas()
  const cambiarEstado = useCambiarEstadoEmpresa()
  const formato = useFormato()
  const empresas = consulta.data ?? []

  async function activar(id: string) {
    try {
      await cambiarEstado.mutateAsync({ id, activa: true })
      toast.success("Empresa activada")
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo activar la empresa"))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Los clientes de la plataforma. Cada empresa ve solo sus propios datos.
          </p>
        </div>
        <CrearEmpresaDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={empresas.length}
            vacio={{
              titulo: "Todavía no hay empresas",
              descripcion: "Creá la primera con el botón de arriba.",
            }}
          >
            <Table>
              <TableCaption className="sr-only">
                Empresas cliente con su CUIT, usuarios activos y estado
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead className="text-right">Usuarios activos</TableHead>
                  <TableHead>Alta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-32">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-medium">{empresa.nombre}</TableCell>
                    <TableCell className="tabular-nums">{empresa.cuit}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formato.numero(empresa.usuariosActivos)}
                    </TableCell>
                    <TableCell>{formato.fecha(empresa.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={empresa.activa ? "secondary" : "outline"}>
                        {empresa.activa ? "Activa" : "Desactivada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {empresa.activa ? (
                        <DialogoConfirmacion
                          titulo={`¿Desactivar ${empresa.nombre}?`}
                          descripcion={
                            <>
                              Sus {empresa.usuariosActivos} usuarios activos no van a poder
                              iniciar sesión hasta que la vuelvas a activar. Sus datos se
                              conservan.
                            </>
                          }
                          textoConfirmar="Desactivar"
                          errorPorDefecto="No se pudo desactivar la empresa"
                          onConfirmar={async () => {
                            await cambiarEstado.mutateAsync({ id: empresa.id, activa: false })
                            toast.success(`${empresa.nombre} quedó desactivada`)
                          }}
                        >
                          <Button variant="ghost" size="sm">
                            Desactivar<span className="sr-only"> {empresa.nombre}</span>
                          </Button>
                        </DialogoConfirmacion>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={cambiarEstado.isPending}
                          onClick={() => void activar(empresa.id)}
                        >
                          Activar<span className="sr-only"> {empresa.nombre}</span>
                        </Button>
                      )}
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
