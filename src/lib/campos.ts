import { z } from "zod"

/**
 * Campos compartidos, **con la misma regla que el backend**.
 *
 * Cada diálogo definía su schema desde cero, y la validación del cliente
 * terminaba siendo más permisiva que la del servidor: la contraseña pedía
 * `min(8)` contra los 8-72 con letra y número del backend, así que `12345678`
 * pasaba acá y lo rechazaba el servidor con un mensaje para programadores.
 *
 * Al lado de cada uno va el decorador de class-validator del que sale, para que
 * revisar que sigan alineados sea leer dos archivos y no adivinar.
 */

/** Un campo de texto de un `<input>`: vacío es "no lo cargué", no `""`. */
function textoOpcional(max: number, mensaje: string) {
  return z
    .string()
    .max(max, mensaje)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
}

/**
 * Los `<input type="number">` devuelven **string**, incluido `""` cuando están
 * vacíos. `Number("")` es `0`, así que sin rechazar el vacío explícitamente un
 * campo sin completar se manda como un cero perfectamente válido.
 */
function numeroDesdeTexto(mensaje = "Ingresá un número válido") {
  return z
    .string()
    .trim()
    .min(1, mensaje)
    .refine((v) => !Number.isNaN(Number(v)), mensaje)
    .transform(Number)
}

function numeroOpcionalDesdeTexto(mensaje = "Ingresá un número válido") {
  return z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), mensaje)
    .transform((v) => (v ? Number(v) : undefined))
}

/** `@IsString() @Length(2, 100)` */
export const nombreCorto = z
  .string()
  .trim()
  .min(2, "Ingresá al menos 2 caracteres")
  .max(100, "Máximo 100 caracteres")

/** `@IsOptional() @IsString() @Length(0, 200)` */
export const ubicacion = textoOpcional(200, "Máximo 200 caracteres")

/** `@IsOptional() @IsString() @Length(1, 50)` */
export const clon = textoOpcional(50, "Máximo 50 caracteres")

/** `@IsEmail()` */
export const email = z.string().trim().min(1, "Ingresá un email").pipe(z.email("Email inválido"))

/**
 * `@IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01)`.
 *
 * El mínimo es `0.01` y no `0` a propósito: una finca de cero hectáreas divide
 * por cero en todos los indicadores por hectárea (HU-15, HU-31).
 */
const REGLA_HECTAREAS = {
  min: 0.01,
  mensajeMin: "Las hectáreas deben ser mayores que 0",
  mensajeDecimales: "Máximo 2 decimales",
}

function validarHectareas<T extends z.ZodType<number | undefined>>(schema: T) {
  return schema
    .refine((v) => v === undefined || v >= REGLA_HECTAREAS.min, REGLA_HECTAREAS.mensajeMin)
    .refine(
      // Sobre el texto y no sobre el número: `25.555` en coma flotante no
      // permite distinguir con confianza cuántos decimales escribió la persona.
      (v) => v === undefined || /^\d+(\.\d{1,2})?$/.test(String(v)),
      REGLA_HECTAREAS.mensajeDecimales
    )
}

export const hectareas = validarHectareas(numeroDesdeTexto("Ingresá las hectáreas"))
export const hectareasOpcional = validarHectareas(numeroOpcionalDesdeTexto())

/** `@EsAnioImplantacionValido()`: entre 1900 y el año en curso. */
export const ANIO_IMPLANTACION_MINIMO = 1900

export const anioImplantacion = numeroOpcionalDesdeTexto("Ingresá un año válido")
  .refine(
    (v) => v === undefined || (Number.isInteger(v) && v >= ANIO_IMPLANTACION_MINIMO),
    `El año debe ser posterior a ${ANIO_IMPLANTACION_MINIMO}`
  )
  .refine(
    // El tope se calcula al validar, no al cargar el módulo: una pestaña
    // abierta desde diciembre seguiría rechazando el año nuevo.
    (v) => v === undefined || v <= new Date().getFullYear(),
    "El año no puede ser futuro"
  )

/** `@IsNumber() @Min(-90) @Max(90)` */
export const latitud = numeroOpcionalDesdeTexto("Latitud inválida").refine(
  (v) => v === undefined || (v >= -90 && v <= 90),
  "La latitud va de -90 a 90"
)

/** `@IsNumber() @Min(-180) @Max(180)` */
export const longitud = numeroOpcionalDesdeTexto("Longitud inválida").refine(
  (v) => v === undefined || (v >= -180 && v <= 180),
  "La longitud va de -180 a 180"
)

export const uuidRequerido = (mensaje: string) => z.string().min(1, mensaje).pipe(z.uuid(mensaje))
