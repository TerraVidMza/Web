import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/layouts/app-layout"
import { ProtectedRoute, RoleRoute } from "./protected-route"
import { LoginPage } from "@/pages/auth/login-page"
import { DashboardPage } from "@/pages/dashboard/dashboard-page"
import { FincasPage } from "@/pages/fincas/fincas-page"
import { CuartelesPage } from "@/pages/cuarteles/cuarteles-page"
import { OperacionesPage } from "@/pages/operaciones/operaciones-page"
import { TelemetriaPage } from "@/pages/telemetria/telemetria-page"
import { VendimiaPage } from "@/pages/vendimia/vendimia-page"
import { UsuariosPage } from "@/pages/usuarios/usuarios-page"
import { ConfiguracionPage } from "@/pages/configuracion/configuracion-page"
import { AyudaPage } from "@/pages/ayuda/ayuda-page"
import { NotFoundPage } from "@/pages/not-found/not-found-page"
import { RolNombre } from "@/types/auth"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="fincas" element={<FincasPage />} />
            <Route path="fincas/:fincaId/cuarteles" element={<CuartelesPage />} />
            <Route path="operaciones" element={<OperacionesPage />} />
            <Route path="telemetria" element={<TelemetriaPage />} />
            <Route path="vendimia" element={<VendimiaPage />} />
            <Route path="ayuda" element={<AyudaPage />} />

            <Route element={<RoleRoute allow={[RolNombre.PROPIETARIO]} />}>
              <Route path="usuarios" element={<UsuariosPage />} />
              <Route path="configuracion" element={<ConfiguracionPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
