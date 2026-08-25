import { beforeEach, describe, expect, it } from "vitest"
import { borrarSesion, guardarSesion, leerSesion, tokenVencido } from "./sesion"
import { tokenDePrueba, usuarioSesion } from "@/test/fixtures"

const EN_EL_PASADO = Math.floor(Date.now() / 1000) - 3600

describe("sesión", () => {
  beforeEach(() => localStorage.clear())

  it("guarda y recupera token y usuario juntos", () => {
    guardarSesion({ accessToken: tokenDePrueba(), user: usuarioSesion("Propietario") })
    expect(leerSesion()?.user.rol).toBe("Propietario")
  })

  it("descarta una sesión con el token vencido", () => {
    // Sin este chequeo la sesión se ve válida hasta el primer 401, y el usuario
    // es expulsado en medio de una pantalla en vez de al arrancar.
    guardarSesion({
      accessToken: tokenDePrueba(EN_EL_PASADO),
      user: usuarioSesion("Propietario"),
    })
    expect(leerSesion()).toBeNull()
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
})
