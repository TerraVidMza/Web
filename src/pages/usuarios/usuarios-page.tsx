import { toast } from "sonner"
import { UserX } from "lucide-react"
import { useDesactivarUsuario, useUsuarios } from "@/hooks/use-usuarios"
import { CreateUsuarioDialog } from "./create-usuario-dialog"
import { getApiErrorMessage } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function UsuariosPage() {
  const { data: usuarios, isLoading, isError } = useUsuarios()
  const desactivar = useDesactivarUsuario()

  async function handleDesactivar(id: string) {
    try {
      await desactivar.mutateAsync(id)
      toast.success("Usuario desactivado")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo desactivar el usuario"))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Administrá los usuarios de tu empresa y sus roles.</p>
        </div>
        <CreateUsuarioDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          {isError && <p className="p-6 text-sm text-destructive">No se pudieron cargar los usuarios.</p>}

          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : usuarios && usuarios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                    <TableCell>{usuario.rol.nombreRol}</TableCell>
                    <TableCell>
                      <Badge variant={usuario.activo ? "default" : "secondary"}>
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usuario.activo && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Desactivar usuario"
                          onClick={() => void handleDesactivar(usuario.id)}
                        >
                          <UserX className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">No hay usuarios cargados todavía.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
