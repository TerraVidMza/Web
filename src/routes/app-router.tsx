import { Suspense, lazy } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import { puede } from "@/auth/permisos"
import { AppLayout } from "@/layouts/app-layout"
import { ProtectedRoute, RoleRoute } from "./protected-route"
import { EsqueletoDePagina } from "./esqueleto-de-pagina"

/**
 * Una ruta, un chunk (F2-3).
 *
 * El bundle era **un solo archivo de 611 kB**: quien abría el login descargaba
 * también vendimia, telemetría y el resto. Con diez módulos más eso se duplica,
 * y el costo lo paga la primera pantalla, que es la única que todos ven.
 *
 * El login y el layout **no** van diferidos a propósito: son lo primero que se
 * pinta, y diferirlos cambia una descarga grande por dos idas y vueltas antes
 * de mostrar algo.
 */
import { LoginPage } from "@/features/auth/login-page"

const OlvideMiPasswordPage = lazy(() =>
  import("@/features/auth/olvide-mi-password-page").then((m) => ({
    default: m.OlvideMiPasswordPage,
  }))
)
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/reset-password-page").then((m) => ({ default: m.ResetPasswordPage }))
)
const CambiarPasswordPage = lazy(() =>
  import("@/features/auth/cambiar-password-page").then((m) => ({ default: m.CambiarPasswordPage }))
)
const DashboardPage = lazy(() =>
  import("@/features/dashboard/dashboard-page").then((m) => ({ default: m.DashboardPage }))
)
const FincasPage = lazy(() =>
  import("@/features/fincas/fincas-page").then((m) => ({ default: m.FincasPage }))
)
const CuartelesPage = lazy(() =>
  import("@/features/cuarteles/cuarteles-page").then((m) => ({ default: m.CuartelesPage }))
)
const BuscarCuartelesPage = lazy(() =>
  import("@/features/cuarteles/buscar-cuarteles-page").then((m) => ({
    default: m.BuscarCuartelesPage,
  }))
)
const EmpresasPage = lazy(() =>
  import("@/features/empresas/empresas-page").then((m) => ({ default: m.EmpresasPage }))
)
const UsuariosPage = lazy(() =>
  import("@/features/usuarios/usuarios-page").then((m) => ({ default: m.UsuariosPage }))
)
const AuditoriaPage = lazy(() =>
  import("@/features/auditoria/auditoria-page").then((m) => ({ default: m.AuditoriaPage }))
)
const NotificacionesPage = lazy(() =>
  import("@/features/notificaciones/notificaciones-page").then((m) => ({
    default: m.NotificacionesPage,
  }))
)
const PerfilPage = lazy(() =>
  import("@/features/perfil/perfil-page").then((m) => ({ default: m.PerfilPage }))
)
const OperacionesLayout = lazy(() =>
  import("@/features/operaciones/operaciones-layout").then((m) => ({
    default: m.OperacionesLayout,
  }))
)
const CosteoPage = lazy(() =>
  import("@/features/operaciones/costeo/costeo-page").then((m) => ({ default: m.CosteoPage }))
)
const InsumosPage = lazy(() =>
  import("@/features/operaciones/insumos-page").then((m) => ({ default: m.InsumosPage }))
)
const TiposLaborPage = lazy(() =>
  import("@/features/operaciones/tipos-labor-page").then((m) => ({ default: m.TiposLaborPage }))
)
const HistorialPage = lazy(() =>
  import("@/features/operaciones/historial/historial-page").then((m) => ({
    default: m.HistorialPage,
  }))
)
const TelemetriaLayout = lazy(() =>
  import("@/features/telemetria/telemetria-layout").then((m) => ({
    default: m.TelemetriaLayout,
  }))
)
const SensoresPage = lazy(() =>
  import("@/features/telemetria/sensores-page").then((m) => ({ default: m.SensoresPage }))
)
const SensorDetallePage = lazy(() =>
  import("@/features/telemetria/sensor-detalle-page").then((m) => ({
    default: m.SensorDetallePage,
  }))
)
const AlertasPage = lazy(() =>
  import("@/features/telemetria/alertas-page").then((m) => ({ default: m.AlertasPage }))
)
const InteligenciaLayout = lazy(() =>
  import("@/features/inteligencia/inteligencia-layout").then((m) => ({
    default: m.InteligenciaLayout,
  }))
)
const ComparacionPage = lazy(() =>
  import("@/features/inteligencia/comparacion-page").then((m) => ({
    default: m.ComparacionPage,
  }))
)
const CorrelacionPage = lazy(() =>
  import("@/features/inteligencia/correlacion-page").then((m) => ({
    default: m.CorrelacionPage,
  }))
)
const RecomendacionesPage = lazy(() =>
  import("@/features/inteligencia/recomendaciones-page").then((m) => ({
    default: m.RecomendacionesPage,
  }))
)
const CampaniasPage = lazy(() =>
  import("@/features/inteligencia/campanias-page").then((m) => ({ default: m.CampaniasPage }))
)
const VendimiaLayout = lazy(() =>
  import("@/features/vendimia/vendimia-layout").then((m) => ({ default: m.VendimiaLayout }))
)
const RemitosPage = lazy(() =>
  import("@/features/vendimia/remitos-page").then((m) => ({ default: m.RemitosPage }))
)
const RemitoDetallePage = lazy(() =>
  import("@/features/vendimia/remito-detalle-page").then((m) => ({
    default: m.RemitoDetallePage,
  }))
)
const CosechaPage = lazy(() =>
  import("@/features/vendimia/cosecha-page").then((m) => ({ default: m.CosechaPage }))
)
const CuadrillasPage = lazy(() =>
  import("@/features/vendimia/cuadrillas-page").then((m) => ({ default: m.CuadrillasPage }))
)
const PesajesPage = lazy(() =>
  import("@/features/vendimia/pesajes-page").then((m) => ({ default: m.PesajesPage }))
)
const ConfiguracionLayout = lazy(() =>
  import("@/features/configuracion/configuracion-layout").then((m) => ({
    default: m.ConfiguracionLayout,
  }))
)
const ParametrosPage = lazy(() =>
  import("@/features/configuracion/parametros-page").then((m) => ({
    default: m.ParametrosPage,
  }))
)
const TablasMaestrasPage = lazy(() =>
  import("@/features/configuracion/tablas-maestras-page").then((m) => ({
    default: m.TablasMaestrasPage,
  }))
)
const AyudaLayout = lazy(() =>
  import("@/features/ayuda/ayuda-layout").then((m) => ({ default: m.AyudaLayout }))
)
const ManualPage = lazy(() =>
  import("@/features/ayuda/manual-page").then((m) => ({ default: m.ManualPage }))
)
const SoportePage = lazy(() =>
  import("@/features/ayuda/soporte-page").then((m) => ({ default: m.SoportePage }))
)
const MapaPage = lazy(() =>
  import("@/features/mapa/mapa-page").then((m) => ({ default: m.MapaPage }))
)
const NotFoundPage = lazy(() =>
  import("@/features/not-found/not-found-page").then((m) => ({ default: m.NotFoundPage }))
)

/**
 * La página de inicio depende de lo que el usuario puede hacer: el
 * Administrador de plataforma no tiene dashboard (D-025 del backend) y su
 * pantalla es la de empresas.
 */
function Inicio() {
  const { user } = useAuth()
  if (puede(user, "dashboard")) return <DashboardPage />
  return <Navigate to={puede(user, "empresas") ? "/empresas" : "/perfil"} replace />
}

export function AppRouter() {
  return (
    <Suspense fallback={<EsqueletoDePagina />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/olvide-mi-password" element={<OlvideMiPasswordPage />} />
        {/* La ruta la fijan los correos que manda el backend:
            `${APP_URL}/reset-password?token=...`. No se puede renombrar sin
            cambiar también `MailService`. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          {/* Fuera del layout: mientras la contraseña sea temporal no hay
              navegación posible, y mostrar el menú invitaría a esquivarla. */}
          <Route path="/cambiar-password" element={<CambiarPasswordPage />} />

          <Route element={<AppLayout />}>
            <Route index element={<Inicio />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="notificaciones" element={<NotificacionesPage />} />
            <Route element={<RoleRoute permiso="manual" />}>
              <Route path="ayuda" element={<AyudaLayout />}>
                <Route index element={<ManualPage />} />
                <Route element={<RoleRoute permiso="ayuda" />}>
                  <Route path="soporte" element={<SoportePage />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RoleRoute permiso="fincas" />}>
              <Route path="fincas" element={<FincasPage />} />
              <Route path="fincas/:fincaId/cuarteles" element={<CuartelesPage />} />
              {/* Los cuarteles de una finca y la búsqueda en toda la empresa
                  son dos endpoints distintos del backend, y por eso dos rutas
                  distintas: `/cuarteles` es HU-11. */}
              <Route path="cuarteles" element={<BuscarCuartelesPage />} />
              <Route path="mapa" element={<MapaPage />} />
            </Route>

            <Route element={<RoleRoute permiso="operaciones" />}>
              <Route path="operaciones" element={<OperacionesLayout />}>
                <Route index element={<CosteoPage />} />
                <Route path="insumos" element={<InsumosPage />} />
                <Route path="tipos-labor" element={<TiposLaborPage />} />
              </Route>
            </Route>

            {/*
              El historial por cuartel tiene su propio permiso: es el único
              recurso de negocio que HU-17 le concede al Auditor, y el resto de
              Operaciones —que son datos económicos— no.
            */}
            <Route element={<RoleRoute permiso="historialLabores" />}>
              <Route path="cuarteles/:cuartelId/historial" element={<HistorialPage />} />
            </Route>

            <Route element={<RoleRoute permiso="telemetria" />}>
              <Route path="telemetria" element={<TelemetriaLayout />}>
                <Route index element={<SensoresPage />} />
                <Route path="alertas" element={<AlertasPage />} />
              </Route>
              {/* Fuera del layout: la serie y sus umbrales son una pantalla de
                  análisis, y las pestañas de la sección no aportan ahí. */}
              <Route path="sensores/:sensorId" element={<SensorDetallePage />} />
            </Route>

            <Route element={<RoleRoute permiso="vendimia" />}>
              <Route path="vendimia" element={<VendimiaLayout />}>
                <Route index element={<RemitosPage />} />
                <Route path="cosecha" element={<CosechaPage />} />
                <Route path="cuadrillas" element={<CuadrillasPage />} />
              </Route>
              {/* Fuera del layout: el detalle del remito es imprimible, y las
                  pestañas no tienen sentido en una hoja. */}
              <Route path="remitos/:remitoId" element={<RemitoDetallePage />} />
              <Route path="cuarteles/:cuartelId/pesajes" element={<PesajesPage />} />
            </Route>

            {/* Cruza costos con telemetria: `@Roles(P, A)` a nivel de clase
                en el controller. Campanias es lectura para todos, pero vive
                aca porque su unico consumidor de pantalla es HU-31. */}
            <Route element={<RoleRoute permiso="inteligencia" />}>
              <Route path="inteligencia" element={<InteligenciaLayout />}>
                <Route index element={<ComparacionPage />} />
                <Route path="correlacion" element={<CorrelacionPage />} />
                <Route path="recomendaciones" element={<RecomendacionesPage />} />
                <Route path="campanias" element={<CampaniasPage />} />
              </Route>
            </Route>

            <Route element={<RoleRoute permiso="logAuditoria" />}>
              <Route path="auditoria" element={<AuditoriaPage />} />
            </Route>

            <Route element={<RoleRoute permiso="empresas" />}>
              <Route path="empresas" element={<EmpresasPage />} />
            </Route>
            <Route element={<RoleRoute permiso="usuarios" />}>
              <Route path="usuarios" element={<UsuariosPage />} />
            </Route>

            <Route element={<RoleRoute permiso="configuracion" />}>
              <Route path="configuracion" element={<ConfiguracionLayout />}>
                <Route index element={<ParametrosPage />} />
                <Route path="catalogos" element={<TablasMaestrasPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
