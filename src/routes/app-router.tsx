import { Suspense, lazy } from "react"
import { Route, Routes } from "react-router-dom"
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
const TelemetriaPage = lazy(() =>
  import("@/features/telemetria/telemetria-page").then((m) => ({ default: m.TelemetriaPage }))
)
const VendimiaPage = lazy(() =>
  import("@/features/vendimia/vendimia-page").then((m) => ({ default: m.VendimiaPage }))
)
const ConfiguracionPage = lazy(() =>
  import("@/features/configuracion/configuracion-page").then((m) => ({
    default: m.ConfiguracionPage,
  }))
)
const AyudaPage = lazy(() =>
  import("@/features/ayuda/ayuda-page").then((m) => ({ default: m.AyudaPage }))
)
const NotFoundPage = lazy(() =>
  import("@/features/not-found/not-found-page").then((m) => ({ default: m.NotFoundPage }))
)

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
            <Route index element={<DashboardPage />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="notificaciones" element={<NotificacionesPage />} />
            <Route path="ayuda" element={<AyudaPage />} />

            <Route element={<RoleRoute permiso="fincas" />}>
              <Route path="fincas" element={<FincasPage />} />
              <Route path="fincas/:fincaId/cuarteles" element={<CuartelesPage />} />
              {/* Los cuarteles de una finca y la búsqueda en toda la empresa
                  son dos endpoints distintos del backend, y por eso dos rutas
                  distintas: `/cuarteles` es HU-11. */}
              <Route path="cuarteles" element={<BuscarCuartelesPage />} />
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
              <Route path="telemetria" element={<TelemetriaPage />} />
            </Route>

            <Route element={<RoleRoute permiso="vendimia" />}>
              <Route path="vendimia" element={<VendimiaPage />} />
            </Route>

            <Route element={<RoleRoute permiso="logAuditoria" />}>
              <Route path="auditoria" element={<AuditoriaPage />} />
            </Route>

            <Route element={<RoleRoute permiso="usuarios" />}>
              <Route path="usuarios" element={<UsuariosPage />} />
            </Route>

            <Route element={<RoleRoute permiso="configuracion" />}>
              <Route path="configuracion" element={<ConfiguracionPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
