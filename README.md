# TerraVid — Web

Frontend web de oficina del ERP agrícola TerraVid: dashboard, ABMs (fincas, cuarteles, usuarios), log de auditoría y notificaciones. Pensado para uso del Propietario, el Agrónomo y el Auditor desde una computadora, a diferencia de la app [`Mobile`](https://github.com/TerraVidMza/Mobile) (uso en campo, offline-first).

> **Alcance:** este repositorio contiene únicamente el **Frontend web**. El proyecto TerraVid se organiza en 4 repositorios dentro de la organización [TerraVidMza](https://github.com/TerraVidMza) en GitHub.

## Repositorios del proyecto

| Repo | Contenido |
|---|---|
| [`Backend`](https://github.com/TerraVidMza/Backend) | API REST — NestJS + TypeORM + PostgreSQL/PostGIS |
| [`Web`](https://github.com/TerraVidMza/Web) (este repo) | Frontend web de oficina |
| [`Mobile`](https://github.com/TerraVidMza/Mobile) | App móvil offline-first para campo (React Native / Expo) |
| [`IoTSensor`](https://github.com/TerraVidMza/IoTSensor) | Firmware de los nodos de telemetría (ESP32) |

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
| `/usuarios` (Propietario) | Usuarios | Conectada — ABM completo con cambio de rol (HU-05, HU-06) |
| `/auditoria` (Propietario, Auditor) | Log de auditoría | Conectada — paginada, con filtros (HU-07) |
| `/notificaciones` | Notificaciones | Conectada — campana con badge y panel (HU-35) |
| `/operaciones` (Propietario, Agrónomo) | Operaciones | Placeholder — pendiente conectar a labores/insumos/costos |
| `/telemetria` (Propietario, Agrónomo) | Telemetría IoT | Placeholder — pendiente conectar a sensores/lecturas/alertas |
| `/vendimia` (Propietario, Agrónomo, Capataz) | Vendimia | Placeholder — pendiente conectar a cuadrillas/pesajes/remitos |
| `/configuracion` (Propietario) | Configuración | Placeholder — pendiente conectar a `GET/PUT /configuracion` |
| `/ayuda` | Ayuda | Placeholder — pendiente manual/FAQs |

El acceso por rol sale de una sola tabla, [`src/auth/permisos.ts`](src/auth/permisos.ts), derivada de los `@Roles` reales del backend. De ahí salen el menú, las guardas de ruta y los botones: no hay una segunda lista que pueda divergir.

## Qué falta

Los bloques 5 a 10 de la Fase 3 del plan de mejoras: Operaciones (HU-15, 16, 17), Vendimia (23, 26, 27, 28), Telemetría (18, 20, 21, 22), Inteligencia agronómica (29, 30, 31), Campañas (31), Configuración y tablas maestras (33, 34), Ayuda (36) y Mapa (10). Los cimientos que necesitan —capa de contrato, primitivas de tabla y formulario, permisos, tests— ya están.

Dos límites que vienen del backend y conviene tener presentes:

- **Las fincas dadas de baja no se pueden listar.** `GET /fincas` filtra por `activa: true` y no acepta un parámetro para incluirlas, así que la baja es de ida. Los cuarteles sí: la búsqueda de HU-11 los muestra con el filtro de estado.
- **`GET /configuracion` es solo del Propietario**, así que los demás roles ven la moneda y las unidades por defecto. Ver [`docs/DECISIONS.md`](docs/DECISIONS.md), W-004.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/PLAN-ADAPTACION-BACKEND.md`](docs/PLAN-ADAPTACION-BACKEND.md) | Qué había que cambiar para funcionar contra el backend actual, verificado contra la API corriendo. Incluye el inventario de endpoints disponibles por HU. |
| [`docs/PLAN-MEJORAS.md`](docs/PLAN-MEJORAS.md) | Auditoría del frontend, los 12 problemas transversales y las fases de trabajo. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decisiones tomadas en este repositorio, con su alternativa descartada y el motivo. |

## Contribuir

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para la política de branching (Gitflow) del proyecto.
