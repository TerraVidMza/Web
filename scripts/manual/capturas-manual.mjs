/**
 * Capturas del manual de usuario (W-034).
 *
 * Recorre la Web con cada rol y guarda cada pantalla que muestran los
 * manuales en `src/features/ayuda/manual/img/`. Necesita la API con los datos
 * de `datos-demo.mjs` y la Web en http://localhost:5173 (ver README.md).
 *
 *     node scripts/manual/capturas-manual.mjs            # todas
 *     node scripts/manual/capturas-manual.mjs capataz    # solo un rol
 */
import { chromium } from "@playwright/test"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const WEB = process.env.MANUAL_WEB_URL ?? "http://localhost:5173"
const API = process.env.MANUAL_API_URL ?? "http://localhost:3000/api"
const PASSWORD = "Terravid123!"
const DESTINO = join(dirname(fileURLToPath(import.meta.url)), "../../src/features/ayuda/manual/img")

const EMAIL = {
  propietario: "propietario@terravid.demo",
  agronomo: "agronomo@terravid.demo",
  capataz: "capataz@terravid.demo",
  auditor: "auditor@terravid.demo",
  administrador: "admin@terravid.demo",
}

const lista = (respuesta) => (Array.isArray(respuesta) ? respuesta : respuesta.data)

async function ids() {
  let respuesta
  // El login admite 10 intentos por minuto: si se corrió hace poco, se espera.
  while ((respuesta = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL.propietario, password: PASSWORD }),
  })).status === 429) {
    await new Promise((listo) => setTimeout(listo, 61_000))
  }
  const login = await respuesta.json()
  const get = (ruta) =>
    fetch(`${API}${ruta}`, { headers: { Authorization: `Bearer ${login.accessToken}` } })
      .then((r) => r.json())
      .then(lista)
  const viniedos = (await get("/fincas")).find((f) => f.nombre === "Los Viñedos")
  const malbecNorte = (await get(`/cuarteles?fincaId=${viniedos.id}`)).find(
    (c) => c.nombre === "Malbec Norte"
  )
  const humedad = (await get(`/sensores?fincaId=${viniedos.id}`)).find((s) => s.codigo === "HUM-1-792")
  const remitos = await get("/remitos")
  return {
    viniedos: viniedos.id,
    malbecNorte: malbecNorte.id,
    sensor: humedad.id,
    remitoLiquidado: remitos.find((r) => r.numeroRemito === "REM-2026-00001")?.id,
    remitoBorrador: remitos.find((r) => r.estado === "borrador")?.id,
  }
}

async function esperar(page) {
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(700)
}

async function elegirFinca(page) {
  await page.getByRole("combobox", { name: /finca/i }).first().click()
  await page.getByRole("option", { name: "Los Viñedos" }).click()
  await esperar(page)
}

async function elegir(page, etiqueta, opcion) {
  await page.getByRole("combobox", { name: etiqueta }).first().click()
  await page.getByRole("option", { name: opcion }).first().click()
  await esperar(page)
}

async function elegirCuartel(page) {
  await elegir(page, /^finca/i, "Los Viñedos")
  await elegir(page, /^cuartel/i, "Malbec Norte")
}

async function abrirAcciones(page, nombre) {
  await page.getByRole("button", { name: `Acciones de ${nombre}` }).first().click()
  await page.waitForTimeout(300)
}

/** `[nombre, ruta, pasos?]`. `ruta` es función de los ids cuando hace falta uno. */
function capturas(i) {
  const comunes = (rol) => [
    [`${rol}-dashboard`, "/"],
    [`${rol}-perfil`, "/perfil"],
    [`${rol}-ayuda`, "/ayuda"],
  ]
  const lectura = (rol) => [
    [`${rol}-fincas`, "/fincas"],
    [`${rol}-cuarteles-finca`, `/fincas/${i.viniedos}/cuarteles`],
    [`${rol}-buscar-cuarteles`, "/cuarteles"],
    [`${rol}-mapa`, "/mapa", async (p) => { await p.waitForTimeout(1500) }],
    [`${rol}-historial`, `/cuarteles/${i.malbecNorte}/historial`],
    [`${rol}-notificaciones`, "/notificaciones"],
    [`${rol}-soporte`, "/ayuda/soporte"],
  ]
  const vendimia = (rol) => [
    [`${rol}-remitos`, "/vendimia"],
    [`${rol}-cosecha`, "/vendimia/cosecha", elegirFinca],
    [`${rol}-cuadrillas`, "/vendimia/cuadrillas", elegirFinca],
    [`${rol}-pesajes`, `/cuarteles/${i.malbecNorte}/pesajes`],
    [`${rol}-remito-borrador`, `/remitos/${i.remitoBorrador}`],
    [`${rol}-generar-borrador`, "/vendimia", async (p) => {
      await p.getByRole("button", { name: /generar borrador/i }).first().click()
      await p.waitForTimeout(500)
    }],
    [`${rol}-nueva-cuadrilla`, "/vendimia/cuadrillas", async (p) => {
      await elegirFinca(p)
      await p.getByRole("button", { name: /nueva cuadrilla/i }).click()
      await p.waitForTimeout(500)
    }],
  ]
  const gestion = (rol) => [
    [`${rol}-costeo`, "/operaciones"],
    [`${rol}-insumos`, "/operaciones/insumos"],
    [`${rol}-tipos-labor`, "/operaciones/tipos-labor"],
    [`${rol}-costos-tipo-labor`, "/operaciones/tipos-labor", async (p) => {
      await p.getByRole("button", { name: "Costos de Poda" }).click()
      await p.waitForTimeout(600)
    }],
    [`${rol}-sensores`, "/telemetria", elegirFinca],
    [`${rol}-alertas`, "/telemetria/alertas"],
    [`${rol}-sensor-detalle`, `/sensores/${i.sensor}`, async (p) => { await p.waitForTimeout(1200) }],
    [`${rol}-remito-liquidado`, `/remitos/${i.remitoLiquidado}`],
    [`${rol}-comparacion`, "/inteligencia", async (p) => {
      await elegirCuartel(p)
      await elegir(p, /campaña a/i, "2025/2026")
      await elegir(p, /campaña b/i, "2026/2027")
      await p.waitForTimeout(800)
    }],
    [`${rol}-correlacion`, "/inteligencia/correlacion", async (p) => {
      await elegirCuartel(p)
      await elegir(p, /^sensor/i, /HUM-1-792/)
      await p.waitForTimeout(800)
    }],
    [`${rol}-recomendaciones`, "/inteligencia/recomendaciones", async (p) => {
      await elegirCuartel(p)
      await p.waitForTimeout(800)
    }],
    [`${rol}-campanias`, "/inteligencia/campanias"],
    [`${rol}-nuevo-cuartel`, `/fincas/${i.viniedos}/cuarteles`, async (p) => {
      await p.getByRole("button", { name: /nuevo cuartel/i }).click()
      await p.waitForTimeout(500)
    }],
    [`${rol}-nuevo-sensor`, "/telemetria", async (p) => {
      await elegirFinca(p)
      await p.getByRole("button", { name: /nuevo sensor/i }).click()
      await p.waitForTimeout(500)
    }],
  ]

  return {
    propietario: [
      ...comunes("propietario"),
      ...lectura("propietario"),
      ...vendimia("propietario"),
      ...gestion("propietario"),
      ["propietario-nueva-finca", "/fincas", async (p) => {
        await p.getByRole("button", { name: /nueva finca/i }).click()
        await p.waitForTimeout(500)
      }],
      ["propietario-acciones-finca", "/fincas", (p) => abrirAcciones(p, "Los Viñedos")],
      ["propietario-usuarios", "/usuarios"],
      ["propietario-nuevo-usuario", "/usuarios", async (p) => {
        await p.getByRole("button", { name: /nuevo usuario/i }).click()
        await p.waitForTimeout(500)
      }],
      ["propietario-acciones-usuario", "/usuarios", (p) => abrirAcciones(p, "Carlos Capataz")],
      ["propietario-configuracion", "/configuracion"],
      ["propietario-catalogos", "/configuracion/catalogos"],
      ["propietario-auditoria", "/auditoria"],
    ],
    agronomo: [
      ...comunes("agronomo"),
      ...lectura("agronomo"),
      ...vendimia("agronomo"),
      ...gestion("agronomo"),
    ],
    capataz: [...comunes("capataz"), ...lectura("capataz"), ...vendimia("capataz")],
    auditor: [
      ...comunes("auditor"),
      ...lectura("auditor"),
      ["auditor-auditoria", "/auditoria"],
      ["auditor-detalle-auditoria", "/auditoria", async (p) => {
        await p.getByRole("button", { name: /campos?/ }).first().click()
        await p.waitForTimeout(500)
      }],
    ],
    administrador: [
      ["administrador-empresas", "/empresas"],
      ["administrador-nueva-empresa", "/empresas", async (p) => {
        await p.getByRole("button", { name: /nueva empresa/i }).click()
        await p.waitForTimeout(500)
      }],
      ["administrador-perfil", "/perfil"],
      ["administrador-ayuda", "/ayuda"],
    ],
  }
}

async function entrar(page, email) {
  await page.goto(`${WEB}/login`)
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Contraseña").fill(PASSWORD)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await page.waitForURL((u) => !u.pathname.startsWith("/login"))
  await esperar(page)
}

const soloRol = process.argv[2]
const browser = await chromium.launch()
const nuevaPagina = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: "es-AR" })
  return { ctx, page: await ctx.newPage() }
}
const foto = (page, nombre) =>
  page.screenshot({ path: join(DESTINO, `${nombre}.jpg`), type: "jpeg", quality: 82 })

// Pantallas sin sesión, comunes a todos los roles.
if (!soloRol || soloRol === "comun") {
  const { ctx, page } = await nuevaPagina()
  await page.goto(`${WEB}/login`)
  await esperar(page)
  await foto(page, "comun-login")
  await page.getByLabel("Email").fill("propietario@terravid.demo")
  await page.getByLabel("Contraseña").fill("clave-equivocada")
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await page.waitForTimeout(1200)
  await foto(page, "comun-login-error")
  await page.goto(`${WEB}/olvide-mi-password`)
  await esperar(page)
  await foto(page, "comun-olvide-password")
  await ctx.close()
}

const i = await ids()
for (const [rol, pantallas] of Object.entries(capturas(i))) {
  if (soloRol && soloRol !== rol) continue
  const { ctx, page } = await nuevaPagina()
  await entrar(page, EMAIL[rol])
  for (const [nombre, ruta, pasos] of pantallas) {
    if (process.argv[3] && !nombre.includes(process.argv[3])) continue
    try {
      await page.goto(`${WEB}${ruta}`)
      await esperar(page)
      if (pasos) await pasos(page)
      await foto(page, nombre)
      console.log("ok", nombre)
    } catch (error) {
      console.error("FALLÓ", nombre, error.message.split("\n")[0])
    }
    await page.keyboard.press("Escape").catch(() => {})
  }
  await ctx.close()
}
await browser.close()
