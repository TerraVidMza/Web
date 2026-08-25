import { useQuery } from "@tanstack/react-query"
import { listarCatalogo } from "@/api/endpoints/catalogos"
import type { CatalogoTipo } from "@/api/schemas/catalogo"
import { CACHE } from "@/lib/cache"

export function useCatalogo(tipo: CatalogoTipo) {
  return useQuery({
    queryKey: ["catalogos", tipo],
    queryFn: () => listarCatalogo(tipo),
    staleTime: CACHE.CASI_ESTATICO,
  })
}
