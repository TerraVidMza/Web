import type { FieldErrors } from "react-hook-form"

/**
 * Error devuelto por el backend, anunciado a lectores de pantalla.
 *
 * El toast de sonner es visual y efímero; esto queda en el formulario y se
 * anuncia por `aria-live` (W8).
 *
 * Recibe la forma mínima y no un `UseFormReturn<T>` completo: así vale para
 * cualquier formulario, transforme o no sus valores.
 */
export function ErrorDelServidor({
  form,
}: {
  form: { formState: { errors: FieldErrors } }
}) {
  const mensaje = form.formState.errors.root?.servidor?.message
  if (!mensaje) return null

  return (
    <p role="alert" aria-live="assertive" className="text-sm text-destructive">
      {mensaje}
    </p>
  )
}
