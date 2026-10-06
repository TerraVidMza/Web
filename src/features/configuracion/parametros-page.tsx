import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, ShieldAlert } from "lucide-react"
import {
  CLAVES_SECRETAS,
  VALOR_ENMASCARADO,
  useConfiguracion,
  useFijarConfiguracion,
} from "./use-configuracion"
import type { ClaveConfiguracion } from "@/api/schemas/configuracion"
import { mensajeDeError } from "@/api/errores"
import { EstadoConsulta } from "@/components/datos/estado-consulta"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CampoConfig {
  clave: ClaveConfiguracion
  etiqueta: string
  ayuda?: string
  tipo?: "text" | "password" | "email" | "number"
  placeholder?: string
  /** Rango aceptado por el backend; fuera de él no se habilita «Guardar». */
  min?: number
  max?: number
}

/**
 * Los parámetros de HU-33, agrupados por lo que hacen.
 *
 * Tres de ellos no son cosméticos: `moneda`, `unidades` y `zona_horaria`
 * alimentan los formateadores de toda la aplicación (W-004), y `zona_horaria`
 * además decide cómo el backend agrupa las lecturas por día — agrupar en UTC
 * hace que en Argentina las de 21 a 24 h caigan a la jornada siguiente.
 */
const GRUPOS: Array<{ titulo: string; descripcion: string; campos: CampoConfig[] }> = [
  {
    titulo: "Organización",
    descripcion: "Cómo se identifica tu empresa dentro del sistema.",
    campos: [
      { clave: "nombre_organizacion", etiqueta: "Nombre", placeholder: "Bodega El Rosal" },
      {
        clave: "support_email",
        etiqueta: "Email de soporte",
        tipo: "email",
        ayuda: "A donde llegan los pedidos de ayuda que cargan los usuarios.",
      },
    ],
  },
  {
    titulo: "Formato regional",
    descripcion:
      "Afecta cómo se muestran los importes y las cantidades en todas las pantallas, y cómo el sistema agrupa las lecturas por día.",
    campos: [
      { clave: "moneda", etiqueta: "Moneda", placeholder: "ARS", ayuda: "Código ISO: ARS, USD…" },
      {
        clave: "unidades",
        etiqueta: "Unidades",
        placeholder: "metrico",
        ayuda: "`metrico` o `imperial`.",
      },
      {
        clave: "zona_horaria",
        etiqueta: "Zona horaria",
        placeholder: "America/Argentina/Mendoza",
        ayuda: "Decide a qué jornada pertenece cada lectura de sensor.",
      },
    ],
  },
  {
    titulo: "Correo saliente (SMTP)",
    descripcion:
      "Con lo que el sistema envía los correos de alta de usuario, recuperación de contraseña y avisos.",
    campos: [
      { clave: "smtp_host", etiqueta: "Host", placeholder: "smtp.gmail.com" },
      { clave: "smtp_port", etiqueta: "Puerto", tipo: "number", placeholder: "587" },
      { clave: "smtp_user", etiqueta: "Usuario" },
      { clave: "smtp_pass", etiqueta: "Contraseña", tipo: "password" },
      { clave: "smtp_from", etiqueta: "Remitente", placeholder: "TerraVid <no-reply@…>" },
    ],
  },
  {
    titulo: "Sesiones",
    descripcion:
      "Cuánto dura una sesión. Los cambios aplican a los próximos inicios de sesión y renovaciones.",
    campos: [
      {
        clave: "sesion_access_minutos",
        etiqueta: "Renovación automática (minutos)",
        tipo: "number",
        min: 5,
        max: 60,
        placeholder: "15",
        ayuda:
          "Cada cuánto la aplicación renueva la credencial en segundo plano, sin que el usuario lo note. Entre 5 y 60; por defecto 15.",
      },
      {
        clave: "sesion_refresh_dias",
        etiqueta: "Vencimiento por inactividad (días)",
        tipo: "number",
        min: 1,
        max: 30,
        placeholder: "7",
        ayuda:
          "Días sin usar el sistema después de los cuales hay que volver a ingresar la contraseña. Entre 1 y 30; por defecto 7. Un capataz que pasa días en campo sin señal necesita un valor alto.",
      },
    ],
  },
]

function fueraDeRango(campo: CampoConfig, valor: string): boolean {
  if (campo.min === undefined && campo.max === undefined) return false
  if (!/^\d+$/.test(valor)) return true
  const n = Number(valor)
  return (campo.min !== undefined && n < campo.min) || (campo.max !== undefined && n > campo.max)
}

function Campo({
  campo,
  valorGuardado,
  onGuardar,
  guardando,
}: {
  campo: CampoConfig
  valorGuardado: string | undefined
  onGuardar: (valor: string) => Promise<void>
  guardando: boolean
}) {
  const esSecreta = CLAVES_SECRETAS.has(campo.clave)
  const [valor, setValor] = useState("")

  // El valor guardado llega con la consulta, después del primer render.
  useEffect(() => {
    setValor(esSecreta ? "" : (valorGuardado ?? ""))
  }, [valorGuardado, esSecreta])

  const yaConfigurada = esSecreta && valorGuardado === VALOR_ENMASCARADO
  const sinCambios = esSecreta ? valor === "" : valor === (valorGuardado ?? "")
  const invalido = fueraDeRango(campo, valor)

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor={`config-${campo.clave}`}>{campo.etiqueta}</Label>
        <Input
          id={`config-${campo.clave}`}
          type={campo.tipo ?? "text"}
          min={campo.min}
          max={campo.max}
          aria-invalid={invalido && valor !== "" ? true : undefined}
          value={valor}
          placeholder={yaConfigurada ? "Ya configurada — escribí una nueva para cambiarla" : campo.placeholder}
          autoComplete={esSecreta ? "new-password" : "off"}
          onChange={(e) => setValor(e.target.value)}
        />
        {campo.ayuda && <p className="text-xs text-muted-foreground">{campo.ayuda}</p>}
      </div>
      <Button
        variant="outline"
        disabled={sinCambios || invalido || guardando}
        onClick={() => void onGuardar(valor)}
      >
        {guardando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Guardar
      </Button>
    </div>
  )
}

/** Parámetros del sistema por empresa (HU-33). */
export function ParametrosPage() {
  const consulta = useConfiguracion()
  const fijar = useFijarConfiguracion()

  const porClave = new Map(consulta.data?.map((c) => [c.clave, c.valor]))

  async function guardar(clave: ClaveConfiguracion, valor: string) {
    try {
      await fijar.mutateAsync({ clave, valor })
      toast.success("Parámetro guardado")
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo guardar el parámetro"))
    }
  }

  return (
    <EstadoConsulta
      consulta={consulta}
      cantidad={1}
      vacio={{ titulo: "No se pudo cargar la configuración" }}
      filasEsqueleto={6}
    >
      <div className="space-y-4">
        {GRUPOS.map((grupo) => (
          <Card key={grupo.titulo}>
            <CardHeader>
              <CardTitle className="text-base">{grupo.titulo}</CardTitle>
              <CardDescription>{grupo.descripcion}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {grupo.titulo.startsWith("Correo") && (
                <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {/*
                    El backend enmascara `smtp_pass` al leerla: esta pantalla
                    nunca recibe la contraseña real. Por eso el campo arranca
                    vacío y solo se envía si escribís una nueva — reenviar la
                    máscara guardaría ocho asteriscos como contraseña y dejaría
                    el correo saliente roto.
                  */}
                  La contraseña no se muestra nunca, ni siquiera al Propietario. El campo
                  queda vacío y solo se guarda si escribís una nueva.
                </p>
              )}
              {grupo.campos.map((campo) => (
                <Campo
                  key={campo.clave}
                  campo={campo}
                  valorGuardado={porClave.get(campo.clave)}
                  guardando={fijar.isPending}
                  onGuardar={(valor) => guardar(campo.clave, valor)}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </EstadoConsulta>
  )
}
