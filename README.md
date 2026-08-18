# TerraVid — Web

Frontend web de oficina del ERP agrícola TerraVid: dashboard, ABMs (fincas, cuarteles, usuarios) y configuración. Pensado para uso del Propietario y el Agrónomo desde una computadora, a diferencia de la app [`Mobile`](https://github.com/TerraVidMza/Mobile) (uso en campo, offline-first).

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
- **React Router** para ruteo
- **react-hook-form + zod** para formularios y validación
- **Axios** como cliente HTTP contra el Backend (NestJS)
- **Oxlint** para lint (en vez de ESLint)

## Requisitos

- Node.js 20+
- El [`Backend`](https://github.com/TerraVidMza/Backend) corriendo (local o remoto) para que la app tenga con qué autenticarse y consumir datos.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # ajustar VITE_API_URL si el backend no corre en localhost:3000
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Rutas implementadas (primera entrega)

| Ruta | Página | Estado |
|---|---|---|
| `/login` | Login | Conectada al Backend |
| `/` | Dashboard | Conectada — indicadores clave |
| `/fincas` | Fincas | Conectada — ABM |
| `/fincas/:fincaId/cuarteles` | Cuarteles | Conectada — ABM |
| `/usuarios` (solo Propietario) | Usuarios | Conectada — ABM |
| `/configuracion` (solo Propietario) | Configuración | Conectada |
| `/operaciones` | Operaciones | Placeholder — pendiente conectar a labores/insumos/costos |
| `/telemetria` | Telemetría IoT | Placeholder — pendiente conectar a sensores/lecturas/alertas |
| `/vendimia` | Vendimia | Placeholder — pendiente conectar a cuadrillas/pesajes/remitos |
| `/ayuda` | Ayuda | Placeholder — pendiente manual/FAQs |

El acceso por rol se controla en `src/routes/protected-route.tsx` (`ProtectedRoute` exige sesión; `RoleRoute` restringe por rol).

## Contribuir

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para la política de branching (Gitflow) del proyecto.
