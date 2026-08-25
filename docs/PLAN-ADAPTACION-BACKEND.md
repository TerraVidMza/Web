# Plan de adaptación al backend

Qué hay que cambiar en este repositorio para que funcione contra el backend tal como quedó después del cierre del [plan de mejoras del Backend](https://github.com/TerraVidMza/Backend/blob/develop/docs/specs/PLAN-MEJORAS.md) (36/36 HU, 10 problemas sistémicos resueltos, 8 decisiones de producto tomadas).

**Método:** no se auditó leyendo el código del backend. Se levantó la API contra PostgreSQL real, se hizo login con el usuario del seed y se llamó cada endpoint que este repo consume, comparando la respuesta real contra el tipo que el frontend declara. Cada afirmación de la sección 1 tiene abajo la respuesta que devolvió la API.

**Veredicto: de las 5 pantallas conectadas, 3 están rotas y 2 andan por casualidad.** El detalle está en la sección 1.

> **Lo importante no es la lista de arreglos, es por qué la lista existe.** `npm run build` pasa limpio y `npm run lint` no marca ningún error. El compilador no puede ver ninguno de estos problemas porque el cliente HTTP los declara con `api.get<Usuario[]>(...)`, que es una **afirmación sin verificar**: `Usuario[]` es lo que el frontend *espera*, no lo que el servidor *manda*. Mientras la capa de API siga afirmando en vez de validar, el próximo cambio de backend va a romper la aplicación de la misma forma silenciosa. Eso se ataca en la [sección 3](#3-la-causa-raíz-una-capa-de-contrato-de-verdad) y es la razón por la que ese trabajo va **primero**, antes de los arreglos puntuales.

---

## Estado de ejecución

> Actualizado al cerrar los pasos 1 a 8. Los siete rompimientos de la §1 están corregidos y verificados con tests que fallan contra el código anterior.

| # | Trabajo | Estado | Dónde quedó |
|---|---|---|---|
| **1** | Capa de contrato con zod | ✅ | `src/api/` — `schemas/` (tipos derivados con `z.infer`), `endpoints/`, `request.ts` |
| **2** | B2 (`empresaId`) y B1 (envelope) | ✅ | `endpoints/fincas.ts`, `endpoints/usuarios.ts`, `schemas/comunes.ts#paginado` |
| **3** | B3 (dashboard por rol) y B6 (permisos) | ✅ | `schemas/dashboard.ts` (unión discriminada), `src/auth/permisos.ts` |
| **4** | B5 (contraseñas) | ✅ | `features/auth/` — cambio obligado, recuperación, reset, alta sin password |
| **5** | B7 (401 sin recargar, reintento de logout) | ✅ | `api/client.ts#registrarManejadorDeSesionExpirada`, `context/auth-context.tsx` |
| **6** | Primitivas de UI | ✅ | `components/datos/` y `components/formulario/` |
| **7** | Pantalla del Auditor (HU-07) | ✅ | `features/auditoria/` |
| **8** | Notificaciones (HU-35) | ✅ | `features/notificaciones/` — campana con `noLeidas` y pantalla completa |
| **9** | Módulos restantes | ⬜ | Pendiente. Los cimientos que necesitan ya están. |

**B4 (decimales como string)** se cierra de raíz en `schemas/comunes.ts#decimal`, que acepta los dos formatos —string desde la entidad, número desde el SQL— y rechaza el string vacío para que un campo sin cargar no se vuelva un cero creíble.

El bug del backend de la §5 (`GET /catalogos` sin `tipo` devuelve 500) **sigue abierto**: es del otro repositorio. Desde acá, `endpoints/catalogos.ts` hace el parámetro obligatorio en la firma para que no se pueda omitir por accidente, y el handler de MSW lo reproduce.

---

## 1. Lo que ya está roto

Ordenado por gravedad: primero lo que rompe pantallas que hoy se usan.

### B1 — Los listados paginados devuelven un envelope, no un array

`GET /api/usuarios` devuelve:

```json
{ "data": [ {...}, {...} ], "total": 12, "page": 1, "pageSize": 20, "totalPages": 1 }
```

El hook lo declara `Usuario[]`:

```ts
// src/hooks/use-usuarios.ts:22
const { data } = await api.get<Usuario[]>("/usuarios")
```

`usuarios.length` es `undefined`, así que la página no entra en la rama de la tabla y **cae en el estado vacío**: la pantalla de Usuarios dice "No hay usuarios cargados todavía" con doce usuarios en la base. No hay error en consola, no hay toast, no hay nada — es el peor modo de falla posible, porque parece un dato y no un bug.

**Endpoints paginados** (los 8 que existen, para no repetir el error al conectar el resto):

| Endpoint | Extra en el envelope |
|---|---|
| `GET /usuarios` | — |
| `GET /log-auditoria` | — |
| `GET /notificaciones` | **`noLeidas`** (para el badge de la campana) |
| `GET /lecturas-iot/sensor/:id` | — |
| `GET /registro-labor/cuartel/:id` | — |
| `GET /pesajes-vendimia/cuartel/:id` | — |
| `GET /remitos` | — |
| `GET /cuarteles/buscar` | — |

`page` arranca en 1, `pageSize` por defecto es 20 y tiene **techo duro de 100**: pedir 1000 no devuelve 1000. Los filtros booleanos van como `?activo=false` en string.

**Ojo con `GET /cuarteles`:** ese sigue devolviendo un array plano. El paginado es `GET /cuarteles/buscar`, que es otro endpoint (búsqueda a nivel empresa de HU-11). Los dos existen y hacen cosas distintas.

### B2 — `empresaId` en el body ahora es un 400

Verificado:

```
POST /api/fincas  {"nombre":"Prueba Web","hectareas":10,"empresaId":"7126..."}
→ HTTP 400  {"message":["property empresaId should not exist"]}
```

El backend saca la empresa del token y borró `empresaId` de los DTO — recibirlo permitía crear fincas en otra empresa (era el F0-4 de su plan). El `ValidationPipe` global corre con `forbidNonWhitelisted: true`, así que un campo de más no se ignora: **rechaza la request entera**.

Este repo lo manda en los dos diálogos de alta:

- [`src/pages/fincas/create-finca-dialog.tsx`](../src/pages/fincas/create-finca-dialog.tsx) → `useCreateFinca` con `empresaId` en `CreateFincaInput`
- [`src/pages/usuarios/create-usuario-dialog.tsx:47`](../src/pages/usuarios/create-usuario-dialog.tsx#L47) → `{ ...values, empresaId: user.empresaId }`

**Los dos botones "Crear" del sistema están rotos.** Al menos este falla de forma visible: el toast muestra `property empresaId should not exist`, que es un mensaje para un programador, no para un usuario.

**Arreglo:** sacar `empresaId` de `CreateFincaInput` y `CreateUsuarioInput`, y del `mutateAsync`. No hay que reemplazarlo por nada: el backend lo resuelve solo.

### B3 — El dashboard ya no tiene una sola forma: es una unión por rol

`GET /api/dashboard/indicadores` como Propietario:

```
rol, fincasActivas, cuartelesActivos, alertasIotPendientes, remitosPendientesAprobacion,
kgCosechadosCampaniaActual, campaniaActual, estadoCosechaGlobal,
costoLaboresTotal, costoInsumosTotal, costosPorFinca, alertasRecientes, registrosConError
```

El mismo endpoint como **Auditor**:

```json
{ "rol": "Auditor", "eventosRecientes": [ ... ] }
```

Ninguna de las seis claves que leen los `StatCard` existe en esa respuesta. Y `formatNumber(undefined)` no explota: `Intl.NumberFormat.format(undefined)` devuelve **`"NaN"`**. Verificado:

```
formatNumber(undefined)              => "NaN"
formatCurrency(undefined + undefined) => "$ NaN"
```

**El Auditor entra al sistema y su pantalla de inicio son seis tarjetas que dicen NaN.** Es el primer usuario no-Propietario que se pruebe.

El discriminante es `rol`, así que el arreglo es un tipo unión y un `switch`:

```ts
type IndicadoresClave =
  | { rol: "Propietario" | "Agronomo" } & Operativos & Economicos & DesgloseEconomico
  | { rol: "Capataz" }    & Operativos & IndicadoresCapataz
  | { rol: "Auditor"; eventosRecientes: LogAuditoria[] }
```

Con la unión bien declarada, TypeScript **obliga** a manejar los cuatro roles: es la diferencia entre que el compilador te avise y que el Auditor vea NaN.

Y hay dato nuevo que aprovechar: `campaniaActual` (con `id`, `nombre`, `desde`, `hasta`, o `null`) permite que la tarjeta diga *de qué campaña* son los kilos en vez de dar por sentado el año calendario, y `estadoCosechaGlobal` trae el reparto de cuarteles por estado, listo para un gráfico.

### B4 — Todos los decimales llegan como string

```json
{ "nombre": "Finca Smoke 041052", "hectareas": "25.50", "cuartelesActivos": 3 }
{ "numeroRemito": "REM-2026-00012", "totalKg": "2000.00", "totalLiquidacion": "51000.00" }
```

No es un descuido del backend: el driver de PostgreSQL devuelve `numeric`/`decimal` como string **a propósito**, porque un `numeric(14,2)` no entra sin pérdida en un `double` de JavaScript. Las entidades lo declaran `number` en TypeScript, así que el backend tampoco lo ve.

Son **~25 campos en 16 entidades**: `hectareas`, `latitud`, `longitud`, `kgTotales`, `montoLiquidacion`, `totalKg`, `totalLiquidacion`, `costoUnitario`, `tarifaPorKg`, `cantidad`, `cantidadUsada`, `valor` de lectura, `umbralMinimo`/`umbralMaximo`, `precioPorKg`, `montoNeto`, `kgAceptados`…

Hoy este repo no suma ninguno, así que **no se nota**: `{finca.hectareas}` imprime `"25.50"` y queda bien. Se va a notar en la primera pantalla que haga aritmética:

```ts
fincas.reduce((a, f) => a + f.hectareas, 0)   // "025.5018.00" — concatena
kg / hectareas                                 // funciona: / sí coerciona
[...].sort((a, b) => a.totalKg - b.totalKg)    // funciona
[...].sort()                                   // orden lexicográfico: "100" < "20"
```

Que `*`, `/` y `-` funcionen y `+` no es lo peor del asunto: significa que el bug aparece en **una** de las cuatro operaciones, en una pantalla, tarde.

Y hay una trampa extra: **el mismo concepto viene en los dos formatos según el endpoint.** `GET /fincas` devuelve `hectareas: "25.50"` (string, sale de la entidad) y `GET /registro-labor/costeo` devuelve `hectareas: 6` (número, lo castea el SQL). Un helper que asuma uno de los dos falla en el otro.

**Arreglo:** convertir en el borde con `z.coerce.number()` — parte de la sección 3, no un parche por pantalla.

### B5 — La contraseña temporal no tiene pantalla

El alta de usuario cambió (HU-05): `password` es **opcional** y omitirla es el camino recomendado — el backend genera una contraseña temporal, manda el correo de bienvenida con un enlace de 48 h y marca `debeCambiarPassword`. Así el Propietario nunca conoce la contraseña de otro usuario.

El login lo devuelve:

```json
{ "accessToken": "...", "user": { "id": "...", "email": "...", "rol": "Propietario",
  "empresaId": "...", "debeCambiarPassword": false } }
```

Este repo:

1. No tiene `debeCambiarPassword` en `AuthenticatedUser`, así que lo descarta al guardar en `localStorage`.
2. No tiene pantalla de cambio de contraseña. `POST /auth/cambiar-password` existe y nadie lo llama.
3. El diálogo de alta **exige** contraseña (`z.string().min(8)`), o sea que fuerza el camino que la HU desaconseja.
4. Su regla de contraseña es `min(8)` y la del backend es 8-72 caracteres **con al menos una letra y al menos un número**. `12345678` pasa la validación del cliente y la rechaza el servidor.

**Consecuencia:** un usuario creado por el camino recomendado entra al sistema, `debeCambiarPassword` es `true`, y no hay ninguna pantalla que se lo pida. Sigue usando la contraseña temporal que le llegó por mail.

También faltan las dos pantallas de HU-03, que el backend ya soporta entero: `POST /auth/forgot-password` y `POST /auth/reset-password`. El login no tiene ni el link de "Olvidé mi contraseña".

### B6 — Los roles del frontend no coinciden con los del backend

El `RolesGuard` del backend pasó a ser **fail-closed**: sin `@Roles` explícito, deniega. Y el Auditor quedó acotado a propósito al log de auditoría y al historial por cuartel. Verificado con un token de Auditor:

| Petición | Resultado |
|---|---|
| `GET /fincas` | **403** |
| `GET /cuarteles?fincaId=…` | **403** |
| `GET /usuarios` | **403** |
| `GET /roles` | **403** |
| `GET /notificaciones` | 200 |
| `GET /campanias` | 200 |

El menú de [`app-layout.tsx:26`](../src/layouts/app-layout.tsx#L26) le muestra al Auditor *Fincas y Cuarteles*, *Operaciones*, *Telemetría IoT* y *Vendimia*. Las cuatro llevan a un 403.

Y hay un problema de fondo peor que los links: la lista de roles por pantalla está **duplicada** en dos lugares del frontend (`NAV_ITEMS` y `RoleRoute` en el router) y en un tercero en el backend (los `@Roles` de cada controller). Tres copias que ya divergen hoy. La sección 3 propone una sola tabla de permisos derivada de los `@Roles` reales.

### B7 — El logout ahora invalida de verdad, y el 401 recarga la página

Dos cambios chicos, uno bueno y uno a corregir:

- **Bueno:** `POST /auth/logout` revoca el `jti` del token (HU-02). Antes el JWT seguía sirviendo sus 8 horas. El `catch` que ignora el fallo de logout en [`auth-context.tsx:45`](../src/context/auth-context.tsx#L45) ahora tiene una consecuencia real: si esa llamada falla, el token **sigue vivo** aunque el frontend limpie el `localStorage`. Vale reintentar, o al menos avisar.
- **A corregir:** el interceptor de 401 hace `window.location.assign("/login")`, que es una recarga completa: tira el cache de React Query, pierde la ruta a la que el usuario quería ir y hace parpadear la app. Con react-router en la mano, esto se resuelve navegando.

---

## 2. Lo que el backend ofrece y este repo todavía no usa

De las 36 HU, el frontend web es responsable de **26** (las de actor `Capataz` en campo —HU-12, 13, 24, 26— son de Mobile, y HU-14/19/25 son procesos sin pantalla). Hoy hay **5 pantallas conectadas y 5 placeholders**.

| Módulo | HU | Endpoints disponibles | Estado en Web |
|---|---|---|---|
| Auth | 01, 02 | `login`, `logout` | 🟢 Conectado |
| Auth | 03 | `forgot-password`, `reset-password` | 🔴 No existe |
| Auth | 04 | `GET/PATCH /usuarios/me`, `cambiar-password` | 🔴 No existe |
| Usuarios | 05, 06 | `GET/POST/PATCH /usuarios`, `:id/desactivar`, `GET /roles`, `PUT :id/fincas` | 🟠 Listado roto (B1), alta rota (B2), sin cambio de rol, sin filtros ni paginación |
| Auditoría | 07 | `GET /log-auditoria` (filtros: actor, entidad, acción, rango) | 🔴 No existe — y es **la única pantalla del Auditor** |
| Fincas | 08 | `GET/POST/PATCH /fincas`, `:id/desactivar` | 🟠 Alta rota (B2), sin editar, sin baja |
| Cuarteles | 09 | `GET/POST/PATCH /cuarteles`, `:id/desactivar` | 🟠 Sin editar, sin baja, `estado` sin mostrar |
| Mapa | 10 | `latitud`/`longitud` en finca y cuartel, `estado` para colores | 🔴 No existe |
| Búsqueda | 11 | `GET /cuarteles/buscar`, `GET /cuarteles/variedades` | 🔴 No existe (hoy solo busca fincas por nombre) |
| Costeo | 15 | `GET /registro-labor/costeo`, `:id/margen-bruto` | 🔴 Placeholder |
| Catálogos | 16 | `GET/POST/PATCH /insumos`, `/tipos-labor`, `:id/costos` | 🔴 Placeholder |
| Historial | 17 | `GET /registro-labor/cuartel/:id` (paginado, filtros) | 🔴 Placeholder |
| Sensores | 18 | `GET/POST/PATCH /sensores` (con última lectura incluida) | 🔴 Placeholder |
| Gráficos | 20 | `GET /lecturas-iot/sensor/:id/serie` (agregada por hora/día) | 🔴 Placeholder |
| Umbrales | 21 | `GET/PUT /sensores/:id/umbral` | 🔴 Placeholder |
| Alertas | 22 | `GET /alertas-iot/pendientes`, `:id/revisar` | 🔴 Placeholder |
| Cuadrillas | 23 | `GET/POST/PATCH /cuadrillas`, `:id/tarifas` | 🔴 Placeholder |
| Remitos | 26, 27 | `GET /remitos`, `:id`, `generar-borrador`, `:id/aprobar`, `:id/rechazar`, `PUT :id/liquidacion` | 🔴 Placeholder |
| Cosecha | 28 | `GET /pesajes-vendimia/finca/:id/estado-cosecha` | 🔴 Placeholder |
| Correlación | 29 | `GET /inteligencia-agronomica/correlacion/:cuartelId` | 🔴 Placeholder |
| Recomendaciones | 30 | `GET /…/recomendaciones/:cuartelId`, `PATCH /…/recomendaciones/:id` | 🔴 Placeholder |
| Campañas | 31 | `GET/POST/PATCH /campanias`, `:id/cerrar`, `GET /…/comparar-campanias/:cuartelId` | 🔴 No existe |
| Dashboard | 32 | `GET /dashboard/indicadores` | 🟠 Roto para 3 de 4 roles (B3) |
| Configuración | 33 | `GET/PUT /configuracion` (10 claves, `smtp_pass` enmascarada) | 🔴 Placeholder |
| Tablas maestras | 34 | `GET/POST/PATCH/DELETE /catalogos` | 🔴 No existe |
| Notificaciones | 35 | `GET /notificaciones` (+`noLeidas`), `:id/leida`, `leidas` | 🔴 No existe — **ni el badge de la campana** |
| Ayuda | 36 | `GET /ayuda/articulos`, `POST /ayuda/tickets`, `GET /ayuda/tickets` | 🔴 Placeholder |

**Dos huecos que conviene señalar aparte, porque no son "una pantalla más":**

- **El Auditor no tiene ninguna pantalla.** Su alcance es el log de auditoría (HU-07) y el historial por cuartel (HU-17), y ninguno de los dos existe en Web. Hoy el rol entra al sistema y no puede hacer nada. Es un rol completo sin interfaz, y es el rol que un tribunal va a querer ver funcionando.
- **`campanias` es una entidad nueva.** Salió de la decisión [D-014](https://github.com/TerraVidMza/Backend/blob/develop/docs/DECISIONS.md) durante el cierre del backend, no estaba en el modelo original, y no tiene pantalla en Figma. Sin una campaña cargada, el dashboard cae al año calendario y lo informa. Necesita su propio ABM antes de que la comparación de campañas (HU-31) tenga sentido.

**Nota sobre Figma:** 8 HU no tienen pantalla diseñada (04, 17, 25, 28, 32, 34, 35, 36). Cuatro de esas son de Web: datos personales, historial por cuartel, tablas maestras y notificaciones. Conviene resolver el diseño antes de implementarlas, o asumir explícitamente que se diseñan en código.

---

## 3. La causa raíz: una capa de contrato de verdad

Los siete problemas de la sección 1 son **el mismo problema**: la frontera con el backend no está tipada, está *afirmada*.

```ts
const { data } = await api.get<Usuario[]>("/usuarios")
//                            ^^^^^^^^^^ esto no valida nada
```

`api.get<T>` no comprueba nada en tiempo de ejecución: le dice al compilador "confiá en mí". Y el compilador confía. Por eso `npm run build` pasa limpio con la pantalla de Usuarios rota, el dashboard en NaN y las hectáreas siendo strings. **Arreglar los siete casos sin arreglar esto es garantizar el octavo.**

### La decisión: validar en el borde con zod

`zod` ya es dependencia del proyecto (se usa en los formularios). La misma herramienta sirve para la respuesta:

```ts
// src/api/schemas/finca.ts
export const fincaSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  ubicacion: z.string().nullable(),
  hectareas: z.coerce.number(),      // "25.50" -> 25.5, y B4 deja de existir
  activa: z.boolean(),
  latitud: z.coerce.number().nullable(),
  longitud: z.coerce.number().nullable(),
  cuartelesActivos: z.number(),
})
export type Finca = z.infer<typeof fincaSchema>   // el tipo SALE del schema
```

Tres propiedades que ninguna alternativa más barata da:

1. **`z.coerce.number()` resuelve B4 de raíz**, en un solo lugar por campo, sin `Number(...)` repartido por las pantallas.
2. **El tipo se deriva del schema** (`z.infer`), así que no puede desincronizarse de la validación. Con interfaces a mano, siempre puede.
3. **Cuando el backend cambie, falla acá y con nombre y apellido**: `hectareas: expected number, received null` en la capa de API, no `$ NaN` en una tarjeta tres pantallas más adentro.

Y un envelope genérico que se escribe una vez:

```ts
export const paginado = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item), total: z.number(), page: z.number(),
    pageSize: z.number(), totalPages: z.number(),
  })
```

### Qué NO hacer

**No generar el cliente desde OpenAPI.** Sería lo ideal, pero el backend **no tiene `@nestjs/swagger`** — hay que instalarlo y anotar 24 módulos. Es trabajo en el otro repo y no desbloquea nada de esto. Vale como mejora futura del backend, no como prerequisito de este plan.

**No compartir tipos importando las entidades del backend.** Tentador y equivocado: las entidades declaran `hectareas: number` y el JSON trae `"25.50"`. Compartir el tipo compartiría la mentira. El único contrato confiable es el que se valida contra la respuesta real.

### Alcance concreto

```
src/api/
  client.ts              # el axios de hoy + navegación en 401 sin recargar
  request.ts             # get/post/patch que validan con un schema y tipan el retorno
  schemas/
    comunes.ts           # paginado(), enums, fecha, decimal
    auth.ts  usuario.ts  finca.ts  cuartel.ts  dashboard.ts  ...
  endpoints/
    usuarios.ts  fincas.ts  ...   # una función por endpoint, ya validada
src/features/<modulo>/   # hooks de React Query + pantallas, consumiendo endpoints/
```

Los hooks actuales de `src/hooks/` se mudan a `src/features/<modulo>/` con su pantalla: agrupar por módulo en vez de por tipo de archivo hace que agregar Vendimia sea un directorio nuevo y no ediciones en cinco carpetas.

**Una sola tabla de permisos**, derivada de los `@Roles` reales del backend, en lugar de las tres copias que hay hoy:

```ts
// src/auth/permisos.ts
export const PERMISOS = {
  fincas:        ["Propietario", "Agronomo", "Capataz"],
  usuarios:      ["Propietario"],
  logAuditoria:  ["Propietario", "Auditor"],
  // ...
} as const satisfies Record<string, readonly RolNombre[]>
```

De ahí salen el menú, las rutas y el renderizado condicional de botones. Sigue siendo una copia de la verdad del backend, pero **una**, en un archivo cuyo único trabajo es estar al día — y el backend sigue siendo la autoridad: esto decide qué se muestra, no qué se permite.

---

## 4. Orden de trabajo

El orden importa: hacer los arreglos antes de la capa de contrato significa hacerlos dos veces.

| # | Trabajo | Por qué en este lugar |
|---|---|---|
| **1** | **Capa de contrato** (`src/api/` con zod) — schemas de lo que ya se consume: auth, usuarios, fincas, cuarteles, catálogos, dashboard | Es la causa raíz. Todo lo que venga después se apoya acá, y `z.coerce.number()` cierra B4 antes de que aparezca. |
| **2** | **B2 (`empresaId`) y B1 (envelope)** | Son los dos que rompen pantallas en uso, y con los schemas ya hechos son un par de líneas cada uno. |
| **3** | **B3 (dashboard por rol)** + **B6 (permisos)** | Van juntos: la misma información —qué ve cada rol— resuelve el NaN del Auditor y los links a 403. |
| **4** | **B5 (contraseñas)**: cambio obligado, recuperar contraseña, alta sin password, política igual a la del backend | Cierra HU-03 y HU-04, y desbloquea el alta de usuarios por el camino recomendado. |
| **5** | **B7** (401 sin recargar, reintento de logout) | Chico, y mejor hacerlo antes de que haya 20 pantallas con cache que perder. |
| **6** | **Primitivas de UI**: tabla paginada, estados de carga/error/vacío, formulario, `EstadoBadge` con los enums | Las escribe una vez el primer módulo nuevo y las usan los diez siguientes. Ver [PLAN-MEJORAS.md](PLAN-MEJORAS.md) W4-W5. |
| **7** | **Pantalla del Auditor** (HU-07 log de auditoría) | Es el rol que hoy no puede hacer nada, y es barato: un listado paginado con filtros. |
| **8** | **Notificaciones** (HU-35): campana con `noLeidas`, panel, marcar leídas | Transversal: se ve desde todas las pantallas y el backend ya lo tiene entero. |
| **9** | **Módulos restantes**, por bloque: Operaciones (15, 16, 17) → Vendimia (23, 26, 27, 28) → Telemetría (18, 20, 21, 22) → Inteligencia (29, 30, 31) → Config (33, 34) → Ayuda (36) → Mapa (10, 11) | Cada bloque comparte modelo de datos y pantallas, así que hacerlos juntos evita rehacer los mismos hooks. |

Los pasos 1 a 5 son los que hacen que lo que ya existe funcione. **De ahí hacia adelante es construir, no reparar.**

---

## 5. Bugs del backend encontrados auditando esto — ✅ corregidos

Buscar el patrón de un `@Query()` sin validar destapó nueve parámetros crudos en seis controllers del backend, con tres modos de falla. **Ya están arreglados** (rama `fix/query-params-sin-validar`), pero quedan documentados acá porque dos afectan directamente a pantallas de este plan.

### El que sí importa para el Web: un filtro booleano invertido

`GET /usuarios?activo=false` devolvía los usuarios **activos**. Verificado con un inactivo en la base: traía las 9 filas activas y ninguna inactiva. Lo mismo en `/notificaciones?soloNoLeidas=` y `/cuarteles/buscar?activo=`.

La causa vale conocerla, porque es la misma familia que W1 de este repo: los tres DTO tenían un `@Transform` escrito justamente para evitarlo, y no funcionaba. El backend corre con `enableImplicitConversion: true`, y esa conversión se aplica **antes** del `@Transform`: miraba el tipo declarado (`boolean`) y hacía `Boolean('false')`, que es `true`. Una validación que se lee correcta en el código y la derrota una opción del framework.

**Por qué importa acá:** el paso 4 del orden de trabajo es completar Fincas, Cuarteles y Usuarios con sus filtros. El filtro "ver inactivos" habría devuelto lo contrario de lo pedido, y desde el frontend eso se ve como un bug del frontend.

### Los otros

Dos devolvían **500** a una entrada inválida del cliente:

```
GET /api/catalogos                        → 500  (tipo ausente llegaba al where)
GET /api/…/correlacion/:id?desde=basura   → 500  (la cadena llegaba al SQL)
```

Y cuatro devolvían **200 con una lista vacía**, que para un cliente es peor: no hay forma de distinguir "escribí mal el parámetro" de "no hay datos", así que un typo se investiga en la base.

```
GET /api/catalogos?tipo=basura            → 200 []
GET /api/ayuda/articulos?modulo=vendmia   → 200 []
GET /api/…/correlacion/:id (sin fechas)   → 200 "No hay suficientes datos"
GET /api/usuarios?activo=basura           → 200, interpretado como true
```

El de la correlación es el más engañoso: parece un veredicto agronómico sobre el cuartel cuando en realidad nadie mandó el período a analizar.

**Los siete ahora son 400** con un mensaje que dice qué se espera (`tipo debe ser uno de: variedad, sistema_conduccion, …`), así que el frontend puede mostrarlo tal cual. Y el filtro global del backend traduce los códigos `22007`/`22P02` de PostgreSQL a 400, de modo que un parámetro mal formado que se escape de un DTO en el futuro cueste un 400 y no una caída.
