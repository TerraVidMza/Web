import { useMemo, useState } from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { BookOpen, ChevronDown, HelpCircle, Search } from "lucide-react"
import { useArticulos } from "./use-ayuda"
import {
  ETIQUETA_MODULO,
  moduloAyudaSchema,
  tipoArticuloSchema,
  type ModuloAyuda,
  type TipoArticulo,
} from "@/api/schemas/ayuda"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TODOS = "todos"

/**
 * Manual y preguntas frecuentes (HU-36).
 *
 * El filtro por módulo se manda al backend, que ahora lo valida: antes llegaba
 * crudo y `?modulo=vendmia` —con el typo— devolvía 200 con la lista vacía, o
 * sea un centro de ayuda sin artículos y nada que explicara por qué. La
 * búsqueda por texto, en cambio, es local: el endpoint no la ofrece y el manual
 * de una empresa no llega a tener tantos artículos como para justificar pedirla.
 */
export function ManualPage() {
  const [tipo, setTipo] = useState<string>(TODOS)
  const [modulo, setModulo] = useState<string>(TODOS)
  const [busqueda, setBusqueda] = useState("")

  const params = useMemo(
    () => ({
      ...(tipo !== TODOS ? { tipo: tipo as TipoArticulo } : {}),
      ...(modulo !== TODOS ? { modulo: modulo as ModuloAyuda } : {}),
    }),
    [tipo, modulo]
  )

  const consulta = useArticulos(params)

  const articulos = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const todos = consulta.data ?? []
    if (!texto) return todos
    return todos.filter(
      (a) =>
        a.titulo.toLowerCase().includes(texto) || a.contenido.toLowerCase().includes(texto)
    )
  }, [consulta.data, busqueda])

  const hayFiltros = tipo !== TODOS || modulo !== TODOS || busqueda.length > 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="ayuda-buscar">Buscar</Label>
          <div className="relative">
            <Search
              className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="ayuda-buscar"
              type="search"
              className="pl-8"
              placeholder="Palabra clave..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ayuda-tipo">Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger id="ayuda-tipo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todo</SelectItem>
              {tipoArticuloSchema.options.map((opcion) => (
                <SelectItem key={opcion} value={opcion}>
                  {opcion === "manual" ? "Manual" : "Preguntas frecuentes"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ayuda-modulo">Módulo</Label>
          <Select value={modulo} onValueChange={setModulo}>
            <SelectTrigger id="ayuda-modulo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {moduloAyudaSchema.options.map((opcion) => (
                <SelectItem key={opcion} value={opcion}>
                  {ETIQUETA_MODULO[opcion]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={articulos.length}
            hayFiltros={hayFiltros}
            vacio={{
              titulo: "Todavía no hay artículos cargados",
              descripcion: "El Propietario puede cargar el manual y las preguntas frecuentes.",
            }}
            vacioPorFiltro={{
              titulo: "Ningún artículo coincide",
              descripcion: "Probá con otra palabra, otro módulo o quitá los filtros.",
            }}
          >
            <AccordionPrimitive.Root type="multiple" className="divide-y">
              {articulos.map((articulo) => (
                <AccordionPrimitive.Item key={articulo.id} value={articulo.id}>
                  <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger className="group flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/50">
                      {articulo.tipo === "faq" ? (
                        <HelpCircle
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        <BookOpen
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{articulo.titulo}</span>
                        <span className="block text-xs text-muted-foreground">
                          {ETIQUETA_MODULO[articulo.modulo as ModuloAyuda] ?? articulo.modulo}
                        </span>
                      </span>
                      <ChevronDown
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                        aria-hidden="true"
                      />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content className="overflow-hidden">
                    <div className="px-4 pb-4 pl-11 text-sm whitespace-pre-line text-muted-foreground">
                      {articulo.contenido}
                    </div>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          </EstadoConsulta>
        </CardContent>
      </Card>
    </div>
  )
}
