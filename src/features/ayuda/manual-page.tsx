import { useMemo, useState } from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { BookOpen, ChevronDown, HelpCircle, Search } from "lucide-react"
import { useArticulos, useManual } from "./use-ayuda"
import { ContenidoMarkdown } from "./manual/contenido-markdown"
import { normalizarBusqueda, textoBuscable } from "./manual/manuales"
import { ETIQUETA_MODULO, type Articulo, type ModuloAyuda } from "@/api/schemas/ayuda"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Un artículo editado hace menos de esto lleva la marca «Actualizado» (HU-36). */
const DIAS_RECIENTE = 30

function esReciente(articulo: Articulo, ahora = Date.now()): boolean {
  const fecha = articulo.updatedAt ?? articulo.createdAt
  return ahora - new Date(fecha).getTime() < DIAS_RECIENTE * 24 * 60 * 60 * 1000
}

/**
 * Manual de usuario del rol de la sesión (HU-36, W-034).
 *
 * El contenido viene empaquetado con la Web y no de la API: antes la pantalla
 * leía `articulos_ayuda`, que en producción estaba vacía porque solo la llena
 * el seed, y el usuario veía un centro de ayuda sin nada. La búsqueda es local
 * y deja solo las secciones que mencionan lo buscado.
 */
export function ManualPage() {
  const { user } = useAuth()
  const consulta = useManual(user?.rol)
  const [busqueda, setBusqueda] = useState("")

  const secciones = useMemo(() => {
    const todas = consulta.data?.secciones ?? []
    const texto = normalizarBusqueda(busqueda)
    if (!texto) return todas
    return todas.filter((s) => textoBuscable(s).includes(texto))
  }, [consulta.data, busqueda])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{consulta.data?.titulo ?? "Manual de usuario"}</h2>
          {consulta.data?.version && (
            <p className="text-xs text-muted-foreground">
              Versión del manual: {consulta.data.version}
            </p>
          )}
        </div>
        <div className="w-full space-y-1.5 sm:w-72">
          <Label htmlFor="ayuda-buscar">Buscar en el manual</Label>
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
      </div>

      <EstadoConsulta
        consulta={consulta}
        cantidad={secciones.length}
        hayFiltros={busqueda.length > 0}
        vacio={{
          titulo: "Este rol todavía no tiene manual",
          descripcion: "Usá «Pedir ayuda» para consultar al equipo técnico.",
        }}
        vacioPorFiltro={{
          titulo: "Ninguna sección menciona eso",
          descripcion: "Probá con otra palabra, por ejemplo «remito», «sensor» o «contraseña».",
        }}
      >
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <nav aria-label="Índice del manual" className="lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardContent className="p-3">
                <ol className="space-y-1 text-sm">
                  {secciones.map((seccion) => (
                    <li key={seccion.id}>
                      <a
                        href={`#${seccion.id}`}
                        className="block rounded px-2 py-1 font-medium hover:bg-accent"
                      >
                        {seccion.titulo}
                      </a>
                      {seccion.subtitulos.length > 0 && (
                        <ol className="mt-0.5 mb-1 space-y-0.5 border-l pl-2 ml-3">
                          {seccion.subtitulos.map((sub) => (
                            <li key={sub.id}>
                              <a
                                href={`#${sub.id}`}
                                className="block rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                              >
                                {sub.titulo}
                              </a>
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </nav>

          <div className="min-w-0 space-y-4">
            {secciones.map((seccion) => (
              <Card key={seccion.id} id={seccion.id} className="scroll-mt-4">
                <CardHeader>
                  <CardTitle className="text-base">
                    <h2>{seccion.titulo}</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent className="-mt-4">
                  <ContenidoMarkdown markdown={seccion.cuerpo} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </EstadoConsulta>

      {puede(user, "ayuda") && <ArticulosDeLaEmpresa busqueda={busqueda} />}
    </div>
  )
}

/**
 * Preguntas frecuentes cargadas en `articulos_ayuda`. Complementan el manual:
 * si no hay ninguna, la sección no se muestra.
 */
function ArticulosDeLaEmpresa({ busqueda }: { busqueda: string }) {
  const consulta = useArticulos({})

  const articulos = useMemo(() => {
    const texto = normalizarBusqueda(busqueda)
    const todos = consulta.data ?? []
    if (!texto) return todos
    return todos.filter((a) =>
      normalizarBusqueda(`${a.titulo} ${a.contenido}`).includes(texto)
    )
  }, [consulta.data, busqueda])

  if (!articulos.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <h2>Más preguntas frecuentes</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <AccordionPrimitive.Root type="multiple" className="divide-y border-t">
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
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {articulo.titulo}
                      {esReciente(articulo) && <Badge variant="secondary">Actualizado</Badge>}
                    </span>
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
      </CardContent>
    </Card>
  )
}
