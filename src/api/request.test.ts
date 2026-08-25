import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { z } from "zod"
import { obtener } from "./request"
import { ErrorDeContrato, mensajeDeError } from "./errores"
import { servidor } from "@/test/setup"

const API = "http://localhost:3000/api"

/**
 * W1, el problema de fondo: `api.get<Usuario[]>(...)` era una **afirmación**.
 *
 * No comprobaba nada en tiempo de ejecución, así que el build pasaba limpio con
 * la pantalla de Usuarios vacía y el dashboard en NaN. Estos tests verifican
 * que ahora la frontera valida y falla con nombre y apellido.
 */
describe("capa de contrato", () => {
  const schema = z.object({ id: z.uuid(), hectareas: z.coerce.number() })

  it("devuelve los datos ya validados y transformados", async () => {
    servidor.use(
      http.get(`${API}/prueba`, () =>
        HttpResponse.json({ id: "11111111-1111-4111-8111-111111111111", hectareas: "25.50" })
      )
    )

    const resultado = await obtener("/prueba", schema)
    expect(resultado.hectareas).toBe(25.5)
  })

  it("lanza ErrorDeContrato nombrando el endpoint y el campo", async () => {
    servidor.use(
      http.get(`${API}/prueba`, () =>
        HttpResponse.json({ id: "no-es-un-uuid", hectareas: "25.50" })
      )
    )

    await expect(obtener("/prueba", schema)).rejects.toBeInstanceOf(ErrorDeContrato)
    await expect(obtener("/prueba", schema)).rejects.toThrow(/GET \/prueba/)
    await expect(obtener("/prueba", schema)).rejects.toThrow(/id/)
  })

  it("traduce el error de contrato a un mensaje para el usuario", () => {
    const error = new ErrorDeContrato("GET /fincas", new z.ZodError([]))
    expect(mensajeDeError(error)).toMatch(/esta versión de la aplicación no entiende/i)
  })

  it("junta el array de mensajes del ValidationPipe en una sola línea", async () => {
    servidor.use(
      http.post(`${API}/fincas`, () =>
        HttpResponse.json(
          { statusCode: 400, message: ["property empresaId should not exist", "hectareas must be a number"] },
          { status: 400 }
        )
      )
    )

    const { crear } = await import("./request")
    // El error se captura y se asierta fuera del `catch`: dentro, si la
    // promesa resolviera, el `expect` no correría y el test pasaría en falso.
    const error = await crear("/fincas", { empresaId: "x" }, z.unknown()).catch((e: unknown) => e)
    expect(mensajeDeError(error)).toBe(
      "property empresaId should not exist. hectareas must be a number"
    )
  })

  it("distingue un problema de red de un error del servidor", async () => {
    servidor.use(http.get(`${API}/prueba`, () => HttpResponse.error()))
    const error = await obtener("/prueba", schema).catch((e: unknown) => e)
    expect(mensajeDeError(error)).toMatch(/No se pudo contactar al servidor/i)
  })
})
