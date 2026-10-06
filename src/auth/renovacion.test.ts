import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"
import { HttpResponse, http } from "msw"
import { servidor } from "@/test/setup"
import { tokenDePrueba, usuarioSesion } from "@/test/fixtures"
import { cliente, registrarManejadorDeSesionExpirada } from "@/api/client"
import { guardarSesion, leerSesion } from "./sesion"
import { renovarSesion } from "./renovacion"

const API = "http://localhost:3000/api"
const EN_EL_PASADO = Math.floor(Date.now() / 1000) - 60
const VENCE_PRONTO = Math.floor(Date.now() / 1000) + 10

function sesionCon(accessToken: string, refreshToken = "refresh-1") {
  guardarSesion({
    accessToken,
    refreshToken,
    refreshExpiresAt: "2099-01-01T00:00:00.000Z",
    user: usuarioSesion("Propietario"),
  })
}

/** Cuenta las llamadas a /auth/refresh sin cambiar la respuesta del handler base. */
function contarRenovaciones() {
  const contador = { n: 0 }
  servidor.events.on("request:start", ({ request }) => {
    if (request.url.endsWith("/auth/refresh")) contador.n++
  })
  return contador
}

describe("renovación de sesión (W-024)", () => {
  let expirada: Mock<() => void>
  let dejarDeEscuchar: () => void

  beforeEach(() => {
    expirada = vi.fn<() => void>()
    dejarDeEscuchar = registrarManejadorDeSesionExpirada(expirada)
  })

  afterEach(() => {
    dejarDeEscuchar()
    servidor.events.removeAllListeners()
  })

  it("rota el refresh token y guarda la sesión nueva", async () => {
    sesionCon(tokenDePrueba(), "refresh-1")

    const nueva = await renovarSesion()

    expect(nueva?.refreshToken).toBe("refresh-1-r")
    expect(leerSesion()?.refreshToken).toBe("refresh-1-r")
  })

  it("ante un 401 renueva y reintenta el request una sola vez", async () => {
    sesionCon(tokenDePrueba(), "refresh-1")
    let intentos = 0
    servidor.use(
      http.get(`${API}/roles`, ({ request }) => {
        intentos++
        // El primer token se rechaza; el renovado funciona.
        return intentos === 1
          ? HttpResponse.json({ message: "vencido" }, { status: 401 })
          : HttpResponse.json([{ auth: request.headers.get("Authorization") }])
      })
    )

    const respuesta = await cliente.get("/roles")

    expect(intentos).toBe(2)
    expect(respuesta.data).toHaveLength(1)
    expect(leerSesion()?.refreshToken).toBe("refresh-1-r")
    expect(expirada).not.toHaveBeenCalled()
  })

  it("renueva antes de mandar el request si el access está por vencer", async () => {
    sesionCon(tokenDePrueba(VENCE_PRONTO), "refresh-1")
    const renovaciones = contarRenovaciones()

    await cliente.get("/roles")

    expect(renovaciones.n).toBe(1)
    expect(leerSesion()?.refreshToken).toBe("refresh-1-r")
  })

  it("varias respuestas 401 simultáneas comparten una sola renovación", async () => {
    sesionCon(tokenDePrueba(EN_EL_PASADO), "refresh-1")
    const renovaciones = contarRenovaciones()

    await Promise.all([cliente.get("/roles"), cliente.get("/roles"), cliente.get("/roles")])

    expect(renovaciones.n).toBe(1)
  })

  it("si el refresh token ya no sirve, termina la sesión", async () => {
    sesionCon(tokenDePrueba(), "revocado")
    servidor.use(
      http.get(`${API}/roles`, () => HttpResponse.json({ message: "x" }, { status: 401 }))
    )

    await expect(cliente.get("/roles")).rejects.toThrow(/401/)

    expect(expirada).toHaveBeenCalledTimes(1)
  })

  it("un 401 del token recién renovado no entra en bucle", async () => {
    sesionCon(tokenDePrueba(), "refresh-1")
    let intentos = 0
    servidor.use(
      http.get(`${API}/roles`, () => {
        intentos++
        return HttpResponse.json({ message: "x" }, { status: 401 })
      })
    )

    await expect(cliente.get("/roles")).rejects.toThrow(/401/)

    expect(intentos).toBe(2)
    expect(expirada).toHaveBeenCalledTimes(1)
  })

  it("si la renovación falla por red no expulsa al usuario", async () => {
    sesionCon(tokenDePrueba(), "refresh-1")
    servidor.use(
      http.get(`${API}/roles`, () => HttpResponse.json({ message: "x" }, { status: 401 })),
      http.post(`${API}/auth/refresh`, () => HttpResponse.error())
    )

    await expect(cliente.get("/roles")).rejects.toThrow(/401/)

    expect(expirada).not.toHaveBeenCalled()
    expect(leerSesion()?.refreshToken).toBe("refresh-1")
  })

  it("si otra pestaña renovó primero, usa el token que dejó guardado", async () => {
    sesionCon(tokenDePrueba(), "refresh-1")
    servidor.use(
      http.post(`${API}/auth/refresh`, () => {
        // Mientras tanto, la otra pestaña guardó su renovación.
        sesionCon(tokenDePrueba(), "refresh-de-otra-pestania")
        return HttpResponse.json({ message: "ya no es válida" }, { status: 401 })
      })
    )

    const sesion = await renovarSesion()

    expect(sesion?.refreshToken).toBe("refresh-de-otra-pestania")
  })

  it("el 401 del login no intenta renovar ni expulsa", async () => {
    const renovaciones = contarRenovaciones()

    await expect(
      cliente.post("/auth/login", { email: "x@y.com", password: "mal" })
    ).rejects.toThrow(/401/)

    expect(renovaciones.n).toBe(0)
    expect(expirada).not.toHaveBeenCalled()
  })
})
