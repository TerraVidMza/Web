import { expect, test } from "@playwright/test"
import { ADMINISTRADOR, PROPIETARIO, SUFIJO, crearUsuario, entrar, menu } from "./ayudas"

/**
 * Un camino feliz por rol contra el backend real (W-029, D-c del plan de
 * mejoras). No reemplaza a los tests de componente con MSW: verifica que la
 * Web y la API hablen el mismo contrato de punta a punta.
 */

test("Propietario: crea una finca y un cuartel en ella", async ({ page }) => {
  await entrar(page, PROPIETARIO)
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()

  const finca = `Finca E2E ${SUFIJO}`
  await menu(page).getByRole("link", { name: "Fincas" }).click()
  await page.getByRole("button", { name: "Nueva finca" }).click()
  const dialogoFinca = page.getByRole("dialog")
  await dialogoFinca.getByLabel("Nombre").fill(finca)
  await dialogoFinca.getByLabel("Hectáreas").fill("12.5")
  await dialogoFinca.getByRole("button", { name: "Crear finca" }).click()
  const fila = page.getByRole("row", { name: new RegExp(finca) })
  await expect(fila).toBeVisible()

  await fila.getByRole("link", { name: /cuarteles/i }).click()
  await page.getByRole("button", { name: "Nuevo cuartel" }).click()
  const dialogoCuartel = page.getByRole("dialog")
  await dialogoCuartel.getByLabel("Nombre").fill(`Cuartel E2E ${SUFIJO}`)
  await dialogoCuartel.getByRole("combobox", { name: "Variedad" }).click()
  await page.getByRole("option", { name: "Malbec" }).click()
  await dialogoCuartel.getByRole("combobox", { name: "Sistema de conducción" }).click()
  await page.getByRole("option", { name: "Espaldero Alto" }).click()
  await dialogoCuartel.getByLabel("Hectáreas").fill("3")
  await dialogoCuartel.getByRole("button", { name: "Crear cuartel" }).click()
  await expect(page.getByText(`Cuartel E2E ${SUFIJO}`)).toBeVisible()
})

test("Agrónomo: ve operaciones y telemetría, pero no usuarios", async ({ page }) => {
  await entrar(page, await crearUsuario("Agronomo"))
  await expect(menu(page).getByRole("link", { name: "Operaciones" })).toBeVisible()
  await expect(menu(page).getByRole("link", { name: "Usuarios" })).toHaveCount(0)

  await menu(page).getByRole("link", { name: "Operaciones" }).click()
  await expect(page.getByRole("heading", { name: "Operaciones" })).toBeVisible()
  await menu(page).getByRole("link", { name: "Telemetría IoT" }).click()
  await expect(page.getByRole("heading", { name: /telemetr/i })).toBeVisible()
})

test("Capataz: entra a vendimia y no ve el dato económico", async ({ page }) => {
  await entrar(page, await crearUsuario("Capataz"))
  // El tablero del Capataz respondía 500 por una tabla mal escrita (D-028).
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  await expect(page.getByText(/no se pudieron cargar/i)).toHaveCount(0)
  await expect(menu(page).getByRole("link", { name: "Operaciones" })).toHaveCount(0)

  await menu(page).getByRole("link", { name: "Vendimia" }).click()
  await expect(page.getByRole("heading", { name: "Vendimia" })).toBeVisible()
})

test("Auditor: consulta el log de auditoría en modo lectura", async ({ page }) => {
  await entrar(page, await crearUsuario("Auditor"))
  await menu(page).getByRole("link", { name: "Log de auditoría" }).click()
  await expect(page.getByRole("heading", { name: /log de auditoría/i })).toBeVisible()
  await menu(page).getByRole("link", { name: "Fincas" }).click()
  await expect(page.getByRole("button", { name: "Nueva finca" })).toHaveCount(0)
})

test("Administrador de plataforma: crea una empresa", async ({ page }) => {
  await entrar(page, ADMINISTRADOR)
  await expect(page.getByRole("heading", { name: "Empresas" })).toBeVisible()

  const cuit = `30-${SUFIJO}00-${SUFIJO.slice(-1)}`
  await page.getByRole("button", { name: "Nueva empresa" }).click()
  const dialogo = page.getByRole("dialog")
  await dialogo.getByLabel("Nombre de la empresa").fill(`Bodega E2E ${SUFIJO}`)
  await dialogo.getByLabel("CUIT").fill(cuit)
  await dialogo.getByLabel("Nombre del Propietario").fill("Dueña E2E")
  await dialogo.getByLabel("Email del Propietario").fill(`duena-${SUFIJO}@terravid.test`)
  await dialogo.getByRole("button", { name: "Crear empresa" }).click()
  await expect(page.getByRole("cell", { name: `Bodega E2E ${SUFIJO}`, exact: true })).toBeVisible()
})
