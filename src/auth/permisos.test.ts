import { describe, expect, it } from "vitest"
import { PERMISOS, puede } from "./permisos"
import { RolNombre } from "./roles"

/**
 * Esta tabla es una copia de los `@Roles` del backend, y su único trabajo es
 * estar al día. Los casos de abajo son los que ya habían divergido.
 */
describe("tabla de permisos", () => {
  it("excluye al Auditor de fincas y cuarteles (HU-07 acota su alcance)", () => {
    expect(puede(RolNombre.Auditor, "fincas")).toBe(false)
    expect(puede(RolNombre.Propietario, "fincas")).toBe(true)
    expect(puede(RolNombre.Agronomo, "fincas")).toBe(true)
    expect(puede(RolNombre.Capataz, "fincas")).toBe(true)
  })

  it("deja el log de auditoría al Propietario y al Auditor", () => {
    expect(puede(RolNombre.Auditor, "logAuditoria")).toBe(true)
    expect(puede(RolNombre.Propietario, "logAuditoria")).toBe(true)
    expect(puede(RolNombre.Agronomo, "logAuditoria")).toBe(false)
    expect(puede(RolNombre.Capataz, "logAuditoria")).toBe(false)
  })

  it("reserva usuarios, roles y configuración al Propietario", () => {
    for (const permiso of ["usuarios", "roles", "configuracion"] as const) {
      expect(puede(RolNombre.Propietario, permiso)).toBe(true)
      expect(puede(RolNombre.Agronomo, permiso)).toBe(false)
      expect(puede(RolNombre.Capataz, permiso)).toBe(false)
      expect(puede(RolNombre.Auditor, permiso)).toBe(false)
    }
  })

  it("le da a todos el dashboard, las notificaciones, el perfil y la ayuda", () => {
    for (const permiso of ["dashboard", "notificaciones", "perfil", "ayuda"] as const) {
      for (const rol of Object.values(RolNombre)) {
        expect(puede(rol, permiso)).toBe(true)
      }
    }
  })

  it("incluye al Auditor en el historial de labores, su segundo recurso (HU-17)", () => {
    expect(puede(RolNombre.Auditor, "historialLabores")).toBe(true)
    expect(puede(RolNombre.Auditor, "operaciones")).toBe(false)
  })

  it("sin rol no se puede nada", () => {
    for (const permiso of Object.keys(PERMISOS) as (keyof typeof PERMISOS)[]) {
      expect(puede(undefined, permiso)).toBe(false)
    }
  })
})
