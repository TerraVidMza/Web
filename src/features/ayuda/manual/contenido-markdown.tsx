import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { slug, urlDeImagen } from "./manuales"

function textoDe(hijos: React.ReactNode): string {
  if (typeof hijos === "string" || typeof hijos === "number") return String(hijos)
  if (Array.isArray(hijos)) return hijos.map(textoDe).join("")
  return ""
}

/**
 * Cómo se ve cada elemento del manual. No hay plugin de tipografía en el
 * proyecto, y para un solo lugar no vale sumarlo: alcanza con mapear los
 * elementos que usan los manuales a las mismas clases del resto de la Web.
 */
const COMPONENTES: Components = {
  h3: ({ children }) => (
    <h3 id={slug(textoDe(children))} className="mt-6 scroll-mt-20 text-base font-semibold">
      {children}
    </h3>
  ),
  h4: ({ children }) => <h4 className="mt-4 text-sm font-semibold">{children}</h4>,
  p: ({ children }) => <p className="mt-2 text-sm leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mt-3 rounded-md border-l-4 border-primary bg-muted/50 px-4 py-2 [&>p]:mt-1">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mt-3 overflow-x-auto rounded-md border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b bg-muted/50 px-3 py-2 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  a: ({ href, children }) => (
    <a href={href} className="font-medium text-primary underline underline-offset-2">
      {children}
    </a>
  ),
  img: ({ src, alt }) => {
    const url = typeof src === "string" ? urlDeImagen(src) : undefined
    if (!url) return null
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block max-w-3xl"
        title="Ver en tamaño completo"
      >
        <img
          src={url}
          alt={alt ?? ""}
          loading="lazy"
          // Tamaño natural con tope en el ancho disponible: las capturas del
          // teléfono no se estiran y las de escritorio se achican.
          className="h-auto max-w-full rounded-md border shadow-sm"
        />
      </a>
    )
  },
  hr: () => <hr className="my-6" />,
}

export function ContenidoMarkdown({ markdown }: { markdown: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTES}>
      {markdown}
    </Markdown>
  )
}
