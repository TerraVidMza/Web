import { useCallback, type BaseSyntheticEvent } from "react"
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { z } from "zod"
import { mensajeDeError } from "@/api/errores"

/**
 * El `TContext` de react-hook-form. Su valor por defecto es `any`, y cambiarlo
 * por `unknown` vuelve el `Control` que devuelve `useForm` incompatible con el
 * que espera `<FormField>` de shadcn — que sí usa el default.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Contexto = any

/**
 * `TEntrada` es lo que el usuario escribe (todo strings, porque un `<input>` no
 * devuelve números) y `TSalida` lo que sale del schema ya transformado. Tenerlos
 * separados es lo que permite que `hectareas` sea `string` en el formulario y
 * `number` en el body de la request sin ningún cast.
 */
interface Opciones<TEntrada extends FieldValues, TSalida> {
  schema: z.ZodType<TSalida, TEntrada>
  defaultValues: DefaultValues<TEntrada>
  /** Qué hacer con los valores ya validados y transformados. */
  onSubmit: (valores: TSalida) => Promise<void>
  /** Toast de éxito. `null` para no mostrar ninguno. */
  exito?: string | null
  /** Texto del toast de error cuando el backend no manda uno. */
  error?: string
  /** Se ejecuta después de un envío exitoso; el reset ya está hecho. */
  onExito?: () => void
  form?: Omit<UseFormProps<TEntrada, Contexto, TSalida>, "resolver" | "defaultValues">
}

type Resultado<TEntrada extends FieldValues, TSalida> = UseFormReturn<
  TEntrada,
  Contexto,
  TSalida
> & {
  enviar: (evento?: BaseSyntheticEvent) => Promise<void>
  enviando: boolean
}

/**
 * react-hook-form + zod + el toast de error, en un solo lugar (F1-5).
 *
 * Los cinco diálogos repetían la misma secuencia —resolver, try/catch,
 * `toast.error(getApiErrorMessage(...))`, `form.reset()`, cerrar— con
 * variaciones que no eran decisiones sino copias con deriva.
 *
 * Agrega dos cosas que ninguno hacía: **el foco va al primer campo con error**
 * al enviar (sin eso, en un formulario largo el error queda fuera de la pantalla
 * y parece que el botón no hizo nada) y el error del servidor queda en el
 * formulario, anunciado por `aria-live`, además del toast que se va solo.
 */
export function useFormularioApi<TEntrada extends FieldValues, TSalida>({
  schema,
  defaultValues,
  onSubmit,
  exito = null,
  error = "No se pudo completar la operación",
  onExito,
  form: opcionesForm,
}: Opciones<TEntrada, TSalida>): Resultado<TEntrada, TSalida> {
  const form = useForm<TEntrada, Contexto, TSalida>({
    ...opcionesForm,
    resolver: zodResolver(schema),
    defaultValues,
    shouldFocusError: true,
  })

  const enviar = useCallback(
    (evento?: BaseSyntheticEvent) =>
      form.handleSubmit(
        async (valores) => {
          try {
            await onSubmit(valores)
            if (exito) toast.success(exito)
            form.reset()
            onExito?.()
          } catch (e) {
            const mensaje = mensajeDeError(e, error)
            toast.error(mensaje)
            form.setError("root.servidor", { message: mensaje })
          }
        },
        () => {
          // `shouldFocusError` no alcanza cuando el primer campo inválido es un
          // `<Select>` de Radix: no es un input registrado, así que RHF no sabe
          // a dónde mover el foco. De ahí el `data-campo`.
          const primero = Object.keys(form.formState.errors).find((c) => c !== "root")
          if (primero) {
            document
              .querySelector<HTMLElement>(`[name="${primero}"], [data-campo="${primero}"]`)
              ?.focus()
          }
        }
      )(evento),
    [form, onSubmit, exito, error, onExito]
  )

  return Object.assign(form, { enviar, enviando: form.formState.isSubmitting })
}
