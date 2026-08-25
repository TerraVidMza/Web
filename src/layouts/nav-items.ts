import {
  Bell,
  ClipboardList,
  Grape,
  HelpCircle,
  LayoutDashboard,
  Map,
  Radio,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { Permiso } from "@/auth/permisos"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /**
   * Permiso de `PERMISOS`. **No una lista de roles**: la lista vivía acá
   * duplicada, divergió de los `@Roles` del backend, y el resultado era que el
   * Auditor veía cuatro secciones que le devolvían 403.
   */
  permiso: Permiso
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, permiso: "dashboard" },
  { to: "/fincas", label: "Fincas y Cuarteles", icon: Map, permiso: "fincas" },
  { to: "/operaciones", label: "Operaciones", icon: ClipboardList, permiso: "operaciones" },
  { to: "/telemetria", label: "Telemetría IoT", icon: Radio, permiso: "telemetria" },
  { to: "/vendimia", label: "Vendimia", icon: Grape, permiso: "vendimia" },
  { to: "/auditoria", label: "Log de auditoría", icon: ScrollText, permiso: "logAuditoria" },
  { to: "/notificaciones", label: "Notificaciones", icon: Bell, permiso: "notificaciones" },
  { to: "/usuarios", label: "Usuarios", icon: Users, permiso: "usuarios" },
  { to: "/configuracion", label: "Configuración", icon: Settings, permiso: "configuracion" },
  { to: "/ayuda", label: "Ayuda", icon: HelpCircle, permiso: "ayuda" },
]
