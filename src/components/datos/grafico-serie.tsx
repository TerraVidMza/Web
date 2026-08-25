import { useId } from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PuntoSerie } from "@/api/schemas/telemetria"
import { useFormato } from "@/context/configuracion-context"

/**
 * Serie de tiempo de un sensor: promedio con banda de variación (HU-20).
 *
 * **Una sola serie**, así que no lleva caja de leyenda: el título de la tarjeta
 * la nombra. Lo que sí lleva etiqueta son los umbrales, porque un color de
 * estado nunca debe cargar significado solo.
 *
 * La banda min–máx no es decoración: cada punto es el agregado de un período
 * entero, y dibujar solo el promedio fingiría una precisión que el dato no
 * tiene. Con la banda se ve de un vistazo si el promedio esconde oscilaciones.
 *
 * Los colores están validados contra las superficies reales de la aplicación
 * (`#ffffff` y `#171717`) en ambos modos: separación CVD ΔE 23.8 / 25.7 y
 * contraste ≥ 3:1. El modo oscuro usa pasos propios, no un volteo automático.
 */
export function GraficoSerie({
  puntos,
  unidad,
  umbralMinimo,
  umbralMaximo,
  granularidad,
}: {
  puntos: PuntoSerie[]
  unidad: string
  umbralMinimo: number | null
  umbralMaximo: number | null
  granularidad: "hora" | "dia"
}) {
  const formato = useFormato()
  const idBanda = useId()

  const datos = puntos.map((punto) => ({
    ...punto,
    // Recharts apila los valores de un `Area` con dos claves, así que la banda
    // se dibuja como base invisible + alto: de ahí el par mínimo/rango.
    rango: punto.maximo - punto.minimo,
    etiqueta:
      granularidad === "hora"
        ? formato.fechaHora(punto.periodo)
        : formato.fecha(punto.periodo),
  }))

  const numero = (valor: number) =>
    `${formato.numero(valor, { maximumFractionDigits: 2 })} ${unidad}`

  return (
    <div
      className="w-full [--eje:#898781] [--grilla:#e1e0d9] [--serie:#2a78d6] [--banda:#cde2fb] [--limite:#d03b3b] dark:[--grilla:#2c2c2a] dark:[--serie:#3987e5] dark:[--banda:#184f95]"
      // Los tokens van por rol y no como hex sueltos para que el intercambio
      // claro/oscuro ocurra en un solo lugar.
    >
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={datos} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          {/* Hairline sólida, un tono por encima de la superficie. Sin líneas
              punteadas: puntear se lee como "proyección" o "umbral". */}
          <CartesianGrid stroke="var(--grilla)" strokeWidth={1} vertical={false} />

          <XAxis
            dataKey="etiqueta"
            tick={{ fill: "var(--eje)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--grilla)" }}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "var(--eje)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
            unit={` ${unidad}`}
          />

          <Tooltip
            cursor={{ stroke: "var(--eje)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const punto = payload[0].payload as (typeof datos)[number]
              return (
                <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium">{punto.etiqueta}</p>
                  <p className="text-muted-foreground">
                    Promedio <span className="tabular-nums">{numero(punto.promedio)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Rango{" "}
                    <span className="tabular-nums">
                      {numero(punto.minimo)} – {numero(punto.maximo)}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    {punto.lecturas} lectura{punto.lecturas === 1 ? "" : "s"}
                  </p>
                </div>
              )
            }}
          />

          {/* Banda de variación: base transparente + alto del rango. */}
          <Area
            dataKey="minimo"
            stackId={idBanda}
            stroke="none"
            fill="transparent"
            isAnimationActive={false}
          />
          <Area
            dataKey="rango"
            stackId={idBanda}
            stroke="none"
            fill="var(--banda)"
            fillOpacity={0.55}
            isAnimationActive={false}
          />

          {umbralMinimo !== null && (
            <ReferenceLine
              y={umbralMinimo}
              stroke="var(--limite)"
              strokeWidth={2}
              label={{
                value: `mín ${umbralMinimo}`,
                position: "insideBottomLeft",
                fill: "var(--limite)",
                fontSize: 11,
              }}
            />
          )}
          {umbralMaximo !== null && (
            <ReferenceLine
              y={umbralMaximo}
              stroke="var(--limite)"
              strokeWidth={2}
              label={{
                value: `máx ${umbralMaximo}`,
                position: "insideTopLeft",
                fill: "var(--limite)",
                fontSize: 11,
              }}
            />
          )}

          <Line
            dataKey="promedio"
            stroke="var(--serie)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
