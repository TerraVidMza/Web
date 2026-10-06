import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  alCambiarSesion,
  borrarSesion,
  convieneRenovar,
  guardarSesion,
  leerSesion,
  tokenVencido,
  type Sesion,
} from "./sesion"
import { tokenDePrueba, usuarioSesion } from "@/test/fixtures"

const EN_EL_PASADO = Math.floor(Date.now() / 1000) - 3600
const EN_30_SEGUNDOS = Math.floor(Date.now() / 1000) + 30
const FUTURO_ISO = "2099-01-01T00:00:00.000Z"
const PASADO_ISO = "2000-01-01T00:00:00.000Z"

describe("sesión", () => {
  beforeEach(() => localStorage.clear())

  it("guarda y recupera tokens y usuario juntos", () => {
    guardarSesion({
      accessToken: tokenDePrueba(),
      refreshToken: "refresh-1",
      refreshExpiresAt: FUTURO_ISO,
      user: usuarioSesion("Propietario"),
    })
    expect(leerSesion()).toMatchObject({ refreshToken: "refresh-1", user: { rol: "Propietario" } })
  })

  it("conserva una sesión con el access vencido si el refresh sigue vigente", () => {
    // El cliente HTTP la renueva antes del primer request (W-024).
    guardarSesion({
      accessToken: tokenDePrueba(EN_EL_PASADO),
      refreshToken: "refresh-1",
      refreshExpiresAt: FUTURO_ISO,
      user: usuarioSesion("Propietario"),
    })
    expect(leerSesion()).not.toBeNull()
  })

  it("descarta una sesión con el access vencido y sin refresh token", () => {
    // Sesiones guardadas antes del refresh token: sin este chequeo se ven
    // válidas hasta el primer 401.
    guardarSesion({
      accessToken: tokenDePrueba(EN_EL_PASADO),
      user: usuarioSesion("Propietario"),
    })
    expect(leerSesion()).toBeNull()
  })

  it("descarta una sesión con el access y el refresh vencidos", () => {
    guardarSesion({
      accessToken: tokenDePrueba(EN_EL_PASADO),
      refreshToken: "refresh-1",
      refreshExpiresAt: PASADO_ISO,
      user: usuarioSesion("Propietario"),
    })
    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem("terravid.sesion")).toBeNull()
  })

  it("limpia el localStorage cuando lo que hay está corrupto", () => {
    localStorage.setItem("terravid.sesion", "{ esto no es json")
    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem("terravid.sesion")).toBeNull()
  })

  it("descarta una sesión con un rol que el sistema no conoce", () => {
    localStorage.setItem(
      "terravid.sesion",
      JSON.stringify({
        accessToken: tokenDePrueba(),
        user: { ...usuarioSesion("Propietario"), rol: "Contador" },
      })
    )
    expect(leerSesion()).toBeNull()
  })

  it("no da por vencido un token sin exp: eso lo decide el backend", () => {
    const sinExp = ["eyJhbGciOiJIUzI1NiJ9", btoa(JSON.stringify({ sub: "x" })), "firma"].join(".")
    expect(tokenVencido(sinExp)).toBe(false)
  })

  it("borrarSesion deja el almacenamiento limpio", () => {
    guardarSesion({ accessToken: tokenDePrueba(), user: usuarioSesion("Propietario") })
    borrarSesion()
    expect(leerSesion()).toBeNull()
  })

  describe("convieneRenovar", () => {
    const base = { refreshToken: "refresh-1", user: usuarioSesion("Propietario") }

    it("sí, si el access vence dentro del margen y el refresh sirve", () => {
      expect(convieneRenovar({ ...base, accessToken: tokenDePrueba(EN_30_SEGUNDOS) })).toBe(true)
    })

    it("no, si al access le queda tiempo", () => {
      expect(convieneRenovar({ ...base, accessToken: tokenDePrueba() })).toBe(false)
    })

    it("no, si no hay refresh token o venció", () => {
      const accessToken = tokenDePrueba(EN_30_SEGUNDOS)
      expect(convieneRenovar({ accessToken, user: base.user })).toBe(false)
      expect(convieneRenovar({ ...base, accessToken, refreshExpiresAt: PASADO_ISO })).toBe(false)
    })
  })

  it("avisa los cambios de sesión dentro de la misma pestaña", () => {
    const oyente = vi.fn<(sesion: Sesion | null) => void>()
    const dejar = alCambiarSesion(oyente)

    guardarSesion({ accessToken: tokenDePrueba(), user: usuarioSesion("Agronomo") })
    borrarSesion()
    dejar()
    borrarSesion()

    expect(oyente).toHaveBeenCalledTimes(2)
    expect(oyente.mock.calls[0][0]?.user.rol).toBe("Agronomo")
    expect(oyente.mock.calls[1][0]).toBeNull()
  })
})
