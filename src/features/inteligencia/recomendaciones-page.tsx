import { useState } from "react"
import { toast } from "sonner"
import { Check, Lightbulb, Loader2, RefreshCw, X } from "lucide-react"
import {
  useEvaluarRecomendaciones,
  useListadoRecomendaciones,
  useResolverRecomendacion,
} from "./use-inteligencia"
import type { Recomendacion } from "@/api/schemas/inteligencia"
import { useFincas } from "@/features/fincas/use-fincas"
import { useFormato } from "@/context/configuracion-context"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const TODAS = "todas"

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
 * Recomendaciones agronómicas de toda la empresa (HU-30).
 *
 * El listado **solo lee** lo ya generado: mostrar la pantalla no evalúa nada.
 * Las novedades se buscan con el botón «Buscar nuevas», que evalúa las reglas de
 * todos los cuarteles —o de la finca elegida— y suma lo que aparezca. Antes
 * había que entrar cuartel por cuartel, y abrir cada uno disparaba la evaluación
 * sin que nadie lo pidiera.
 *
 * Una vez resuelta no se puede reabrir: borraría quién y cuándo la resolvió. Si
 * la condición se repite, la regla genera una nueva.
 */
export function RecomendacionesPage() {
  const [fincaId, setFincaId] = useState(TODAS)
  const [filtro, setFiltro] = useState<"activa" | "todas">("activa")
  const fincas = useFincas()
  const consulta = useListadoRecomendaciones({
    estado: filtro,
    fincaId: fincaId === TODAS ? undefined : fincaId,
  })
  const evaluar = useEvaluarRecomendaciones()
  const formato = useFormato()

  const recomendaciones = consulta.data ?? []

  async function buscarNuevas() {
    const r = await evaluar.mutateAsync(fincaId === TODAS ? undefined : fincaId)
    const cuarteles = `${r.cuartelesEvaluados} cuartel${r.cuartelesEvaluados === 1 ? "" : "es"}`
    const sinHistorico =
      r.sinHistorico > 0 ? ` ${r.sinHistorico} todavía sin histórico suficiente.` : ""
    if (r.nuevas > 0) {
      toast.success(
        `${r.nuevas} recomendaci${r.nuevas === 1 ? "ón nueva" : "ones nuevas"} en ${cuarteles}.${sinHistorico}`
      )
    } else {
      toast.info(`Sin novedades en ${cuarteles}.${sinHistorico}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full space-y-1.5 sm:w-72">
          <Label htmlFor="recomendaciones-finca">Finca</Label>
          <Select value={fincaId} onValueChange={setFincaId}>
            <SelectTrigger id="recomendaciones-finca" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas las fincas</SelectItem>
              {fincas.data?.map((finca) => (
                <SelectItem key={finca.id} value={finca.id}>
                  {finca.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" disabled={evaluar.isPending} onClick={() => void buscarNuevas()}>
          {evaluar.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          Buscar nuevas
        </Button>
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as "activa" | "todas")}>
        <TabsList>
          <TabsTrigger value="activa">Activas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <EstadoConsulta
            consulta={consulta}
            cantidad={recomendaciones.length}
            hayFiltros={filtro === "activa" || fincaId !== TODAS}
            vacio={{
              titulo: "Todavía no hay recomendaciones",
              descripcion:
                "Usá «Buscar nuevas» para que el sistema evalúe las reglas contra el histórico de cada cuartel.",
            }}
            vacioPorFiltro={{
              titulo: "No hay recomendaciones para mostrar",
              descripcion:
                "Probá «Buscar nuevas», o cambiá a «Todas» para ver las ya resueltas.",
            }}
          >
            <ul className="divide-y">
              {recomendaciones.map((recomendacion) => {
                const severidad = SEVERIDAD[recomendacion.severidad] ?? SEVERIDAD.baja
                return (
                  <li key={recomendacion.id} className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Lightbulb className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm font-medium">
                        {recomendacion.cuartel.finca.nombre} · {recomendacion.cuartel.nombre}
                      </span>
                      <Badge variant="outline" className={cn("border-transparent", severidad.clase)}>
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

                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Por qué: </span>
                        <span className="text-muted-foreground">{recomendacion.patronDetectado}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Qué hacer: </span>
                        {recomendacion.accionSugerida}
                      </p>
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
        Una recomendación resuelta no se reabre: eso borraría quién y cuándo la resolvió. Si la
        condición vuelve a darse, la regla genera una nueva.
      </p>
    </div>
  )
}
