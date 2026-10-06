import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Los de Playwright corren aparte, contra el backend real (W-029).
    exclude: ['e2e/**', 'node_modules/**'],
    css: false,
    // `threads` y no el `forks` por defecto: en Windows los workers por proceso
    // no llegan a responder el handshake y toda la corrida muere con
    // "Timeout waiting for worker to respond", sin ejecutar un solo test.
    pool: 'threads',
    // Los formularios largos con Radix tardan segundos en jsdom; el default de
    // 5 s los corta a mitad de camino en una máquina cargada.
    testTimeout: 20000,
    // `src/config/env.ts` falla al importar si esta variable no está, que es
    // justamente lo que se quiere en producción. En los tests se fija acá para
    // que la URL sea la misma que interceptan los handlers de MSW.
    env: {
      VITE_API_URL: 'http://localhost:3000/api',
    },
    // W-029: piso de 70 % de líneas. Se excluyen los componentes de shadcn
    // (código de terceros copiado), el punto de entrada y los datos de prueba.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/components/ui/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      reporter: ['text-summary', 'json-summary', 'lcov'],
      thresholds: { lines: 70, statements: 70 },
    },
  },
})
