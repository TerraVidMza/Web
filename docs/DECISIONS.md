# Decisiones del Frontend Web

Registro de las decisiones tomadas en este repositorio. Las que afectan al
sistema completo están en [`docs/DECISIONS.md` del Backend](https://github.com/TerraVidMza/Backend/blob/develop/docs/DECISIONS.md);
acá van solo las de Web.

Formato: qué se decidió, contra qué alternativa, y por qué. El "por qué" es lo
único que no se puede reconstruir leyendo el código.

---

## W-001 — Validar la frontera con la API usando zod

**Decisión:** toda respuesta del backend pasa por un schema de zod antes de
llegar a un componente (`src/api/`), y los tipos se derivan del schema con
`z.infer`.

**Alternativas descartadas:**

- *Generar el cliente desde OpenAPI.* Sería lo ideal, pero el backend no tiene
  `@nestjs/swagger`: habría que instalarlo y anotar 24 módulos. Es trabajo en
  otro repositorio y no desbloquea nada de esto. Queda como mejora futura del
  backend, no como prerequisito.
- *Compartir tipos importando las entidades del backend.* Tentador y
  equivocado: las entidades declaran `hectareas: number` y el JSON trae
  `"25.50"`. Compartir el tipo compartiría la mentira.

**Por qué:** `api.get<Usuario[]>(...)` era una afirmación, no una comprobación.
Por eso `npm run build` pasaba limpio con la pantalla de Usuarios vacía, el
dashboard en `NaN` y las hectáreas siendo strings. Con validación en el borde,
un cambio de contrato falla en la capa de API con el nombre del campo, en vez de
aparecer tres pantallas más adentro.

---

## W-002 — Una sola tabla de permisos, derivada de los `@Roles` del backend

**Decisión:** `src/auth/permisos.ts` es la única lista de qué rol ve qué. De ahí
salen el menú, las rutas y el renderizado condicional de botones.

**Por qué:** estaba tres veces —`NAV_ITEMS`, `RoleRoute` y los `@Roles` de cada
controller— y ya divergía: el menú le ofrecía al Auditor cuatro secciones que le
devolvían 403. Sigue siendo una copia de la verdad del backend, pero **una**, en
un archivo cuyo único trabajo es estar al día. El backend sigue siendo la
autoridad: esta tabla decide qué se muestra, no qué se permite.

---

## W-003 — Vitest + React Testing Library + MSW; Playwright más adelante

**Decisión (D-c del plan de mejoras):** tests unitarios y de componente con
Vitest y RTL, y MSW para la capa de red. Los handlers se escriben con las
**respuestas reales** de la API, transcriptas en
[`PLAN-ADAPTACION-BACKEND.md`](PLAN-ADAPTACION-BACKEND.md) §1 y verificadas
contra las entidades del backend.

**Por qué:** un handler que devuelve lo que el frontend espera convierte el test
en una tautología. Estos devuelven lo que el servidor manda —decimales como
string, envelope paginado, unión por rol— así que los primeros tests **fallan
contra el código anterior**, que es lo único que se le pide a un test de
regresión.

Playwright queda para después, con un único camino feliz (login → crear finca →
crear cuartel): un e2e que cubra todo se vuelve lento y nadie lo corre.

---

## W-004 — Moneda, unidades y zona horaria salen de `GET /configuracion`

**Decisión (D-e):** los formateadores toman `moneda`, `unidades` y
`zona_horaria` de la configuración de la empresa, con fallback a `es-AR` / `ARS`
/ `America/Argentina/Mendoza`.

**Limitación conocida:** `GET /configuracion` es `@Roles(PROPIETARIO)`, así que
un Agrónomo, un Capataz o un Auditor **nunca reciben esos valores** y ven los
por defecto. Lo correcto sería que el backend expusiera el subconjunto no
sensible a cualquier rol; hasta entonces está anotado en
`src/context/configuracion-context.tsx` para que no se descubra como un bug de
formato.

**Por qué:** ponerlo después implica tocar cada pantalla que formatea plata.

---

## W-005 — Paginación con controles de página, no scroll infinito

**Decisión (D-f):** `<TablaPaginada>` con "página X de Y", total de filas y
selector de filas por página.

**Por qué:** es una aplicación de oficina. Se necesita ir a la página 4 y saber
cuántas filas hay en total; el scroll infinito pelea con las dos cosas.

---

## W-006 — Las HU sin pantalla en Figma se diseñan en código

**Decisión (D-g):** HU-04 (datos personales), HU-17 (historial por cuartel),
HU-34 (tablas maestras) y HU-35 (notificaciones) se diseñan directamente con los
componentes de shadcn.

**Por qué:** las cuatro son listados y formularios estándar. Esperar el diseño
frena cuatro HU por algo que el design system ya resuelve.

---

## W-007 — Leaflet para el mapa, Recharts para los gráficos

**Decisión (D-a y D-b):** cuando se implementen HU-10 y HU-20/29/31.

- **Leaflet con `react-leaflet`** y tiles de OpenStreetMap: sin API key, sin
  costo y sin tarjeta de crédito. HU-10 solo pide marcadores con color por
  estado y un popup.
- **Recharts:** declarativa, integra bien con shadcn, y las tres pantallas que
  la necesitan piden series de tiempo y barras, nada exótico.

Ninguna de las dos está instalada todavía: se agregan con el módulo que las use,
para no cargar el bundle con librerías sin pantalla.

---

## W-008 — Web muestra en modo lectura lo que carga el Capataz

**Decisión (D-d):** las labores y los pesajes se registran desde Mobile; la
oficina los ve sin poder editarlos.

**Por qué:** es de donde sale el costeo, y HU-17 pone al Propietario y al
Agrónomo como actores del historial. Nótese que el backend restringe al Capataz
a *sus propios registros del día* en ese mismo endpoint.

---

## W-009 — El remito imprimible se resuelve con CSS de impresión

**Decisión (D-h):** `@media print` sobre la pantalla de `GET /remitos/:id`, que
ya trae cuartel, finca y detalle de pesajes.

**Por qué:** un PDF del lado del servidor es un módulo nuevo en el backend para
un requisito que el navegador ya cubre.

---

## W-010 — El entorno se valida al arrancar y falla si falta

**Decisión (F1-7):** `src/config/env.ts` valida `import.meta.env` con zod y
lanza si `VITE_API_URL` no está.

**Por qué:** el fallback anterior —`?? "http://localhost:3000/api"`— convertía un
`.env` mal escrito en producción en una app que apunta al localhost de quien la
abre: no falla el build, no falla el arranque, falla cada request con un error de
red que parece un problema del backend.

---

## W-011 — El Auditor entra al historial por cuartel desde el log de auditoría

**Contexto:** HU-17 le concede al Auditor el historial de operaciones por cuartel
—`GET /registro-labor/cuartel/:id` lo incluye explícitamente en sus `@Roles`—,
pero **no tiene forma de obtener un `cuartelId`**: `GET /cuarteles`,
`/cuarteles/buscar` y `/cuarteles/:id` son `@Roles(Propietario, Agrónomo,
Capataz)`.

**Decisión:** el log de auditoría muestra un enlace al historial en los eventos
cuya entidad es `cuartel`. Es la única vía de entrada que el contrato actual
permite, y de paso es un recorrido coherente: "veo que tocaron el cuartel X,
quiero ver qué se hizo ahí".

**Lo correcto sería** que el backend le diera al Auditor un listado de cuarteles
de solo lectura. Queda anotado como hueco del contrato, no como decisión de
diseño de esta pantalla.

---

## W-012 — El costo vigente se consulta al abrir el diálogo, no por fila

**Decisión:** el listado de insumos y tipos de labor muestra nombre, unidad y
estado; el precio se pide al abrir «Costos», que trae el historial completo.

**Por qué:** `GET /insumos` no incluye el costo vigente —vive en
`/:id/costos`—, así que mostrarlo en la tabla serían N+1 requests al dibujar.
Y el historial completo es más útil que el número suelto: deja ver desde cuándo
rige cada precio y cuáles están programados a futuro.

**Detalle que no es cosmético:** el backend devuelve el historial ordenado por
`validFrom` descendente, así que **el primero no es necesariamente el vigente**
—un costo cargado con fecha futura encabeza la lista—. La pantalla marca
«Vigente» y «Programado» por separado; sin esa distinción mostraría como precio
actual uno que todavía no se aplica.
