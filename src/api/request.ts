import type { AxiosRequestConfig } from "axios"
import type { z } from "zod"
import { cliente } from "./client"
import { ErrorDeContrato } from "./errores"

/**
 * La frontera con el backend, **validada**.
 *
 * `cliente.get<Usuario[]>(...)` no comprueba nada en tiempo de ejecución: le
 * dice al compilador "confiá en mí", y el compilador confía. Por eso el build
 * pasaba limpio con la pantalla de Usuarios vacía, el dashboard en `NaN` y las
 * hectáreas siendo strings.
 *
 * Acá el tipo **sale** del schema (`z.infer`), así que no puede desincronizarse
 * de la validación, y cuando el backend cambia la falla tiene nombre y apellido
 * en la capa de API en vez de ser un `$ NaN` en una tarjeta.
 */
async function ejecutar<S extends z.ZodType>(
  schema: S,
  endpoint: string,
  config: AxiosRequestConfig
): Promise<z.infer<S>> {
  const respuesta = await cliente.request(config)
  const resultado = schema.safeParse(respuesta.data)
  if (!resultado.success) {
    const fallo = new ErrorDeContrato(endpoint, resultado.error)
    // En consola además del throw: el mensaje del toast es para el usuario, el
    // detalle del campo que no coincide es para quien está desarrollando.
    if (import.meta.env.DEV) console.error(fallo.message, respuesta.data)
    throw fallo
  }
  return resultado.data
}

type Opciones = Omit<AxiosRequestConfig, "url" | "method" | "data">

export function obtener<S extends z.ZodType>(url: string, schema: S, opciones?: Opciones) {
  return ejecutar(schema, `GET ${url}`, { ...opciones, url, method: "GET" })
}

export function crear<S extends z.ZodType>(
  url: string,
  cuerpo: unknown,
  schema: S,
  opciones?: Opciones
) {
  return ejecutar(schema, `POST ${url}`, { ...opciones, url, method: "POST", data: cuerpo })
}

export function modificar<S extends z.ZodType>(
  url: string,
  cuerpo: unknown,
  schema: S,
  opciones?: Opciones
) {
  return ejecutar(schema, `PATCH ${url}`, { ...opciones, url, method: "PATCH", data: cuerpo })
}

export function reemplazar<S extends z.ZodType>(
  url: string,
  cuerpo: unknown,
  schema: S,
  opciones?: Opciones
) {
  return ejecutar(schema, `PUT ${url}`, { ...opciones, url, method: "PUT", data: cuerpo })
}

/**
 * Para los endpoints que responden 204 sin cuerpo (`logout`,
 * `cambiar-password`, `notificaciones/:id/leida`).
 *
 * Tienen su propia función en vez de un `schema` opcional a propósito: un
 * parámetro opcional invita a omitir el schema "por ahora" en endpoints que sí
 * devuelven datos, que es justo el agujero que esta capa viene a cerrar.
 */
export async function sinRespuesta(
  metodo: "POST" | "PATCH" | "PUT" | "DELETE",
  url: string,
  cuerpo?: unknown,
  opciones?: Opciones
): Promise<void> {
  await cliente.request({ ...opciones, url, method: metodo, data: cuerpo })
}
