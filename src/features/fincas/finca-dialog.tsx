import { useState, type ReactNode } from "react"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { useActualizarFinca, useCrearFinca } from "./use-fincas"
import type { Finca } from "@/api/schemas/finca"
import { poligonoSchema, type PoligonoGeoJson } from "@/api/schemas/geo"
import { hectareasOpcional, latitud, longitud, nombreCorto, ubicacion } from "@/lib/campos"
import { datosGeograficos } from "@/lib/poligono-payload"
import { useCuartelesDeFinca } from "@/features/cuarteles/use-cuarteles"
import { EditorPoligonoDiferido } from "@/features/mapa/editor-poligono-diferido"
import type { CapaDeContexto } from "@/features/mapa/editor-poligono"
import { avisarAdvertencias } from "@/components/formulario/avisar-advertencias"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const fincaSchema = z
  .object({
    nombre: nombreCorto,
    ubicacion,
    hectareas: hectareasOpcional,
    latitud,
    longitud,
    poligono: poligonoSchema.nullable(),
  })
  // Con contorno las hectáreas las calcula el backend; sin él siguen siendo obligatorias.
  .refine((v) => v.poligono !== null || v.hectareas !== undefined, {
    message: "Ingresá las hectáreas o dibujá el contorno",
    path: ["hectareas"],
  })

/** Los `<input>` devuelven strings; el número vacío se representa como `""`. */
function valoresIniciales(finca?: Finca) {
  return {
    nombre: finca?.nombre ?? "",
    ubicacion: finca?.ubicacion ?? "",
    hectareas: finca ? String(finca.hectareas) : "",
    latitud: finca?.latitud != null ? String(finca.latitud) : "",
    longitud: finca?.longitud != null ? String(finca.longitud) : "",
    poligono: finca?.poligono ?? null,
  }
}

/**
 * Mapa para dibujar el contorno. Es un componente aparte para que los cuarteles
 * de la finca (que se dibujan de fondo) se pidan recién cuando el diálogo se
 * abre, y no una vez por cada fila de la lista.
 */
function ContornoDeFinca({
  finca,
  valor,
  onChange,
}: {
  finca?: Finca
  valor: PoligonoGeoJson | null
  onChange: (poligono: PoligonoGeoJson | null) => void
}) {
  const cuarteles = useCuartelesDeFinca(finca?.id ?? "")
  const contexto: CapaDeContexto[] = (cuarteles.data ?? []).flatMap((c) =>
    c.poligono ? [{ id: c.id, poligono: c.poligono, tipo: "cuartel" as const }] : []
  )
  const centro: [number, number] | null =
    finca?.latitud != null && finca.longitud != null ? [finca.latitud, finca.longitud] : null

  return (
    <EditorPoligonoDiferido
      entidad="finca"
      valor={valor}
      onChange={onChange}
      contexto={contexto}
      centroInicial={centro}
    />
  )
}

/**
 * Alta y edición en el mismo diálogo (HU-08).
 *
 * Los campos y las validaciones son idénticos, así que separarlos en dos
 * componentes duplicaría el formulario entero para cambiar un título y un
 * verbo — y garantizaría que dentro de tres meses uno tenga una validación que
 * el otro no.
 */
export function FincaDialog({
  finca,
  children,
}: {
  /** Ausente = alta. */
  finca?: Finca
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const crear = useCrearFinca()
  const actualizar = useActualizarFinca()
  const esEdicion = finca !== undefined

  const form = useFormularioApi({
    schema: fincaSchema,
    defaultValues: valoresIniciales(finca),
    exito: esEdicion ? "Finca actualizada" : "Finca creada correctamente",
    error: esEdicion ? "No se pudo actualizar la finca" : "No se pudo crear la finca",
    // Sin `empresaId`: el backend la toma del token y rechaza la request entera
    // si viene en el body (`forbidNonWhitelisted`).
    onSubmit: async ({ poligono, hectareas, latitud, longitud, ...resto }) => {
      const datos = {
        ...resto,
        ...datosGeograficos(finca?.poligono, poligono, { hectareas, latitud, longitud }),
      }
      const guardada = esEdicion
        ? await actualizar.mutateAsync({ id: finca.id, ...datos })
        : await crear.mutateAsync(datos)
      avisarAdvertencias(guardada)
    },
    onExito: () => setAbierto(false),
  })

  const poligono = form.watch("poligono")

  function alCambiar(nuevoAbierto: boolean) {
    setAbierto(nuevoAbierto)
    // Al reabrir hay que releer la finca: `useFormularioApi` resetea a los
    // valores por defecto del primer render, que en edición ya quedaron viejos
    // si otro usuario la modificó mientras tanto.
    if (nuevoAbierto) form.reset(valoresIniciales(finca))
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiar}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? `Editar ${finca.nombre}` : "Nueva finca"}</DialogTitle>
          <DialogDescription>
            Dibujá el contorno de la finca en el mapa: las hectáreas y el punto de ubicación
            se calculan solos. Si preferís, cargalos a mano.
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
                    <Input placeholder="Finca El Rosal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ubicacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Luján de Cuyo, Mendoza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="poligono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contorno en el mapa</FormLabel>
                  <ContornoDeFinca finca={finca} valor={field.value} onChange={field.onChange} />
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
                          <Input type="number" step="any" placeholder="-33.0362" {...field} />
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
                          <Input type="number" step="any" placeholder="-68.8833" {...field} />
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
                {esEdicion ? "Guardar cambios" : "Crear finca"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
