import * as api from "@/api/endpoints/operaciones"
import type {
  ActualizarCatalogoCosteableInput,
  CrearCatalogoCosteableInput,
  NuevoCostoInput,
} from "@/api/endpoints/operaciones"
import type { CostoVigencia, Insumo } from "@/api/schemas/operaciones"

/**
 * `insumos` y `tipo_labor` son **la misma entidad con otro nombre**: mismas
 * columnas, mismo versionado de costos append-only, mismos roles, mismos DTO.
 *
 * De ahí esta configuración en vez de dos pantallas gemelas: escribir el ABM
 * dos veces garantiza que en unos meses uno tenga una validación, un estado
 * vacío o un mensaje de error que el otro no.
 */
export interface CatalogoCosteableConfig {
  /** Prefijo de las claves de React Query y del path. */
  clave: "insumos" | "tipos-labor"
  singular: string
  plural: string
  /** Para concordar los mensajes: "el insumo" / "la labor". */
  articulo: "el" | "la"
  /** Qué representa la unidad, para el texto de ayuda del formulario. */
  ayudaUnidad: string
  listar: (incluirInactivos: boolean) => Promise<Insumo[]>
  crear: (input: CrearCatalogoCosteableInput) => Promise<Insumo>
  actualizar: (id: string, input: ActualizarCatalogoCosteableInput) => Promise<Insumo>
  desactivar: (id: string) => Promise<Insumo>
  costos: (id: string) => Promise<CostoVigencia[]>
  fijarCosto: (id: string, input: NuevoCostoInput) => Promise<CostoVigencia>
}

export const INSUMOS: CatalogoCosteableConfig = {
  clave: "insumos",
  singular: "insumo",
  plural: "Insumos",
  articulo: "el",
  ayudaUnidad: "Cómo se mide el consumo: kilos de fertilizante, litros de fungicida…",
  listar: api.listarInsumos,
  crear: api.crearInsumo,
  actualizar: api.actualizarInsumo,
  desactivar: api.desactivarInsumo,
  costos: api.costosDeInsumo,
  fijarCosto: api.fijarCostoDeInsumo,
}

export const TIPOS_LABOR: CatalogoCosteableConfig = {
  clave: "tipos-labor",
  singular: "tipo de labor",
  plural: "Tipos de labor",
  articulo: "el",
  ayudaUnidad: "Cómo se mide el trabajo: jornales de poda, horas de máquina, hectáreas…",
  listar: api.listarTiposLabor,
  crear: api.crearTipoLabor,
  actualizar: api.actualizarTipoLabor,
  desactivar: api.desactivarTipoLabor,
  costos: api.costosDeTipoLabor,
  fijarCosto: api.fijarCostoDeTipoLabor,
}
