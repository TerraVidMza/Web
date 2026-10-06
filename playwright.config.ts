import { defineConfig, devices } from "@playwright/test"

/**
 * Pruebas de punta a punta contra el backend real (W-029).
 *
 * Necesita la API corriendo en http://localhost:3000 con el seed cargado y
 * `CORS_ORIGIN` que incluya http://localhost:5173 (el valor de `.env.example`
 * del backend). La Web se compila y se sirve con `vite preview` en ese puerto.
 *
 *     # en Backend/
 *     docker compose up -d db && npm run migration:run && npm run seed && npm run start:dev
 *     # en Web/
 *     npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    locale: "es-AR",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx vite preview --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { VITE_API_URL: process.env.E2E_API_URL ?? "http://localhost:3000/api" },
  },
})
