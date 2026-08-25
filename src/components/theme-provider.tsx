import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

/**
 * Monta el proveedor de tema (W10).
 *
 * `index.css` ya define la paleta `.dark` completa y `next-themes` ya era
 * dependencia, pero **no había ningún provider montado**: nada agregaba la
 * clase `dark` al `<html>`, así que todo ese trabajo era inalcanzable y
 * `sonner.tsx` llamaba a `useTheme()` sin provider y recibía el default.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="terravid.tema"
    >
      {children}
    </NextThemesProvider>
  )
}

export function BotonTema() {
  const { resolvedTheme, setTheme } = useTheme()
  const esOscuro = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(esOscuro ? "light" : "dark")}
      aria-label={esOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={esOscuro ? "Tema claro" : "Tema oscuro"}
    >
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  )
}
