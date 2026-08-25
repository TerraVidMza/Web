# Plan de mejoras — Frontend Web

Auditoría del frontend completo y plan de trabajo. Complementa el [plan de adaptación al backend](PLAN-ADAPTACION-BACKEND.md): ese cubre *qué está roto contra la API*, este cubre *cómo está construida la aplicación*.

**Punto de partida, medido:** 54 archivos, **3.628 líneas** (de las cuales ~1.900 son componentes de shadcn sin modificar), **5 pantallas conectadas y 5 placeholders**, `npm run build` limpio, `npm run lint` con 5 warnings y 0 errores, bundle de **611 kB** en un solo chunk, **0 tests**, **0 workflows de CI**.

> **La métrica que importa:** el build pasa limpio y tres de las cinco pantallas conectadas están rotas. Un build verde que no dice nada sobre si la aplicación funciona es el problema central de este repo, y es lo que atacan W1 y W2.

---

## Estado de ejecución

> Actualizado al cerrar la Fase 0, la Fase 1 y la Fase 2. **Punto de llegada, medido:** `npm run build` limpio, `npm run lint` con 0 errores y 5 warnings, **64 tests en 13 archivos**, un workflow de CI, y el bundle repartido en chunks por ruta —el inicial pasó de **611 kB a 331 kB**—.

| Problema | Estado | Dónde quedó |
|---|---|---|
| **W1** La capa de API afirma en vez de validar | ✅ | `src/api/` con zod; el tipo sale del schema |
| **W2** Cero tests y cero CI | ✅ | Vitest + RTL + MSW con respuestas reales; `.github/workflows/ci.yml` |
| **W3** Permisos duplicados tres veces | ✅ | `src/auth/permisos.ts`, única copia; de ahí salen menú, rutas y botones |
| **W4** Sin primitivas de paginación | ✅ | `components/datos/tabla-paginada.tsx` y `paginacion.tsx` |
| **W5** Sin convención de carga/error/vacío | ✅ | `components/datos/estado-consulta.tsx`, que distingue vacío de vacío-por-filtro |
| **W6** Formularios sin reuso, validación divergente | ✅ | `components/formulario/use-formulario-api.ts` y `lib/campos.ts` |
| **W7** Sin navegación en mobile | ✅ | `<Sheet>` en `layouts/app-layout.tsx` |
| **W8** Accesibilidad sin verificar | ✅ | `jsx-a11y` en oxlint, `scope`/`caption` en tablas, `aria-live`, foco al primer error, salto al contenido |
| **W9** Un solo bundle de 611 kB | ✅ | `React.lazy` por ruta; chunk inicial de 331 kB |
| **W10** Modo oscuro inalcanzable | ✅ | `ThemeProvider` montado + toggle en el header |
| **W11** Sin validación de entorno ni configuración | ✅ | `config/env.ts` (falla al arrancar) y `context/configuracion-context.tsx` |
| **W12** Sesión frágil | ✅ | `auth/sesion.ts`: una clave, chequeo de `exp`, sync entre pestañas, `ErrorBoundary`, redirect post-login |

| Fase | Estado |
|---|---|
| **Fase 0** — Que lo que existe funcione | ✅ Cerrada |
| **Fase 1** — Cimientos (F1-1 … F1-7) | ✅ Cerrada |
| **Fase 2** — Calidad de producto (F2-1 … F2-6) | ✅ Cerrada |
| **Fase 3** — Los módulos | 🟠 Bloques 1 a 5 cerrados; 6 a 10 pendientes |

**Fase 3, detalle:**

| Orden | Bloque | Estado |
|---|---|---|
| 1 | Log de auditoría (HU-07) | ✅ |
| 2 | Notificaciones (HU-35) | ✅ |
| 3 | Perfil y contraseñas (HU-03, HU-04) | ✅ |
| 4 | Completar Fincas, Cuarteles y Usuarios (HU-05, 06, 08, 09, 11) | ✅ |
| 5 | Operaciones (HU-15, 16, 17) | ✅ |
| 6 | Vendimia (HU-23, 26, 27, 28) | ⬜ |
| 7 | Telemetría (HU-18, 20, 21, 22) | ⬜ |
| 8 | Inteligencia (HU-29, 30, 31) | ⬜ |
| 9 | Configuración y tablas maestras (HU-33, 34) | ⬜ |
| 10 | Ayuda (HU-36) y Mapa (HU-10) | ⬜ |

Las ocho decisiones de la §6 se tomaron adoptando la recomendación de cada una y quedaron registradas en [`DECISIONS.md`](DECISIONS.md).

---

## 1. Los 12 problemas sistémicos

Igual que en el backend, la mayoría de lo que falta **no es de una pantalla sino transversal**. Arreglar estos doce cierra defectos en todas las pantallas a la vez, incluidas las que todavía no existen. Ir pantalla por pantalla sale mucho más caro y deja el mismo agujero abierto en cada una nueva.

| # | Problema | Impacto |
|---|---|---|
| **W1** | **La capa de API afirma en vez de validar.** `api.get<Usuario[]>(...)` es una aserción: no comprueba nada en runtime, y el compilador la cree. Es la causa raíz de los 7 rompimientos del [plan de adaptación](PLAN-ADAPTACION-BACKEND.md): el listado de usuarios vacío, el dashboard en `NaN` y los decimales que llegan como string pasan los tres por un build verde. | Todas |
| **W2** | **Cero tests y cero CI.** No hay vitest, ni React Testing Library, ni MSW, ni Playwright, ni un `.github/workflows`. Nada impide que un PR rompa el login. Los tres bugs de la sección anterior habrían aparecido en el primer test que renderizara la pantalla contra una respuesta real de la API. | Todas |
| **W3** | **Los permisos están duplicados tres veces y ya divergen.** `NAV_ITEMS` en el layout, `RoleRoute` en el router, y los `@Roles` del backend. El menú le ofrece al Auditor cuatro secciones que le devuelven 403. | Todas |
| **W4** | **Sin primitivas de paginación,** con 8 endpoints paginados en el backend. Cada pantalla nueva va a reimplementar `page`/`pageSize`/`totalPages`, o —más probable— va a mostrar solo las primeras 20 filas sin decirlo. | HU-05, 07, 17, 20, 24, 27 |
| **W5** | **Sin convención de estados de carga, error y vacío.** Cada pantalla los reinventa: `isError` renderiza un `<p>` rojo sin botón de reintentar, los skeletons son `Array.from({length: 4})` copiado en tres archivos, y el estado vacío no distingue "no hay datos" de "el filtro no encontró nada" — que es exactamente cómo el bug del envelope (W1) pasó por un estado vacío convincente. | Todas |
| **W6** | **Formularios sin reuso y con validación divergente.** Cada diálogo define su schema de zod desde cero. La regla de contraseña del cliente es `min(8)`; la del backend es 8-72 **con letra y número**: `12345678` pasa acá y lo rechaza el servidor. La misma divergencia va a repetirse con hectáreas, año de implantación y latitud/longitud, que el backend valida y el cliente no. | HU-04, 05, 08, 09, 16 |
| **W7** | **Sin navegación en mobile.** El `<aside>` es `hidden md:flex` y el header de mobile solo tiene el logo y un botón de salir. **Abajo de 768 px la aplicación no tiene forma de cambiar de sección.** `sheet.tsx` —el drawer que resuelve exactamente esto— está instalado y sin usar. | Todas |
| **W8** | **Accesibilidad sin verificar.** El plugin `jsx-a11y` no está en la config de oxlint. Sin gestión de foco al abrir diálogos más allá de lo que da Radix, sin `aria-live` en los toasts propios, tablas sin `scope`/`caption`, y el único texto de error de login se anuncia con `role="alert"` (bien) mientras los de las tablas no se anuncian (mal). | Todas |
| **W9** | **Un solo bundle de 611 kB**, sin code splitting ni carga diferida por ruta. Con diez módulos más va a duplicarse: el usuario que entra al login descarga el módulo de vendimia, el de telemetría y los gráficos. | Todas |
| **W10** | **El modo oscuro está escrito y es inalcanzable.** `index.css:86` define la paleta `.dark` completa y `next-themes` es dependencia, pero **no hay `ThemeProvider` montado en ningún lado**: nada agrega la clase `dark` al `<html>`. `sonner.tsx` llama a `useTheme()` sin provider y recibe el default. Trabajo ya hecho que no se puede usar. | Todas |
| **W11** | **Sin validación de entorno ni límites de configuración.** `import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"` significa que un `.env` mal escrito en producción **apunta la app al localhost del usuario** y falla en runtime, no en el build. Y `formatCurrency` fija `ARS`/`es-AR` en código mientras el backend expone `moneda`, `unidades` y `zona_horaria` por empresa. | Todas |
| **W12** | **Sesión frágil.** Token y usuario viven en dos claves de `localStorage` que pueden desincronizarse; no se valida el `exp` del JWT al arrancar (una sesión vencida se ve autenticada hasta el primer 401); no hay sincronización entre pestañas (cerrar sesión en una deja la otra "adentro"); no hay `ErrorBoundary`, así que cualquier error de render deja la pantalla en blanco; y `ProtectedRoute` devuelve `null` mientras carga, lo que produce un parpadeo en cada recarga. Además el redirect post-login está muerto: el `from` de la ruta protegida se calcula y después `onSubmit` hace `navigate("/")`, así que **el usuario nunca vuelve a la página que quería**. | Todas |

---

## 2. Fase 0 — Que lo que existe funcione

Los siete rompimientos contra la API. **Están detallados con su evidencia en [PLAN-ADAPTACION-BACKEND.md](PLAN-ADAPTACION-BACKEND.md) §1** y no se repiten acá; el orden de ejecución es el de su §4.

Resumen: envelope paginado, `empresaId` rechazado en los bodies, dashboard como unión por rol, decimales como string, contraseña temporal sin pantalla, roles desalineados, y el 401 que recarga la página.

**Esta fase es bloqueante.** No tiene sentido construir el módulo de Vendimia sobre una capa de API que ya falla en cinco pantallas.

---

## 3. Fase 1 — Cimientos

Cada uno de estos habilita el resto. Se hacen una vez y los usan todos los módulos.

- **F1-1 — Capa de contrato con zod (W1).** `src/api/` con schemas por recurso, tipos derivados con `z.infer`, envelope paginado genérico y `z.coerce.number()` en todo decimal. Diseño y alcance en la §3 del plan de adaptación.
- **F1-2 — Tests y CI (W2).** Vitest + React Testing Library + **MSW**. MSW es la pieza importante: los handlers se escriben con **las respuestas reales de la API** —las que están transcriptas en el plan de adaptación—, así que un test que renderiza la pantalla de Usuarios contra el envelope real falla hoy. Más un workflow de GitHub Actions que corra `tsc -b`, `oxlint` y `vitest` en cada PR.
  > El mínimo útil no es "cobertura": son los caminos que duelen. Login y persistencia de sesión, guardas por rol, el envelope paginado, el submit de cada formulario contra la validación real del backend, y el render de cada rol en el dashboard.
- **F1-3 — Tabla de permisos única (W3).** Un `src/auth/permisos.ts` derivado de los `@Roles` del backend, del que salgan el menú, las rutas y los botones. Sigue siendo una copia de la verdad del backend, pero **una sola**, en un archivo cuyo único trabajo es estar al día.
- **F1-4 — Primitivas de datos (W4, W5).** `<TablaPaginada>` con el envelope del backend; un `<EstadoConsulta>` que resuelva carga/error/vacío con reintento y que distinga "sin datos" de "el filtro no encontró nada"; `<EstadoBadge>` con los enums del backend (`EstadoRemito`, `EstadoCuartel`, `EstadoPesaje`, `EstadoSync`, `EstadoAlerta`, `EstadoRecomendacion`) y sus etiquetas en castellano —hoy `estado: "en_cosecha"` llegaría crudo a la pantalla—.
- **F1-5 — Formularios (W6).** Un `useFormularioApi` que junte react-hook-form + zod + el toast de error, y los schemas de campos compartidos —`passwordSegura` **igual a la del backend**, `hectareas`, `anioImplantacion`, `latitud`/`longitud`— en un solo archivo, para que la validación del cliente no pueda ser más permisiva que la del servidor.
- **F1-6 — Sesión sólida (W12).** Una sola clave de `localStorage` para token+usuario, chequeo de `exp` al arrancar, `storage` listener para sincronizar pestañas, `ErrorBoundary` global, un esqueleto en vez de `null` mientras carga, y el redirect post-login que respete el `from`.
- **F1-7 — Entorno y formato (W11).** Un schema de zod sobre `import.meta.env` que **falle al arrancar** si `VITE_API_URL` no está (mejor un error explícito que un fallback silencioso a localhost), y los formateadores tomando `moneda`/`unidades`/`zona_horaria` de `GET /configuracion` con fallback a `es-AR`/`ARS`.

---

## 4. Fase 2 — Calidad de producto

- **F2-1 — Navegación mobile (W7).** El `<Sheet>` que ya está instalado, con el mismo `NAV_ITEMS` filtrado por permisos. Es la corrección más barata de la lista y hoy la app es inusable en un teléfono.
- **F2-2 — Accesibilidad (W8).** Sumar el plugin `jsx-a11y` a oxlint y arreglar lo que marque; foco al primer campo con error al enviar un formulario; `aria-live` en los avisos; `<caption>` y `scope` en las tablas; verificar contraste de la paleta en claro y oscuro.
- **F2-3 — Code splitting (W9).** `React.lazy` por ruta con `<Suspense>` y un skeleton de página. Objetivo: que el login no descargue el módulo de vendimia.
- **F2-4 — Modo oscuro (W10).** Montar `ThemeProvider` y un toggle en el layout. La paleta ya existe; es cablear lo que está escrito.
- **F2-5 — Cache y rendimiento.** Definir `staleTime` por tipo de dato (los catálogos cambian una vez al mes, las alertas cada minuto): hoy sin `staleTime` todo se considera obsoleto al instante y se refetchea en cada navegación. Y `keepPreviousData` en los listados paginados, para que cambiar de página no muestre un skeleton.
- **F2-6 — Documentación honesta.** El README de este repo dice que `/configuracion` está **"Conectada"** y es un `PlaceholderPage`. Es el mismo defecto que se acaba de corregir en el backend —documentación que contradice al código— y conviene arreglarlo antes de que la tabla crezca a 26 filas. De paso: `package.json` se llama `"app"`, y `date-fns` es dependencia sin usar.

---

## 5. Fase 3 — Los módulos

El inventario completo de las 26 HU de Web, con sus endpoints ya disponibles, está en la **§2 del [plan de adaptación](PLAN-ADAPTACION-BACKEND.md)**. El orden propuesto, y por qué:

| Orden | Bloque | Por qué acá |
|---|---|---|
| 1 | **Log de auditoría** (HU-07) | El Auditor es un rol completo **sin ninguna pantalla**: entra y no puede hacer nada. Y es un listado paginado con filtros, o sea el primer usuario real de las primitivas de F1-4. |
| 2 | **Notificaciones** (HU-35) | Transversal: la campana se ve desde toda la aplicación. El backend ya devuelve `noLeidas` para el badge. |
| 3 | **Perfil y contraseñas** (HU-03, HU-04) | Cierra el alta de usuarios por el camino recomendado, que hoy es inutilizable. |
| 4 | **Completar Fincas, Cuarteles y Usuarios** (HU-05, 06, 08, 09, 11) | Editar, dar de baja, cambiar rol, filtros y paginación: hoy las tres pantallas son solo "listar y crear". |
| 5 | **Operaciones** (HU-15, 16, 17) | Costeo, catálogos de insumos y tipos de labor con sus costos vigentes, e historial por cuartel. Es el bloque donde los decimales-string de B4 se vuelven dinero. |
| 6 | **Vendimia** (HU-23, 26, 27, 28) | El circuito de remitos —aprobar, rechazar con motivo, liquidación de bodega— es el flujo con más reglas de negocio del sistema y el que mejor se demuestra. |
| 7 | **Telemetría** (HU-18, 20, 21, 22) | Necesita decidir la librería de gráficos (`D-b`). |
| 8 | **Inteligencia** (HU-29, 30, 31) | Depende de que exista el ABM de campañas, que es entidad nueva sin pantalla en Figma. |
| 9 | **Configuración y tablas maestras** (HU-33, 34) | Con `smtp_pass` enmascarada del lado del servidor: la pantalla nunca la recibe. |
| 10 | **Ayuda** (HU-36) y **Mapa** (HU-10) | El mapa depende de `D-a` y de que haya lat/lng cargadas, que hoy son `null` en todos los registros del seed. |

---

## 6. Decisiones pendientes

No son bugs: son definiciones que faltan y que bloquean trabajo. Van con una recomendación cada una, pero la decisión es del equipo.

| # | Decisión | Recomendación | Bloquea |
|---|---|---|---|
| **D-a** | **Librería de mapas.** Google Maps (cuota y tarjeta de crédito), Leaflet (maduro, imperativo) o MapLibre (vectorial, moderno). | **Leaflet con `react-leaflet`** y tiles de OpenStreetMap: sin API key, sin costo, y HU-10 solo pide marcadores con color por estado y popup. | HU-10 |
| **D-b** | **Librería de gráficos.** | **Recharts**: declarativa, buena integración con shadcn, y las tres pantallas que la necesitan piden series de tiempo y barras, nada exótico. | HU-20, 29, 31 |
| **D-c** | **Alcance de los tests.** ¿Solo unitarios, o también end-to-end con Playwright? | **Vitest + RTL + MSW ahora; Playwright después**, con un único caminito feliz (login → crear finca → crear cuartel). Un e2e que cubra todo se vuelve lento y nadie lo corre. | F1-2 |
| **D-d** | **¿Web muestra lo que carga el Capataz?** Las labores y los pesajes se registran desde Mobile. ¿La oficina los ve en modo lectura? | **Sí, en modo lectura.** Es de donde sale el costeo, y HU-17 pone al Propietario y al Agrónomo como actores del historial. | HU-17, 24 |
| **D-e** | **Moneda y unidades:** ¿de `GET /configuracion` o fijas en código? | **De configuración**, con fallback. El backend ya expone las claves por empresa, y ponerlo después implica tocar cada pantalla que formatea plata. | F1-7 |
| **D-f** | **Paginación:** ¿controles de página o scroll infinito? | **Controles de página.** Es una app de oficina: se necesita "ir a la página 4" y saber cuántas filas hay en total. El scroll infinito pelea con eso. | F1-4 |
| **D-g** | **Las 4 HU de Web sin pantalla en Figma** (04, 17, 34, 35): ¿se diseñan primero o se diseñan en código? | **En código, con los componentes de shadcn**, y registrar la decisión. Las cuatro son listados y formularios estándar; esperar el diseño frena cuatro HU por algo que el design system ya resuelve. | HU-04, 17, 34, 35 |
| **D-h** | **Remito imprimible (HU-27):** ¿CSS de impresión en el cliente o PDF generado en el backend? | **CSS de impresión** (`@media print` sobre `GET /remitos/:id`, que ya trae cuartel, finca y detalle de pesajes). Un PDF del lado del servidor es un módulo nuevo en el backend para un requisito que el navegador ya cubre. | HU-27 |

---

## 7. Qué mirar primero

Si hay que elegir tres cosas y nada más:

1. **La capa de contrato (W1).** Es la que convierte "el build pasa" en información útil, y sin ella los arreglos de la Fase 0 se hacen dos veces.
2. **Tests con MSW (W2).** Los handlers se escriben con las respuestas reales que ya están transcriptas en el plan de adaptación, así que el primer test que se escriba **falla contra el código de hoy**. Eso es exactamente lo que se necesita de un test.
3. **La pantalla del Auditor (HU-07).** Es el único rol del sistema que hoy no puede hacer absolutamente nada, y es un listado paginado con filtros: barato, y de paso estrena las primitivas.

> Al cerrar cada ítem, actualizar la tabla de rutas del [`README.md`](../README.md) — que hoy declara `/configuracion` como "Conectada" siendo un placeholder. La documentación que miente cuesta más que la que falta.
