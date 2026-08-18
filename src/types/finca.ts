export interface Finca {
  id: string
  nombre: string
  ubicacion: string | null
  hectareas: number
  activa: boolean
  empresaId: string
  latitud: number | null
  longitud: number | null
  createdAt: string
}

export interface Cuartel {
  id: string
  fincaId: string
  variedadId: string
  sistemaConduccionId: string
  nombre: string
  clon: string | null
  anioImplantacion: number | null
  hectareas: number | null
  estado: string | null
  activo: boolean
  variedad?: { id: string; nombre: string }
  sistemaConduccion?: { id: string; nombre: string }
}
