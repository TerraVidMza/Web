import { useState } from "react"
import { toast } from "sonner"
import { Check, Info, Lightbulb, X } from "lucide-react"
import { useRecomendaciones, useResolverRecomendacion } from "./use-inteligencia"
import { SelectorCuartel } from "./selector-cuartel"
import type { Recomendacion } from "@/api/schemas/inteligencia"
import { useFormato } from "@/context/configuracion-context"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

/** Los colores de estado nunca van solos: cada uno lleva su etiqueta. */
const SEVERIDAD: Record<string, { etiqueta: string; clase: string }> = {
  alta: {
    etiqueta: "Severidad alta",
    clase: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  },
  media: {
    etiqueta: "Severidad media",
    clase: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  baja: {
    etiqueta: "Severidad baja",
    clase: "bg-muted text-muted-foreground",
  },
}

function Resolver({ recomendacion }: { recomendacion: Recomendacion }) {
  const [nota, setNota] = useState("")
  const [abierto, setAbierto] = useState(false)
  const resolver = useResolverRecomendacion()

  async function enviar(estado: "aplicada" | "descartada") {
    await resolver.mutateAsync({
      id: recomendacion.id,
      estado,
      nota: nota.trim() || undefined,
    })
    setNota("")
    setAbierto(false)
    toast.success(estado === "aplicada" ? "Marcada como aplicada" : "Recomendación descartada")
  }

  if (!abierto) {
    return (
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        Resolver
      </Button>
    )
  }

  return (
    <div className="w-full space-y-2 sm:w-80">
      <Textarea
        rows={2}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        maxLength={300}
        placeholder="Nota (opcional): qué se hizo, o por qué no aplica"
        aria-label="Nota de la resolución"
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={resolver.isPending}
          onClick={() => void enviar("descartada")}
        >
          <X className="size-4" aria-hidden="true" />
          Descartar
        </Button>
        <Button size="sm" disabled={resolver.isPending} onClick={() => void enviar("aplicada")}>
          <Check className="size-4" aria-hidden="true" />
          Aplicada
        </Button>
      </div>
    </div>
  )
}

/**
 * Recomendaciones agronómicas de un cuartel (HU-30).
 *
 * **Abrir esta pantalla evalúa las reglas y persiste lo que corresponda.** Es
 * un GET con efecto de escritura, y es deliberado del backend: la historia pide
 * que las recomendaciones se generen del histórico y queden accionables, y no
 * hay otro momento natural para dispararlas. Es idempotente —un índice parcial
 * impide duplicar la activa de una misma regla—, pero por eso el hook no
 * refetchea al volver a enfocar la ventana.
 *
 * Una vez resuelta no se puede reabrir: borraría quién y cuándo la resolvió. Si
 * la condición se repite, la regla genera una nueva.
 */
export function RecomendacionesPage() {
  const [fincaId, setFincaId] = useState("")
  const [cuartelId, setCuartelId] = useState("")
  const [filtro, setFiltro] = useState<"activa" | "todas">("activa")
  const consulta = useRecomendaciones(cuartelId)
  const formato = useFormato()

  const todas = consulta.data ?? []
  const recomendaciones = filtro === "activa" ? todas.filter((r) => r.estado === "activa") : todas
  const activas = todas.filter((r) => r.estado === "activa").length

  return (
    <div className="space-y-4">
      <SelectorCuartel
        fincaId={fincaId}
        cuartelId={cuartelId}
        onFinca={(id) => {
          setFincaId(id)
          setCuartelId("")
        }}
        onCuartel={setCuartelId}
      />

      {!cuartelId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Info className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Elegí un cuartel</p>
            <p className="text-sm text-muted-foreground">
              Al abrirlo, el sistema evalúa las reglas contra su histórico y deja las
              recomendaciones que correspondan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as "activa" | "todas")}>
            <TabsList>
              <TabsTrigger value="activa">Activas{activas > 0 && ` (${activas})`}</TabsTrigger>
              <TabsTrigger value="todas">Todas</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardContent className="p-0">
              <EstadoConsulta
                consulta={consulta}
                cantidad={recomendaciones.length}
                hayFiltros={filtro === "activa"}
                vacio={{
                  titulo: "Este cuartel no tiene recomendaciones",
                  descripcion:
                    "Las reglas necesitan histórico de labores, pesajes y telemetría para encontrar patrones.",
                }}
                vacioPorFiltro={{
                  titulo: "No hay recomendaciones activas",
                  descripcion: "Cambiá a «Todas» para ver las ya resueltas.",
                }}
              >
                <ul className="divide-y">
                  {recomendaciones.map((recomendacion) => {
                    const severidad =
                      SEVERIDAD[recomendacion.severidad] ?? SEVERIDAD.baja
                    return (
                      <li key={recomendacion.id} className="space-y-2 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Lightbulb
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <Badge
                            variant="outline"
                            className={cn("border-transparent", severidad.clase)}
                          >
                            {severidad.etiqueta}
                          </Badge>
                          <Badge variant="outline">{recomendacion.variable}</Badge>
                          {recomendacion.estado !== "activa" && (
                            <Badge variant="secondary">
                              {recomendacion.estado === "aplicada" ? "Aplicada" : "Descartada"}
                            </Badge>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formato.fecha(recomendacion.createdAt)}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            {recomendacion.patronDetectado}
                          </p>
                          <p className="text-sm font-medium">{recomendacion.accionSugerida}</p>
                        </div>

                        {recomendacion.nota && (
                          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                            {recomendacion.nota}
                          </p>
                        )}

                        {recomendacion.estado === "activa" && (
                          <div className="flex justify-end">
                            <Resolver recomendacion={recomendacion} />
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </EstadoConsulta>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Una recomendación resuelta no se reabre: eso borraría quién y cuándo la
            resolvió. Si la condición vuelve a darse, la regla genera una nueva.
          </p>
        </>
      )}
    </div>
  )
}
