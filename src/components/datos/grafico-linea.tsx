import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useFormato } from "@/context/configuracion-context"
import { cn } from "@/lib/utils"

export interface PuntoDiario {
  fecha: string
  valor: number
}

/**
 * Una serie diaria, para usar en **múltiplos pequeños**.
 *
 * Existe separada de `<GraficoSerie>` por una razón concreta: HU-29 cruza una
 * variable de sensor con el costo diario del cuartel, y son dos magnitudes de
 * escalas distintas. Ponerlas en un solo gráfico con dos ejes Y inventa una
 * correlación visual que no está en el dato —la alineación de las dos escalas
 * es arbitraria—. Se dibujan dos gráficos apilados que comparten el eje de
 * fechas, y la correlación real la dice el coeficiente que calcula el backend.
 *
 * Cada gráfico tiene **una sola serie**, así que no lleva leyenda: el título la
 * nombra. Los dos colores son los slots 1 y 2 del tema, validados contra las
 * superficies de la aplicación en ambos modos.
 */
export function GraficoLinea({
  puntos,
  titulo,
  unidad,
  tono,
  formatoValor = "numero",
}: {
  puntos: PuntoDiario[]
  titulo: string
  unidad?: string
  tono: "serie1" | "serie2"
  formatoValor?: "numero" | "dinero"
}) {
  const formato = useFormato()

  const mostrar = (valor: number) =>
    formatoValor === "dinero"
      ? formato.dinero(valor)
      : `${formato.numero(valor, { maximumFractionDigits: 2 })}${unidad ? ` ${unidad}` : ""}`

  return (
    <figure className="space-y-1">
      <figcaption className="text-sm font-medium">{titulo}</figcaption>
      <div
        className={cn(
          "w-full [--eje:#898781] [--grilla:#e1e0d9] dark:[--grilla:#2c2c2a]",
          tono === "serie1"
            ? "[--linea:#2a78d6] dark:[--linea:#3987e5]"
            : "[--linea:#eb6834] dark:[--linea:#d95926]"
        )}
      >
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={puntos} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grilla)" strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="fecha"
              tick={{ fill: "var(--eje)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--grilla)" }}
              minTickGap={40}
              tickFormatter={(valor: string) => valor.slice(5)}
            />
            <YAxis
              tick={{ fill: "var(--eje)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              cursor={{ stroke: "var(--eje)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const punto = payload[0].payload as PuntoDiario
                return (
                  <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                    <p className="font-medium">{formato.fecha(punto.fecha)}</p>
                    <p className="tabular-nums text-muted-foreground">
                      {mostrar(punto.valor)}
                    </p>
                  </div>
                )
              }}
            />
            <Line
              dataKey="valor"
              stroke="var(--linea)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
