export const CatalogoTipo = {
  VARIEDAD: "variedad",
  SISTEMA_CONDUCCION: "sistema_conduccion",
  ESTADO_CUARTEL: "estado_cuartel",
  UNIDAD_MEDIDA: "unidad_medida",
} as const

export type CatalogoTipo = (typeof CatalogoTipo)[keyof typeof CatalogoTipo]

export interface CatalogoItem {
  id: string
  tipo: CatalogoTipo
  nombre: string
  activo: boolean
}
