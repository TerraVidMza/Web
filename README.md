# TerraVid — Web

Frontend web de oficina del ERP agrícola TerraVid: dashboard, ABMs (fincas, cuarteles, usuarios), log de auditoría y notificaciones. Lo usan los cuatro roles —Propietario, Agrónomo, Capataz y Auditor— desde una computadora, cada uno con lo que su rol le permite, a diferencia de la app [`Mobile`](https://github.com/TerraVidMza/Mobile) (uso en campo, offline-first).

> **Alcance:** este repositorio contiene únicamente el **Frontend web**. El proyecto TerraVid se organiza en 4 repositorios dentro de la organización [TerraVidMza](https://github.com/TerraVidMza) en GitHub.

## Repositorios del proyecto

| Repo | Contenido |
|---|---|
| [`Backend`](https://github.com/TerraVidMza/Backend) | API REST — NestJS + TypeORM + PostgreSQL/PostGIS |
| [`Web`](https://github.com/TerraVidMza/Web) (este repo) | Frontend web de oficina |
| [`Mobile`](https://github.com/TerraVidMza/Mobile) | App móvil offline-first para campo (React Native / Expo) |
| [`IoTSensor`](https://github.com/TerraVidMza/IoTSensor) | Firmware de los nodos de telemetría (ESP32 y ESP8266) |

> Cómo se comunican estos 4 componentes entre sí está detallado en [`docs/ARCHITECTURE.md` del repo Backend](https://github.com/TerraVidMza/Backend/blob/develop/docs/ARCHITECTURE.md).

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS 4** + **shadcn/ui** (Radix UI) para componentes
- **TanStack Query** para estado de servidor / cache de datos remotos
- **React Router** para ruteo, con carga diferida por ruta
- **zod** para validar **las respuestas del backend** y los formularios
- **react-hook-form** para formularios
- **Axios** como cliente HTTP contra el Backend (NestJS)
- **Vitest + React Testing Library + MSW** para tests
- **Recharts** para los gráficos de series de tiempo
- **Leaflet** + OpenStreetMap para el mapa
- **Oxlint** para lint (en vez de ESLint)

## Requisitos

- **Node.js 22.22.2+ o 24.15+** (la versión que usa el CI está en [`.nvmrc`](.nvmrc); con `nvm use` alcanza).
  El piso lo fija `jsdom`, que se usa en los tests y no soporta Node 20. `npm ci` corre con `engine-strict`, así que una versión incorrecta falla al instalar en vez de aparecer más tarde como un test roto.
- El [`Backend`](https://github.com/TerraVidMza/Backend) corriendo (local o remoto) para que la app tenga con qué autenticarse y consumir datos.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # ajustar VITE_API_URL si el backend no corre en localhost:3000
npm run dev
```

La app queda disponible en `http://localhost:5173`.

> `VITE_API_URL` es **obligatoria**: la aplicación valida el entorno al arrancar y falla con un error explícito si falta, en vez de caer en silencio al localhost de quien abra la página.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `tsc -b` + build de producción |
| `npm run lint` | Oxlint (incluye `jsx-a11y`) |
| `npm run test` | Suite de tests (Vitest) |
| `npm run test:watch` | Tests en modo watch |

Los tres primeros son lo que corre [el workflow de CI](.github/workflows/ci.yml) en cada PR.

## Despliegue (Producción)

El frontend se despliega automáticamente en **Google Cloud (Firebase Hosting)**.
La integración continua y entrega continua (CI/CD) está configurada mediante GitHub Actions:

- Al hacer un *push* a la rama `main` o al activar el workflow manualmente, se ejecuta [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- El workflow compila la aplicación para producción inyectando la variable `VITE_API_URL` (gestión de URLs del backend mediante GitHub Secrets).
- Finalmente, se despliega a Firebase con Workload Identity Federation: sin claves guardadas en el repositorio, con la cuenta `despliegue-firebase`, que solo puede desplegar Hosting ([W-030](docs/DECISIONS.md)).

La configuración de enrutamiento y servidor estático se encuentra en `firebase.json`.

Producción: `https://terravid.web.app`, en el proyecto `terravid`, el mismo de Google Cloud donde corren la VM y el backend. La PWA de Mobile vive en el mismo proyecto, en otro sitio de Hosting (ver el README de Mobile). Si cambia el dominio de la Web, hay que agregarlo a `CORS_ORIGIN` y `APP_URL` del backend (D-029 y D-033 del repo Backend). La dirección vieja, `terravid-24041.web.app`, redirige a la nueva hasta que se borre ese proyecto.

## Cómo está organizado

```
src/
  api/            # La frontera con el backend, validada con zod
    client.ts       axios + manejo del 401 sin recargar la página
    request.ts      get/post/patch que validan la respuesta contra un schema
    schemas/        Un schema por recurso; los tipos salen de acá (z.infer)
    endpoints/      Una función por endpoint, ya validada
  auth/           permisos.ts (tabla única de roles) y sesion.ts (localStorage + exp del JWT)
  components/
    datos/          TablaPaginada, EstadoConsulta, EstadoBadge
    formulario/     useFormularioApi
    ui/             shadcn/ui
  config/env.ts   Validación del entorno; falla al arrancar si falta algo
  features/       Un directorio por módulo: pantallas + hooks juntos
  lib/            campos.ts (validaciones compartidas), format.ts, cache.ts
  test/           Setup de MSW, handlers con respuestas reales de la API y fixtures
```

Agrupar por módulo en vez de por tipo de archivo hace que agregar Vendimia sea un directorio nuevo y no ediciones en cinco carpetas.

## Rutas implementadas

| Ruta | Página | Estado |
|---|---|---|
| `/login` | Login | Conectada — con enlace a recuperar contraseña |
| `/olvide-mi-password` | Recuperar contraseña | Conectada — `POST /auth/forgot-password` (HU-03) |
| `/reset-password?token=…` | Definir contraseña | Conectada — destino de los correos de alta y de recuperación |
| `/cambiar-password` | Cambiar contraseña | Conectada — obligatoria si la contraseña es temporal (HU-05) |
| `/` | Dashboard | Conectada — **un panel distinto por rol** (HU-32) |
| `/perfil` | Mi perfil | Conectada — `GET/PATCH /usuarios/me` (HU-04) |
| `/fincas` | Fincas | Conectada — ABM completo (HU-08) |
| `/fincas/:fincaId/cuarteles` | Cuarteles de una finca | Conectada — ABM completo (HU-09) |
| `/cuarteles` | Buscar cuarteles | Conectada — búsqueda en toda la empresa, con filtros y orden (HU-11) |
| `/empresas` (Administrador de plataforma) | Empresas | Conectada — alta de empresa con su primer Propietario, activar y desactivar (D-025 del backend, W-026) |
| `/usuarios` (Propietario) | Usuarios | Conectada — ABM completo con cambio de rol (HU-05, HU-06) |
| `/auditoria` (Propietario, Auditor) | Log de auditoría | Conectada — paginada, con filtros (HU-07) |
| `/notificaciones` | Notificaciones | Conectada — campana con badge y panel (HU-35) |
| `/operaciones` (Propietario, Agrónomo) | Costeo por cuartel | Conectada — costo, ingresos y margen bruto (HU-15) |
| `/operaciones/insumos` | Insumos | Conectada — ABM con versionado de costos (HU-16) |
| `/operaciones/tipos-labor` | Tipos de labor | Conectada — ABM con versionado de costos (HU-16) |
| `/cuarteles/:cuartelId/historial` | Historial de operaciones | Conectada — paginado; también accesible al Auditor (HU-17) |
| `/telemetria` (Propietario, Agrónomo) | Sensores | Conectada — con la última lectura de cada nodo (HU-18) |
| `/telemetria/alertas` | Alertas de umbral | Conectada — bandeja de pendientes (HU-22) |
| `/sensores/:sensorId` | Serie del sensor | Conectada — gráfico con banda min-máx, vista de tabla y umbrales (HU-20, HU-21) |
| `/vendimia` (Propietario, Agrónomo, Capataz) | Remitos | Conectada — bandeja de aprobación, aprobar y rechazar con motivo (HU-27) |
| `/vendimia/cosecha` | Estado de cosecha | Conectada — avance por cuartel y rendimiento (HU-28) |
| `/vendimia/cuadrillas` | Cuadrillas | Conectada — ABM con versionado de tarifas (HU-23) |
| `/remitos/:remitoId` | Detalle del remito | Conectada — imprimible, con la liquidación de bodega (HU-27) |
| `/cuarteles/:cuartelId/pesajes` | Pesajes del cuartel | Conectada — solo lectura (HU-26) |
| `/configuracion` (Propietario) | Parámetros | Conectada — organización, formato regional y SMTP (HU-33) |
| `/configuracion/catalogos` | Tablas maestras | Conectada — ABM de los cuatro catálogos (HU-34) |
| `/inteligencia` (Propietario, Agrónomo) | Comparar campañas | Conectada — indicadores y variación con su sentido (HU-31) |
| `/inteligencia/correlacion` | Correlación | Conectada — sensor contra costo, en gráficos separados (HU-29) |
| `/inteligencia/recomendaciones` | Recomendaciones | Conectada — resolver como aplicada o descartada (HU-30) |
| `/inteligencia/campanias` | Campañas | Conectada — ABM del corte temporal del sistema (D-014) |
| `/mapa` | Mapa | Conectada — fincas y cuarteles con color por estado (HU-10) |
| `/ayuda` | Manual y FAQ | Conectada — con búsqueda y filtros (HU-36) |
| `/ayuda/soporte` | Pedir ayuda | Conectada — ticket de soporte (HU-36) |

El acceso por rol **lo define el backend**: los permisos llegan con la sesión (`user.permisos`, D-024 del backend) y de ahí salen el menú, las guardas de ruta y los botones. La Web no tiene tabla propia ([W-025](docs/DECISIONS.md)); [`src/auth/permisos.ts`](src/auth/permisos.ts) solo enumera los nombres conocidos.

## Qué falta

**Las 26 HU de Web están implementadas.** Cobertura de los tests de componente: 84 % de líneas, con piso de 70 % en el CI (`npm run test:cov`). Lo que queda son las decisiones que el
plan de mejoras dejó anotadas para después:

- ~~**Playwright** (D-c)~~ — hecho ([W-029](docs/DECISIONS.md)): un camino feliz por rol contra el backend real, con `npm run test:e2e`.
- **Contraste de la paleta base.** Los colores que agregamos —gráficos,
  insignias de estado— están validados contra las superficies reales de la
  aplicación en modo claro y oscuro. Los tokens heredados de shadcn no se
  auditaron.
- **Coordenadas.** El mapa funciona, pero en el seed del backend todas las
  latitudes y longitudes son `null`, así que hasta que se carguen muestra el
  estado vacío explicándolo.

Los dos límites del backend que figuraban acá ya están resueltos: el formato regional llega a todos los roles por `GET /configuracion/preferencias` ([W-004](docs/DECISIONS.md)) y el Auditor lee fincas y cuarteles ([W-011](docs/DECISIONS.md), D-021 del backend).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/PLAN-ADAPTACION-BACKEND.md`](docs/PLAN-ADAPTACION-BACKEND.md) | Qué había que cambiar para funcionar contra el backend actual, verificado contra la API corriendo. Incluye el inventario de endpoints disponibles por HU. |
| [`docs/PLAN-MEJORAS.md`](docs/PLAN-MEJORAS.md) | Auditoría del frontend, los 12 problemas transversales y las fases de trabajo. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decisiones tomadas en este repositorio, con su alternativa descartada y el motivo. |

## Contribuir

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para la política de branching (Gitflow) del proyecto.
