import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { CatalogoItem, CatalogoTipo } from "@/types/catalogo"

export function useCatalogo(tipo: CatalogoTipo) {
  return useQuery({
    queryKey: ["catalogos", tipo],
    queryFn: async () => {
      const { data } = await api.get<CatalogoItem[]>("/catalogos", { params: { tipo } })
      return data
    },
  })
}
