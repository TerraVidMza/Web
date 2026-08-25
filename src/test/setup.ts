import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll, vi } from "vitest"
import { cleanup, configure } from "@testing-library/react"
import { setupServer } from "msw/node"
import { handlers, reiniciarSesionDePrueba } from "./handlers"

/**
 * El `findBy*` por defecto corta a 1 s, y las pantallas que entran por el
 * router cargan su chunk con `React.lazy`: en la primera corrida Vitest lo
 * transforma al vuelo y eso solo ya se come el presupuesto. El síntoma era una
 * flakiness que cambiaba de test en cada corrida, no un fallo real.
 */
configure({ asyncUtilTimeout: 5000 })

export const servidor = setupServer(...handlers)

beforeAll(() => {
  // `error` y no `warn`: una request sin handler es un endpoint que el test no
  // previó, y taparla con un warning en consola es exactamente cómo un test
  // pasa sin ejercitar lo que dice ejercitar.
  servidor.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  servidor.resetHandlers()
  reiniciarSesionDePrueba()
  cleanup()
  localStorage.clear()
})

afterAll(() => servidor.close())

// Radix mide el layout con APIs que jsdom no implementa; sin estos stubs,
// cualquier test que abra un <Select> o un <Dialog> explota antes de asertar.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn<() => void>(),
      removeListener: vi.fn<() => void>(),
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
      dispatchEvent: vi.fn<() => void>(),
    }),
  })
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

Element.prototype.scrollIntoView ??= vi.fn<() => void>()
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
