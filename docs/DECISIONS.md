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

> **Resuelto (2026-10-05):** la Web pasó a leer `GET /configuracion/preferencias`, que el backend abre a cualquier rol (D-020). Ahora todos los roles ven el formato de su empresa. Lo que sigue describe la limitación original.

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

Se agregaron recién con el módulo que las usa, para no cargar el bundle con
librerías sin pantalla. Hoy las dos están instaladas y en uso (2026-10-06).

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

> **Resuelto (2026-10-05):** el backend le habilitó al Auditor la lectura de fincas y cuarteles (D-021), y la Web lo refleja desde que los permisos vienen del backend (W-025). El Auditor ya tiene Fincas, Cuarteles y Mapa en modo lectura. Lo que sigue describe la limitación original.

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

---

## W-013 — El remito se imprime con CSS, no con un PDF del servidor

**Decisión (D-h):** `/remitos/:id` es una pantalla normal con reglas `@media
print` y clases `print:` de Tailwind. El botón «Imprimir» llama a
`window.print()`.

**Por qué:** `GET /remitos/:id` ya trae cuartel, finca, variedad y el detalle de
pesajes. Un PDF del lado del servidor sería un módulo nuevo en el backend —una
librería de render, plantillas, un endpoint más— para un requisito que el
navegador cubre. Si más adelante hace falta un PDF firmado o adjunto a un mail,
ahí sí conviene generarlo en el backend.

---

## W-014 — La fecha es obligatoria al generar un borrador de remito

**Contexto:** `GenerarRemitoDto.fecha` es `@IsOptional()` en el backend, y
omitirla arrastra **todos** los pesajes pendientes del cuartel sin importar de
cuándo sean. El propio DTO explica que se dejó opcional para no romper clientes
existentes.

**Decisión:** esta pantalla la exige igual. Un remito de vendimia documenta el
despacho de una jornada, no el acumulado histórico, y un borrador con pesajes de
tres semanas distintas es un error caro de deshacer —hay que rechazarlo, y el
rechazo deja los pesajes observados—.

---

## W-015 — Una sola función clasifica todas las vigencias

**Decisión:** `clasificarVigencias()` marca cuál valor rige hoy y cuáles están
programados, y la usan los costos de insumo, los de tipo de labor y las tarifas
de cuadrilla.

**Por qué:** las tres son tablas append-only con `valid_from`, y las tres las
devuelve el backend ordenadas por fecha **descendente**. Eso significa que **el
primer elemento no es necesariamente el vigente**: una vigencia cargada con
fecha futura encabeza la lista. Resolverlo tres veces era garantizar que dos de
las tres pantallas mostraran como valor actual uno que todavía no se aplica.

---

## W-016 — Recharts, con su costo medido

**Decisión (D-b), ahora ejecutada:** Recharts 3 para los gráficos de series de
tiempo.

**Lo que cuesta, medido:** la librería pesa **372 kB** en su propio chunk. Queda
aislada en la ruta `/sensores/:sensorId`, que es la única que grafica: el chunk
de entrada pasó de 338 a 383 kB, y de esos 45 kB unos 39 son un chunk compartido
que Rolldown plegó adentro al redibujar los límites — el crecimiento real del
shell es de unos 6 kB. Nadie que no abra la serie de un sensor descarga Recharts.

Vale tenerlo anotado: si más adelante hacen falta gráficos en el dashboard —que
sí es la primera pantalla— ese costo se muda al camino crítico, y ahí conviene
volver a mirarlo.

---

## W-017 — Cómo se dibuja la serie de un sensor

**Decisión:** una línea de promedio con una banda de mínimo a máximo, umbrales
como líneas de referencia etiquetadas, y una vista de tabla al lado.

**Por qué la banda:** cada punto es el agregado de un período completo —el
backend agrega en SQL porque un mes de un sensor que mide cada 5 minutos son
~9.000 puntos—. Dibujar solo el promedio fingiría una precisión que el dato no
tiene y escondería las oscilaciones, que es justamente lo que un agrónomo mira.

**Por qué los umbrales van etiquetados:** son colores de estado, y un color de
estado nunca puede cargar significado solo.

**Por qué la tabla:** es el relevo de accesibilidad para quien no puede leer la
forma del gráfico, y de paso es lo que se copia cuando alguien quiere los
números.

**Colores:** azul de serie y rojo de límite, validados contra las superficies
reales de la aplicación (`#ffffff` y `#171717`) en los dos modos: separación CVD
ΔE 23.8 claro / 25.7 oscuro y contraste ≥ 3:1 en ambos. El modo oscuro usa pasos
propios, no un volteo automático del claro. No hay caja de leyenda porque hay una
sola serie y el título la nombra.

---

## W-018 — La correlación va en dos gráficos, nunca en uno con dos ejes

**Decisión (HU-29):** la serie del sensor y la del costo diario se dibujan en
**gráficos separados** que comparten el eje de fechas.

**Por qué:** son magnitudes de escalas distintas. Superponerlas con dos ejes Y
hace que la alineación de las dos escalas —que es arbitraria, la elige quien
dibuja— produzca una correlación visual que el dato no respalda. Es el error de
gráfico más común que existe, y acá sería especialmente grave: la pantalla
entera trata sobre si hay o no relación entre las dos variables.

La relación real la dice el coeficiente de Pearson, que calcula el backend con
su propio umbral de significancia (7 días con dato en ambas series).

---

## W-019 — Con datos insuficientes, el coeficiente no se presenta como veredicto

**Decisión:** cuando `datosSuficientes` es `false`, la pantalla muestra el aviso
del backend y cuántos días faltan, junto al número.

**Por qué:** el coeficiente viene igual —con tres días puede dar 0,98— y
mostrarlo solo se leería como una conclusión agronómica sobre el cuartel cuando
en realidad falta período. El texto y el umbral los emite el backend para que el
cliente no duplique la regla.

---

## W-020 — La comparación entre campañas es una tabla, no un gráfico

**Decisión (HU-31):** siete indicadores × dos períodos en una tabla, con la
variación porcentual coloreada.

**Por qué:** los indicadores tienen unidades distintas —kilos, pesos, pesos por
hectárea—. Un gráfico de barras agrupadas obligaría a normalizarlos o a poner
varias escalas, y lo que el productor lee es la variación, que es un número.

**El detalle que hace legible la tabla:** el color de la variación lo decide
`sentidoIndicadores`, que viene del backend. Un costo que sube es malo y unos
kilos que suben son buenos, y eso no se deduce del signo. La flecha acompaña al
color para que el sentido no dependa del color solo.

---

## W-021 — La contraseña SMTP nunca se precarga ni se reenvía

**Decisión (HU-33):** el campo de `smtp_pass` arranca vacío, con un placeholder
que dice «Ya configurada», y su botón de guardar está deshabilitado mientras no
se escriba algo.

**Por qué:** `GET /configuracion` devuelve `smtp_pass` como `********` — el
backend la enmascara del lado del servidor. Si la pantalla precargara ese valor
y lo reenviara al guardar cualquier otro campo del formulario, **guardaría ocho
asteriscos como contraseña** y dejaría el correo saliente roto sin que nadie se
entere hasta el próximo alta de usuario.

Cada campo se guarda por separado —`PUT /configuracion` recibe una clave y un
valor— así que el riesgo era real, no teórico.

---

## W-022 — El mapa usa `CircleMarker`, no los marcadores por defecto

**Decisión (HU-10, D-a):** Leaflet con tiles de OpenStreetMap, y círculos SVG
como marcadores.

**Por qué OSM:** sin API key, sin cuota y sin tarjeta de crédito. La historia
solo pide marcadores con color por estado y un popup.

**Por qué círculos:** los íconos PNG por defecto de Leaflet se rompen con los
bundlers —la ruta de la imagen se resuelve relativa al CSS y hay que parchearla
a mano—, y un círculo SVG además se colorea por estado sin generar una imagen
por color. El color nunca va solo: cada marcador lleva un tooltip con el estado
escrito y hay una referencia al pie.

**El caso que hoy es el normal:** en el seed del backend todas las coordenadas
son `null`. Un mapa vacío sin explicación se lee como un mapa roto, así que la
pantalla dice qué falta y enlaza a dónde se carga.

Leaflet se importa de forma diferida dentro de la propia pantalla: son ~156 kB
que solo hacen falta cuando hay algo que dibujar.

---

## W-023 — La búsqueda del centro de ayuda es local; los filtros, del backend

**Decisión (HU-36):** `tipo` y `modulo` se mandan al backend; el texto se filtra
en el cliente.

**Por qué:** el endpoint no ofrece búsqueda por texto, y el manual de una
empresa no llega a tener tantos artículos como para justificar pedirla. Los dos
filtros que el backend sí valida se le mandan a él —antes llegaban crudos y un
`?modulo=vendmia` con typo devolvía 200 con la lista vacía, o sea un centro de
ayuda sin artículos y nada que explicara por qué—.

---

## W-024 — La sesión se renueva sola con el refresh token

**Decisión (D-023 del backend):** el access token dura pocos minutos (15 por
defecto) y el cliente lo renueva en segundo plano con el refresh token, sin
pedir la contraseña.

- La sesión guardada en `localStorage` (`terravid.sesion`) suma
  `refreshToken` y `refreshExpiresAt`. Una sesión con el access vencido sigue
  siendo válida mientras el refresh no venza: el cliente la renueva antes del
  primer request.
- **Renovación anticipada:** si al access le queda menos de un minuto, el
  interceptor de request renueva antes de mandar.
- **Renovación ante 401:** si igual llega un 401, se renueva y se reintenta el
  request **una sola vez**. Si el token recién renovado también da 401, la
  sesión está muerta y se cierra (sin bucle).
- **Un único `/auth/refresh` en vuelo.** El backend rota el refresh token en
  cada uso y trata un segundo uso como robo: cinco consultas de React Query que
  reciben 401 a la vez esperan la misma renovación.
- **Varias pestañas.** Comparten el `localStorage`. Si dos renuevan a la vez,
  una pierde (el backend tiene 30 s de gracia y no castiga la sesión), y la que
  pierde toma el token que guardó la otra.
- **Sin conexión no se expulsa a nadie:** si la renovación falla por red, el
  request falla con su error y la sesión queda como estaba. Solo un 401 del
  propio `/auth/refresh` cierra la sesión.
- La renovación usa axios directo, no `cliente`: no lleva `Authorization` y no
  puede pasar por el interceptor que la dispara.
- `AuthContext` escucha las renovaciones de la propia pestaña
  (`alCambiarSesion`) y toma el usuario que devuelve el backend: un cambio de
  rol se ve sin recargar.

**Contra qué alternativa:** guardar el refresh token en una cookie `httpOnly`
lo protegería de un XSS, pero exige que backend y frontend compartan dominio (o
CORS con credenciales) y protección CSRF. Hoy la API vive en
`terravid-api.duckdns.org` y la Web en Firebase Hosting. Queda anotado para
cuando ambos estén bajo `terravid.com`.

**Configuración:** las duraciones las define el Propietario en
*Configuración → Parámetros → Sesiones* (5–60 minutos y 1–30 días). La pantalla
no habilita «Guardar» fuera de rango, y el backend lo valida igual.

---

## W-025 — Los permisos vienen del backend; la Web no tiene tabla propia

**Decisión (D-024 del backend):** qué muestra la Web a cada usuario se decide
con `user.permisos`, la lista que el backend manda en el login, en cada
renovación de sesión y en `GET /usuarios/me`. `puede(user, permiso)` consulta
esa lista.

**Por qué:** la tabla que tenía la Web (`PERMISOS`, rol → secciones) era una
copia a mano de los `@Roles` del backend y ya se había desfasado. Seguía
negándole al Auditor fincas, cuarteles y el mapa cuando el backend se los había
habilitado (D-021). Ahora la tabla vive en el backend, y un test de allá
verifica que coincide con los `@Roles` de cada handler.

**Detalles:**
- `src/auth/permisos.ts` solo enumera los nombres conocidos. Un permiso nuevo
  del backend que esta versión no conoce se descarta al validar la sesión: no
  la rompe.
- Las sesiones guardadas antes de este cambio no traen `permisos`: no pasan la
  validación y piden iniciar sesión otra vez (una sola vez, al desplegar).
- Los handlers de MSW siguen simulando los 403 por rol. La tabla espejo vive
  solo en `src/test/fixtures.ts` (`permisosDelRol`), porque ahí MSW hace de
  backend.
- El centro de ayuda muestra los tickets con `ayudaAdministracion` y no con
  `usuarios`, que se usaba como sustituto de "es Propietario".

---

## W-026 — El Administrador de plataforma tiene una sola pantalla: Empresas

**Decisión (D-025 del backend):** el rol `Administrador` ve *Empresas* y su
perfil, y nada más.

- `/empresas` lista las empresas cliente con su CUIT, usuarios activos y
  estado, y permite crearlas, activarlas y desactivarlas. Desactivar pide
  confirmación (`DialogoConfirmacion`) y avisa cuántos usuarios se quedan sin
  acceso.
- El alta pide el nombre y el email del primer Propietario, **sin
  contraseña**: el backend genera una temporal y le manda el correo de
  bienvenida. El CUIT se valida con el mismo formato que el backend
  (`30-12345678-9`).
- **La página de inicio depende de los permisos** (`Inicio` en
  `app-router.tsx`): con `dashboard` se ve el dashboard; sin él, el
  Administrador va a *Empresas*. Antes el índice mostraba el dashboard a
  cualquiera, y para el Administrador habría sido un 403.
- La campana de notificaciones solo se monta con el permiso `notificaciones`:
  si no, el Administrador consultaría cada minuto un endpoint que le responde
  403.

---

## W-027 — La credencial MQTT de un sensor se muestra una sola vez

**Decisión (D-026 del backend):** en *Telemetría → sensores*, el menú de cada
sensor activo tiene **Credencial MQTT**. El diálogo:

- **No genera nada al abrirse.** Generar invalida la credencial anterior y
  desconecta al nodo hasta que se cargue la nueva, así que pide un clic
  explícito y lo explica antes.
- Muestra broker, usuario, contraseña y tópico, con botones para copiar, y
  avisa que **la contraseña no se vuelve a mostrar**: el broker guarda solo su
  hash.
- Al cerrarse descarta la credencial; no queda en el estado de React ni en el
  caché de React Query (no es una consulta, es una llamada directa).

El contrato completo para el firmware está en `docs/IOT-MQTT.md` del backend.

---

## W-028 — Metas de cosecha en Campañas y ubicación en los historiales

**Decisión (D-027 del backend):**

- **Metas de cosecha:** en *Inteligencia → Campañas*, el menú de cada campaña
  (Propietario) tiene **Metas de cosecha**. Lista los cuarteles activos con lo
  cosechado en la campaña y un campo de meta en kg por cuartel; cada fila se
  guarda por separado. Vaciar el campo y guardar borra la meta. Es lo que usa
  la app de campo para el indicador de avance.
- **Ubicación:** los historiales de labores por cuartel y de pesajes muestran
  una columna *Ubicación* con un enlace a OpenStreetMap (el mismo proveedor que
  el mapa de fincas). Sin coordenadas —el teléfono no tenía GPS o el usuario no
  dio permiso— se muestra un guion.

---

## W-029 — Cobertura con piso de 70 % y Playwright por rol contra el backend real

**Decisión:**

- **Cobertura** (`npm run test:cov`, Vitest con `@vitest/coverage-v8`): piso
  de 70 % de líneas y sentencias configurado en `vite.config.ts`. El CI corre
  los tests con cobertura y falla si baja. Se excluyen los componentes de
  shadcn (`src/components/ui/`, código de terceros copiado), `main.tsx` y los
  datos de prueba. Hoy: **84,5 % de líneas**.
- **Playwright** (`npm run test:e2e`, carpeta `e2e/`): un camino feliz por rol
  contra el **backend real**, con la Web compilada y servida por
  `vite preview`:
  - Propietario: crea una finca y un cuartel en ella (el camino que pedía D-c).
  - Agrónomo: ve Operaciones y Telemetría, no ve Usuarios.
  - Capataz: entra a Vendimia y su dashboard carga (era el 500 de D-028 del
    backend).
  - Auditor: log de auditoría y fincas en modo lectura.
  - Administrador de plataforma: crea una empresa.

  Los usuarios de cada rol se crean por la API con la sesión del Propietario
  del seed, con un sufijo por corrida: no dependen de datos fijos.

**Por qué Playwright no corre en el CI de este repo:** necesita la API y
PostgreSQL. El CI del backend ya levanta ambos para sus e2e; sumar ahí la Web
es el paso siguiente si se quiere automatizar. El CI de la Web sí verifica que
las pruebas compilen (`npm run typecheck:e2e`).

**Cómo correrlo:**

```bash
# Backend/: base, migraciones, seed y API
docker compose up -d db && npm run migration:run && npm run seed && npm run start:dev
# Web/
npx playwright install chromium   # una sola vez
npm run test:e2e
```

---

## W-030 — La Web se despliega en el proyecto `terravid`, sin claves

**Contexto:** la Web estaba en el proyecto de Firebase `terravid-24041`, en otra
cuenta de Google que la VM y el backend (proyecto `terravid`). D-029 del
backend dejó anotado unificarlos; D-033 lo hace.

**Decisión:**

- La Web se publica en el sitio por defecto del proyecto `terravid`:
  **`https://terravid.web.app`**. `.firebaserc` apunta a `terravid`.
- El workflow de despliegue se autentica con **Workload Identity Federation**,
  con el mismo pool y proveedor que ya usa el backend, y la cuenta
  `despliegue-firebase`, que tiene solo `firebasehosting.admin` y
  `serviceusage.serviceUsageConsumer` y solo la pueden usar los repos Web y
  Mobile. Despliega con `firebase-tools` en vez de
  `FirebaseExtended/action-hosting-deploy`, porque esa acción exige una clave
  JSON.
- Se suma un health check contra la URL publicada, como ya tenía Mobile.
- `terravid-24041.web.app` responde con un **301** a la dirección nueva durante
  7 días; después se borra el proyecto viejo.

**Alternativa descartada:** una clave JSON nueva en un secret. La organización
de `terravid` prohíbe crear claves de cuentas de servicio
(`iam.disableServiceAccountKeyCreation`), y aunque no lo hiciera, una clave que
no vence es justo lo que WIF evita.

**Consecuencia:** el secret `FIREBASE_SERVICE_ACCOUNT_TERRAVID_24041` deja de
usarse y se puede borrar del repo.
