import { expect, request, type Page } from "@playwright/test"

export const API = process.env.E2E_API_URL ?? "http://localhost:3000/api"
export const PROPIETARIO = { email: "propietario@terravid.demo", password: "Terravid123!" }
export const ADMINISTRADOR = { email: "admin@terravid.demo", password: "Terravid123!" }
export const SUFIJO = Date.now().toString().slice(-6)

/** Entra por la pantalla de login, como lo haría una persona. */
export async function entrar(page: Page, cred: { email: string; password: string }) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(cred.email)
  await page.getByLabel("Contraseña").fill(cred.password)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

/**
 * Crea por la API un usuario del rol pedido con contraseña conocida, usando la
 * sesión del Propietario del seed. Así cada corrida tiene sus propios usuarios
 * y no depende de que el seed los traiga.
 */
export async function crearUsuario(rol: "Agronomo" | "Capataz" | "Auditor") {
  const ctx = await request.newContext()
  const login = await ctx.post(`${API}/auth/login`, { data: PROPIETARIO })
  const { accessToken } = (await login.json()) as { accessToken: string }
  const auth = { Authorization: `Bearer ${accessToken}` }
  const roles = (await (await ctx.get(`${API}/roles`, { headers: auth })).json()) as Array<{
    id: string
    nombreRol: string
  }>
  const cred = { email: `e2e-${rol.toLowerCase()}-${SUFIJO}@terravid.test`, password: "E2eClave123" }
  const alta = await ctx.post(`${API}/usuarios`, {
    headers: auth,
    data: {
      nombre: `E2E ${rol}`,
      email: cred.email,
      password: cred.password,
      rolId: roles.find((r) => r.nombreRol === rol)!.id,
    },
  })
  expect(alta.status()).toBe(201)
  await ctx.dispose()
  return cred
}

export function menu(page: Page) {
  return page.getByRole("navigation", { name: /secciones/i }).first()
}
