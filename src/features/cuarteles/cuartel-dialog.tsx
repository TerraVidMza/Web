import { useState, type ReactNode } from "react"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { useActualizarCuartel, useCrearCuartel, useCuartelesDeFinca } from "./use-cuarteles"
import { useCatalogo } from "@/features/catalogos/use-catalogos"
import { useFincas } from "@/features/fincas/use-fincas"
import { EditorPoligonoDiferido } from "@/features/mapa/editor-poligono-diferido"
import type { CapaDeContexto } from "@/features/mapa/editor-poligono"
import { poligonoSchema, type PoligonoGeoJson } from "@/api/schemas/geo"
import { datosGeograficos } from "@/lib/poligono-payload"
import { avisarAdvertencias } from "@/components/formulario/avisar-advertencias"
import { CatalogoTipo } from "@/api/schemas/catalogo"
import type { Cuartel } from "@/api/schemas/cuartel"
import {
  anioImplantacion,
  clon,
  hectareasOpcional,
  latitud,
  longitud,
  nombreCorto,
  uuidRequerido,
} from "@/lib/campos"
import { useFormularioApi } from "@/components/formulario/use-formulario-api"
import { ErrorDelServidor } from "@/components/formulario/error-del-servidor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const cuartelSchema = z.object({
  nombre: nombreCorto,
  variedadId: uuidRequerido("Falta elegir la variedad"),
  sistemaConduccionId: uuidRequerido("Falta elegir el sistema de conducción"),
  clon,
  anioImplantacion,
  hectareas: hectareasOpcional,
  latitud,
  longitud,
  poligono: poligonoSchema.nullable(),
})

function valoresIniciales(cuartel?: Cuartel) {
  return {
    nombre: cuartel?.nombre ?? "",
    variedadId: cuartel?.variedadId ?? "",
    sistemaConduccionId: cuartel?.sistemaConduccionId ?? "",
    clon: cuartel?.clon ?? "",
    anioImplantacion: cuartel?.anioImplantacion != null ? String(cuartel.anioImplantacion) : "",
    hectareas: cuartel?.hectareas != null ? String(cuartel.hectareas) : "",
    latitud: cuartel?.latitud != null ? String(cuartel.latitud) : "",
    longitud: cuartel?.longitud != null ? String(cuartel.longitud) : "",
    poligono: cuartel?.poligono ?? null,
  }
}

/**
 * Mapa para dibujar el contorno del cuartel, con el de la finca y el de los
 * otros cuarteles de fondo para dibujar adentro. Componente aparte: sus
 * consultas se hacen recién cuando el diálogo se abre.
 */
function ContornoDeCuartel({
  fincaId,
  cuartelId,
  valor,
  onChange,
}: {
  fincaId: string
  cuartelId?: string
  valor: PoligonoGeoJson | null
  onChange: (poligono: PoligonoGeoJson | null) => void
}) {
  const fincas = useFincas()
  const hermanos = useCuartelesDeFinca(fincaId)
  const finca = fincas.data?.find((f) => f.id === fincaId)

  const contexto: CapaDeContexto[] = [
    ...(finca?.poligono ? [{ id: finca.id, poligono: finca.poligono, tipo: "finca" as const }] : []),
    ...(hermanos.data ?? []).flatMap((c) =>
      c.poligono && c.id !== cuartelId
        ? [{ id: c.id, poligono: c.poligono, tipo: "cuartel" as const }]
        : []
    ),
  ]
  const centro: [number, number] | null =
    finca?.latitud != null && finca.longitud != null ? [finca.latitud, finca.longitud] : null

  return (
    <EditorPoligonoDiferido
      entidad="cuartel"
      valor={valor}
      onChange={onChange}
      contexto={contexto}
      centroInicial={centro}
    />
  )
}

/** Alta y edición de cuartel (HU-09). */
export function CuartelDialog({
  fincaId,
  cuartel,
  children,
}: {
  fincaId: string
  /** Ausente = alta. */
  cuartel?: Cuartel
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearCuartel()
  const actualizar = useActualizarCuartel()
  const variedades = useCatalogo(CatalogoTipo.variedad)
  const sistemas = useCatalogo(CatalogoTipo.sistema_conduccion)
  const esEdicion = cuartel !== undefined

  const form = useFormularioApi({
    schema: cuartelSchema,
    defaultValues: valoresIniciales(cuartel),
    exito: esEdicion ? "Cuartel actualizado" : "Cuartel creado correctamente",
    error: esEdicion ? "No se pudo actualizar el cuartel" : "No se pudo crear el cuartel",
    onSubmit: async ({ poligono, hectareas, latitud, longitud, ...resto }) => {
      const datos = {
        ...resto,
        ...datosGeograficos(cuartel?.poligono, poligono, { hectareas, latitud, longitud }),
      }
      // `fincaId` no va en la edición: el backend lo omite del DTO de update
      // porque un cuartel no cambia de finca.
      const guardado = esEdicion
        ? await actualizar.mutateAsync({ id: cuartel.id, ...datos })
        : await crear.mutateAsync({ ...datos, fincaId })
      avisarAdvertencias(guardado)
    },
    onExito: () => setAbierto(false),
  })

  const poligono = form.watch("poligono")

  function alCambiar(nuevoAbierto: boolean) {
    setAbierto(nuevoAbierto)
    if (nuevoAbierto) form.reset(valoresIniciales(cuartel))
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiar}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? `Editar ${cuartel.nombre}` : "Nuevo cuartel"}</DialogTitle>
          <DialogDescription>
            Definí la parametrización técnica del cuartel dentro de la finca. El estado de
            cosecha lo maneja el sistema a partir de los pesajes, no se carga acá.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void form.enviar(e)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Cuartel 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="variedadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variedad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full" data-campo="variedadId">
                        <SelectValue placeholder="Seleccioná una variedad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {variedades.data?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sistemaConduccionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sistema de conducción</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full" data-campo="sistemaConduccionId">
                        <SelectValue placeholder="Seleccioná un sistema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sistemas.data?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="clon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clon</FormLabel>
                    <FormControl>
                      <Input placeholder="R5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anioImplantacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año de implantación</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="2015" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="poligono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contorno en el mapa</FormLabel>
                  <ContornoDeCuartel
                    fincaId={fincaId}
                    cuartelId={cuartel?.id}
                    valor={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {poligono ? (
              <p className="text-sm text-muted-foreground">
                Las hectáreas y la ubicación en el mapa se calculan a partir del contorno. Para
                cargarlas a mano, quitá el contorno.
              </p>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="hectareas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hectáreas</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="latitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <ErrorDelServidor form={form} />

            <DialogFooter>
              <Button type="submit" disabled={form.enviando}>
                {form.enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {esEdicion ? "Guardar cambios" : "Crear cuartel"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
