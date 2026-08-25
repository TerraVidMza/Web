import axios from "axios"
import { z } from "zod"

/**
 * La respuesta del backend no coincide con el schema declarado.
 *
 * Es la falla que este proyecto no tenía forma de ver: `api.get<Usuario[]>()`
 * es una **afirmación**, no una comprobación, así que un cambio de contrato
 * pasaba el build, pasaba el lint y aparecía tres pantallas más adentro como un
 * listado vacío o un `NaN`. Ahora falla acá, con el endpoint, el campo y lo que
 * llegó en vez de lo esperado.
 */
export class ErrorDeContrato extends Error {
  // Campos declarados y asignados a mano, no propiedades de parámetro: el
  // tsconfig tiene `erasableSyntaxOnly` y esa forma abreviada no se puede
  // borrar sin emitir código.
  readonly endpoint: string
  readonly error: z.ZodError

  constructor(endpoint: string, error: z.ZodError) {
    super(
      `La respuesta de ${endpoint} no coincide con el contrato esperado:\n${z.prettifyError(error)}`
    )
    this.name = "ErrorDeContrato"
    this.endpoint = endpoint
    this.error = error
  }
}

const cuerpoDeErrorSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]).optional(),
})

/**
 * Mensaje para mostrarle a una persona.
 *
 * El `ValidationPipe` del backend corre con `forbidNonWhitelisted`, así que un
 * campo de más devuelve un array como `["property empresaId should not exist"]`:
 * se junta en una sola línea, aunque siga siendo un mensaje para programadores.
 */
export function mensajeDeError(error: unknown, alternativa = "Ocurrió un error inesperado"): string {
  if (error instanceof ErrorDeContrato) {
    return "El servidor respondió algo que esta versión de la aplicación no entiende. Avisá al equipo técnico."
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "No se pudo contactar al servidor. Revisá tu conexión."
    }
    const cuerpo = cuerpoDeErrorSchema.safeParse(error.response.data)
    const mensaje = cuerpo.success ? cuerpo.data.message : undefined
    if (Array.isArray(mensaje) && mensaje.length > 0) return mensaje.join(". ")
    if (typeof mensaje === "string" && mensaje.length > 0) return mensaje
  }

  if (error instanceof Error && error.message) return error.message
  return alternativa
}

export function esStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status
}
