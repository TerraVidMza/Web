import { crear, modificar, obtener } from "../request";
import { fincaDetalleSchema, fincasSchema } from "../schemas/finca";
import type { PoligonoGeoJson } from "../schemas/geo";

export interface CrearFincaInput {
  nombre: string;
  ubicacion?: string;
  /** Obligatoria solo si no se manda `poligono`: con polígono se calcula de él. */
  hectareas?: number;
  latitud?: number;
  longitud?: number;
  /**
   * Contorno de la finca (D-037). En una edición, `null` lo quita y devuelve la
   * finca a la carga manual. Con polígono el backend deriva hectáreas y punto, y
   * **rechaza (400) un cambio manual de esos tres campos**: no hay que mandarlos.
   */
  poligono?: PoligonoGeoJson | null;
}

/**
 * **Sin `empresaId`.** El backend la saca del token y borró el campo del DTO
 * porque recibirlo permitía crear fincas en otra empresa. Y el `ValidationPipe`
 * corre con `forbidNonWhitelisted: true`, así que un campo de más no se ignora:
 * rechaza la request entera con `property empresaId should not exist`.
 */
export type ActualizarFincaInput = Partial<CrearFincaInput>;

/** `inactivas` lista las dadas de baja, para poder reactivarlas. */
export function listarFincas(search?: string, inactivas = false) {
  return obtener("/fincas", fincasSchema, {
    params: {
      ...(search ? { search } : {}),
      ...(inactivas ? { inactivas: true } : {}),
    },
  });
}

export function obtenerFinca(id: string) {
  return obtener(`/fincas/${id}`, fincaDetalleSchema);
}

export function crearFinca(input: CrearFincaInput) {
  return crear("/fincas", input, fincaDetalleSchema);
}

export function actualizarFinca(id: string, input: ActualizarFincaInput) {
  return modificar(`/fincas/${id}`, input, fincaDetalleSchema);
}

export function activarFinca(id: string) {
  return modificar(`/fincas/${id}/activar`, undefined, fincaDetalleSchema);
}

export function desactivarFinca(id: string) {
  return modificar(`/fincas/${id}/desactivar`, undefined, fincaDetalleSchema);
}
