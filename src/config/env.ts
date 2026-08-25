import { z } from "zod"

/**
 * Configuración del entorno, validada al arrancar.
 *
 * El fallback que había antes —`import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"`—
 * convertía un `.env` mal escrito en producción en una app que apunta al
 * localhost de quien la abre: no falla el build, no falla el arranque, falla
 * cada request con un error de red que parece un problema del backend.
 *
 * Acá revienta al importar, con el nombre de la variable que falta.
 */
const envSchema = z.object({
  VITE_API_URL: z
    .string({ error: "Falta VITE_API_URL. Copiá .env.example a .env." })
    .min(1, "VITE_API_URL no puede estar vacía")
    .url("VITE_API_URL debe ser una URL absoluta, por ejemplo http://localhost:3000/api"),
})

const resultado = envSchema.safeParse(import.meta.env)

if (!resultado.success) {
  throw new Error(
    `Configuración de entorno inválida:\n${z.prettifyError(resultado.error)}`
  )
}

export const env = resultado.data

/** Sin la barra final, para poder concatenar rutas sin duplicarla. */
export const API_URL = env.VITE_API_URL.replace(/\/$/, "")
