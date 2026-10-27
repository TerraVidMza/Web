import type { RolNombre } from "@/auth/roles"

/**
 * El manual de usuario viaja **con la Web**, no en la base (W-034): se
 * versiona con el código que describe, lleva capturas y no depende de que
 * alguien haya corrido un seed. La tabla `articulos_ayuda` quedó para las
 * preguntas frecuentes que cargue el Propietario.
 *
 * Hay un manual por rol y cada usuario ve solo el suyo: lo que no puede hacer
 * no le sirve, y le haría buscar botones que no tiene.
 */
const ARCHIVO_POR_ROL: Record<RolNombre, string> = {
  Propietario: "propietario",
  Agronomo: "agronomo",
  Capataz: "capataz",
  Auditor: "auditor",
  Administrador: "administrador",
}

// Perezoso: cada usuario descarga solo el texto de su manual.
const contenidos = import.meta.glob<string>("./contenido/*.md", {
  query: "?raw",
  import: "default",
})

// Las imágenes son solo URLs; el navegador las pide al mostrarlas.
const imagenes = import.meta.glob<string>("./img/*.{png,jpg}", {
  eager: true,
  query: "?url",
  import: "default",
})

export interface SeccionManual {
  id: string
  titulo: string
  /** Markdown de la sección, sin su título. */
  cuerpo: string
  /** Títulos `###` de la sección: arman el índice. */
  subtitulos: { id: string; titulo: string }[]
}

export interface Manual {
  titulo: string
  version: string
  secciones: SeccionManual[]
}

export function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/**
 * Separa el manual en secciones por sus títulos `##`. El encabezado opcional
 * entre `---` lleva el título y la versión, que la pantalla muestra aparte.
 */
export function parsearManual(markdown: string): Manual {
  let texto = markdown.replace(/\r\n/g, "\n")
  const meta: Record<string, string> = {}
  const encabezado = /^---\n([\s\S]*?)\n---\n/.exec(texto)
  if (encabezado) {
    for (const linea of encabezado[1].split("\n")) {
      const [clave, ...valor] = linea.split(":")
      if (clave && valor.length) meta[clave.trim()] = valor.join(":").trim()
    }
    texto = texto.slice(encabezado[0].length)
  }

  const secciones: SeccionManual[] = []
  let actual: { titulo: string; lineas: string[] } | null = null
  const cerrar = () => {
    if (!actual) return
    const cuerpo = actual.lineas.join("\n").trim()
    secciones.push({
      id: slug(actual.titulo),
      titulo: actual.titulo,
      cuerpo,
      subtitulos: [...cuerpo.matchAll(/^### (.+)$/gm)].map((m) => ({
        id: slug(m[1]),
        titulo: m[1].trim(),
      })),
    })
  }
  let enCodigo = false
  for (const linea of texto.split("\n")) {
    if (linea.startsWith("```")) enCodigo = !enCodigo
    const titulo = !enCodigo && /^## (.+)$/.exec(linea)
    if (titulo) {
      cerrar()
      actual = { titulo: titulo[1].trim(), lineas: [] }
    } else if (actual) {
      actual.lineas.push(linea)
    }
  }
  cerrar()

  return { titulo: meta.titulo ?? "Manual de usuario", version: meta.version ?? "", secciones }
}

export async function cargarManual(rol: RolNombre): Promise<Manual> {
  const cargar = contenidos[`./contenido/${ARCHIVO_POR_ROL[rol]}.md`]
  if (!cargar) throw new Error(`No hay manual para el rol ${rol}`)
  return parsearManual(await cargar())
}

/** `img/r-fincas.png` → la URL que generó Vite, o `undefined` si no existe. */
export function urlDeImagen(ruta: string): string | undefined {
  const nombre = ruta.split("/").pop()
  return nombre ? imagenes[`./img/${nombre}`] : undefined
}

/** Texto plano de una sección para la búsqueda: sin sintaxis ni rutas de imagen. */
export function textoBuscable(seccion: SeccionManual): string {
  return `${seccion.titulo}\n${seccion.cuerpo}`
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>|]/g, " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export function normalizarBusqueda(texto: string): string {
  return texto
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}
