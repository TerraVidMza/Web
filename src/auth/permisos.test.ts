import { describe, expect, it } from "vitest"
import { permisosSchema, puede } from "./permisos"
import { permisosDelRol } from "@/test/fixtures"

describe("permisos de la sesión (D-024 del backend)", () => {
  it("puede() consulta la lista que mandó el backend", () => {
    const user = { permisos: permisosDelRol("Auditor") }
    expect(puede(user, "logAuditoria")).toBe(true)
    expect(puede(user, "fincas")).toBe(true)
    expect(puede(user, "usuarios")).toBe(false)
  })

  it("sin usuario no hay permisos", () => {
    expect(puede(null, "dashboard")).toBe(false)
    expect(puede(undefined, "dashboard")).toBe(false)
  })

  it("descarta los permisos que esta versión no conoce en vez de romper la sesión", () => {
    expect(permisosSchema.parse(["fincas", "permisoDelFuturo"])).toEqual(["fincas"])
  })

  it("el Auditor ve fincas: la tabla vieja de la Web se lo negaba (D-021)", () => {
    expect(puede({ permisos: permisosDelRol("Auditor") }, "fincas")).toBe(true)
  })
})
