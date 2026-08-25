import { z } from "zod"

/**
 * Un decimal de PostgreSQL. **Llega como string, siempre.**
 *
 * No es un descuido del backend: `pg` devuelve `numeric`/`decimal` como string
 * a propósito, porque un `numeric(14,2)` no entra sin pérdida en un `double`.
 * Las entidades de TypeORM lo declaran `number`, así que el backend tampoco lo
 * ve, y del otro lado `{finca.hectareas}` imprime `"25.50"` y queda bien —
 * hasta la primera suma, donde `+` concatena en vez de sumar.
 *
 * Se coerciona una vez, acá, en vez de repartir `Number(...)` por las
 * pantallas. El mismo concepto puede venir en los dos formatos según el
 * endpoint (`GET /fincas` manda `"25.50"`, `GET /registro-labor/costeo` manda
 * `6`), y `z.coerce.number()` acepta los dos.
 *
 * El rechazo explícito del string vacío no es teórico: `Number("")` es `0`, así
 * que sin esto un campo vacío se convertiría en un cero perfectamente creíble.
 */
export const decimal = z
  .union([z.number(), z.string().trim().min(1, "decimal vacío")])
  .pipe(z.coerce.number())

export const decimalNulo = decimal.nullable()

/**
 * Campo que puede llegar como `null`, como `undefined` o no llegar.
 *
 * No es paranoia: TypeORM devuelve la entidad que armó en memoria, no una
 * relectura de la base. En un `POST /fincas` sin `latitud`, la propiedad queda
 * **`undefined`** y `JSON.stringify` la omite; el mismo campo en `GET /fincas`
 * —que sí sale de la base— llega como `null`. Exigir `null` haría que un alta
 * correcta se reportara como contrato roto.
 *
 * Se normaliza a `null` para que las pantallas tengan un solo caso que mirar.
 */
export function opcional<T extends z.ZodType>(schema: T) {
  return schema.nullish().transform((v) => v ?? null)
}

/** Timestamp ISO-8601 tal como lo serializa el backend. */
export const fechaHora = z.iso.datetime({ offset: true })

/** `date` de PostgreSQL: `YYYY-MM-DD`, sin hora. */
export const fecha = z.iso.date()

export const uuid = z.uuid()

/**
 * Envelope de todos los listados paginados del backend
 * (`common/dto/pagination-query.dto.ts`).
 *
 * Son 8 endpoints. Declararlos `T[]` es lo que dejó la pantalla de Usuarios
 * mostrando "No hay usuarios cargados todavía" con doce usuarios en la base:
 * `undefined.length` no explota dentro de un `&&`, cae al estado vacío.
 */
export function paginado<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int(),
  })
}

export type Paginado<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** `pageSize` tiene techo duro de 100 en el backend: pedir 1000 no da 1000. */
export const TAMANIO_PAGINA_MAXIMO = 100
export const TAMANIO_PAGINA_POR_DEFECTO = 20

export interface ParametrosPaginacion {
  page?: number
  pageSize?: number
}
