import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { LogAuditoria } from "@/api/schemas/log-auditoria"

function comoTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "—"
  if (typeof valor === "object") return JSON.stringify(valor)
  return String(valor)
}

/**
 * Diferencia entre `datosAnteriores` y `datosNuevos`.
 *
 * Se muestran solo las claves que cambiaron: volcar los dos objetos completos
 * obliga a comparar a ojo, que es exactamente el trabajo que una auditoría
 * tiene que ahorrar.
 *
 * El backend ya sanea el payload —nunca guarda `password`, `passwordHash` ni
 * tokens—, así que lo que llega es seguro de mostrar.
 */
export function DetalleCambios({ evento }: { evento: LogAuditoria }) {
  const [abierto, setAbierto] = useState(false)
  const antes = evento.datosAnteriores ?? {}
  const despues = evento.datosNuevos ?? {}
  const claves = [...new Set([...Object.keys(antes), ...Object.keys(despues)])]
    .filter((clave) => comoTexto(antes[clave]) !== comoTexto(despues[clave]))
    .sort((a, b) => a.localeCompare(b))

  if (claves.length === 0) {
    return <span className="text-xs text-muted-foreground">Sin detalle</span>
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {abierto ? (
          <ChevronDown className="size-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-3" aria-hidden="true" />
        )}
        {claves.length} {claves.length === 1 ? "campo" : "campos"}
      </button>

      {abierto && (
        <dl className="mt-2 space-y-1 text-xs">
          {claves.map((clave) => (
            <div key={clave} className="flex flex-wrap gap-x-2">
              <dt className="font-medium">{clave}:</dt>
              <dd className="text-muted-foreground">
                <del>{comoTexto(antes[clave])}</del> → <ins>{comoTexto(despues[clave])}</ins>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
