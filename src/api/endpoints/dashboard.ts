import { obtener } from "../request"
import { indicadoresClaveSchema } from "../schemas/dashboard"

export function indicadoresClave() {
  return obtener("/dashboard/indicadores", indicadoresClaveSchema)
}
