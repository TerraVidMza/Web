import {
  AlertTriangle,
  CloudUpload,
  FileWarning,
  Grape,
  LandPlot,
  MapPinned,
  Wallet,
} from "lucide-react"
import { Link } from "react-router-dom"
import type { IndicadoresClave } from "@/api/schemas/dashboard"
import { useFormato } from "@/context/configuracion-context"
import { EstadoBadge } from "@/components/datos/estado-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "./stat-card"

type Operativos = Extract<IndicadoresClave, { fincasActivas: number }>

function Grilla({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
}

/** Las cinco tarjetas que comparten Propietario, Agrónomo y Capataz. */
export function PanelOperativo({ datos }: { datos: Operativos }) {
  const formato = useFormato()

  /**
   * `campaniaActual` es dato nuevo (D-014) y vale usarlo: sin él la tarjeta
   * daba por sentado el año calendario, que en Mendoza parte la vendimia al
   * medio porque la cosecha arranca en febrero.
   */
  const periodo = datos.campaniaActual
    ? `Campaña ${datos.campaniaActual.nombre}`
    : "Sin campaña definida: se cuenta el año calendario"

  return (
    <Grilla>
      <StatCard
        title="Fincas activas"
        value={formato.numero(datos.fincasActivas)}
        icon={LandPlot}
      />
      <StatCard
        title="Cuarteles activos"
        value={formato.numero(datos.cuartelesActivos)}
        icon={MapPinned}
      />
      <StatCard
        title="Alertas IoT pendientes"
        value={formato.numero(datos.alertasIotPendientes)}
        icon={AlertTriangle}
        hint={datos.alertasIotPendientes > 0 ? "Requieren revisión" : "Todo en orden"}
      />
      <StatCard
        title="Remitos pendientes"
        value={formato.numero(datos.remitosPendientesAprobacion)}
        icon={FileWarning}
        hint="Esperando aprobación"
      />
      <StatCard
        title="Kg cosechados"
        value={formato.kg(datos.kgCosechadosCampaniaActual)}
        icon={Grape}
        hint={periodo}
      />
    </Grilla>
  )
}

/** Reparto de cuarteles por estado de cosecha (HU-32). */
export function PanelEstadoCosecha({ datos }: { datos: Operativos }) {
  const { estadoCosechaGlobal } = datos
  const formato = useFormato()

  if (estadoCosechaGlobal.total === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Estado de cosecha ({formato.numero(estadoCosechaGlobal.total)} cuarteles)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* El backend devuelve los estados en cero también: sin ellos la barra
            perdería la categoría vacía y el reparto se leería distinto de un
            día para otro. */}
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {estadoCosechaGlobal.porEstado.map((e) => (
            <div
              key={e.estado}
              className="h-full first:rounded-l-full last:rounded-r-full data-[estado=cosechado]:bg-emerald-500 data-[estado=en_cosecha]:bg-sky-500 data-[estado=pendiente]:bg-muted-foreground/30"
              data-estado={e.estado}
              style={{ width: `${e.porcentaje}%` }}
            />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {estadoCosechaGlobal.porEstado.map((e) => (
            <li key={e.estado} className="flex items-center gap-2 text-sm">
              <EstadoBadge estado={e.estado} />
              <span className="tabular-nums text-muted-foreground">
                {formato.numero(e.cuarteles)} ({formato.numero(e.porcentaje)}%)
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

type ConEconomia = Extract<IndicadoresClave, { costoLaboresTotal: number }>

export function PanelEconomico({ datos }: { datos: ConEconomia }) {
  const formato = useFormato()

  return (
    <>
      <Grilla>
        <StatCard
          title="Costo operativo total"
          value={formato.dinero(datos.costoLaboresTotal + datos.costoInsumosTotal)}
          icon={Wallet}
          hint={`Labores ${formato.dinero(datos.costoLaboresTotal)} · Insumos ${formato.dinero(datos.costoInsumosTotal)}`}
        />
        <StatCard
          title="Registros con error de sync"
          value={formato.numero(datos.registrosConError)}
          icon={CloudUpload}
          hint={
            datos.registrosConError > 0
              ? "Hay trabajo de campo que no llegó al sistema"
              : "Sin registros pendientes"
          }
        />
      </Grilla>

      {datos.costosPorFinca.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Costo por finca</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {datos.costosPorFinca.map((finca) => (
                <li key={finca.fincaId} className="flex justify-between py-2 text-sm">
                  <span>{finca.fincaNombre}</span>
                  <span className="tabular-nums">{formato.dinero(finca.costoTotal)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {datos.alertasRecientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Alertas recientes sin revisar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {datos.alertasRecientes.map((alerta) => (
                <li key={alerta.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <EstadoBadge estado={alerta.estado} />
                  <span className="font-medium">{alerta.sensor?.codigo ?? "Sensor"}</span>
                  <span className="text-muted-foreground">
                    {alerta.tipoAlerta === "umbral_maximo" ? "superó el máximo" : "cayó del mínimo"}{" "}
                    ({formato.numero(alerta.valorLectura)} vs{" "}
                    {formato.numero(alerta.umbralSuperado)})
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formato.fechaHora(alerta.timestampLectura)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  )
}

type Capataz = Extract<IndicadoresClave, { rol: "Capataz" }>

export function PanelCapataz({ datos }: { datos: Capataz }) {
  const formato = useFormato()

  return (
    <>
      <Grilla>
        <StatCard
          title="Registros sin sincronizar"
          value={formato.numero(datos.registrosPendientesSync)}
          icon={CloudUpload}
          hint="Quedaron en el dispositivo"
        />
        <StatCard
          title="Registros con error"
          value={formato.numero(datos.registrosConErrorSync)}
          icon={AlertTriangle}
        />
      </Grilla>

      {datos.cuartelesEnCosecha.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cuarteles en cosecha</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {datos.cuartelesEnCosecha.map((c) => (
                <li key={c.cuartelId} className="flex justify-between py-2 text-sm">
                  <span>
                    {c.fincaNombre} · <span className="font-medium">{c.cuartelNombre}</span>
                  </span>
                  <span className="tabular-nums">{formato.kg(c.kgCosechados)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  )
}

type Auditor = Extract<IndicadoresClave, { rol: "Auditor" }>

/**
 * El panel del Auditor.
 *
 * Su respuesta del backend es `{ rol, eventosRecientes }` y nada más: ninguna
 * de las claves que leían las tarjetas existe ahí. Como
 * `Intl.NumberFormat.format(undefined)` devuelve `"NaN"` en vez de lanzar, el
 * Auditor entraba al sistema y su pantalla de inicio eran seis tarjetas que
 * decían NaN.
 */
export function PanelAuditor({ datos }: { datos: Auditor }) {
  const formato = useFormato()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">
          Actividad de las últimas 24 horas
        </CardTitle>
        <Link to="/auditoria" className="text-sm text-primary hover:underline">
          Ver el log completo
        </Link>
      </CardHeader>
      <CardContent>
        {datos.eventosRecientes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hubo actividad registrada en las últimas 24 horas.
          </p>
        ) : (
          <ul className="divide-y">
            {datos.eventosRecientes.map((evento) => (
              <li key={evento.id} className="flex flex-wrap items-baseline gap-2 py-2 text-sm">
                <span className="font-medium">{evento.accion}</span>
                <span className="text-muted-foreground">sobre {evento.entidad}</span>
                <span className="text-muted-foreground">
                  por {evento.actor?.nombre ?? evento.actorId}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formato.fechaHora(evento.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
