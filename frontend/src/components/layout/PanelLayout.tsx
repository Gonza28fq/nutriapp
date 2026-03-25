import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  UtensilsCrossed, BookOpen, LogOut, Menu, X, Leaf,
  ChevronRight, Settings, BarChart3,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useAppConfig } from "@/hooks/useAppConfig";
import toast from "react-hot-toast";

const navItems = [
  { to: "/panel",           label: "Inicio",    icon: LayoutDashboard, end: true },
  { to: "/panel/pacientes", label: "Pacientes", icon: Users },
  { to: "/panel/turnos",    label: "Turnos",    icon: Calendar },
  { to: "/panel/consultas", label: "Consultas", icon: ClipboardList },
  { to: "/panel/planes",    label: "Planes",    icon: UtensilsCrossed },
  { to: "/panel/blog",      label: "Blog",      icon: BookOpen },
  { to: "/panel/estadisticas", label: "Estadísticas", icon: BarChart3 },
];

export default function PanelLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const usuario  = useAuthStore((s) => s.usuario);
  const logout   = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { fotoPerfil, nombreApp } = useAppConfig();

  const handleLogout = () => {
    logout();
    toast.success("Sesion cerrada");
    navigate("/login");
  };

  const inicialNombre = usuario?.nombre?.charAt(0).toUpperCase() ?? "M";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-body-bg)" }}>

      {sidebarAbierto && (
        <div className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarAbierto(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300
        ${sidebarAbierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `} style={{
        background: `linear-gradient(180deg, var(--color-sidebar-from) 0%, var(--color-sidebar-to) 100%)`
      }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary)" }}>
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white truncate">{nombreApp}</span>
          <button onClick={() => setSidebarAbierto(false)}
            className="ml-auto lg:hidden" style={{ color: "var(--color-sidebar-text)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => setSidebarAbierto(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
              style={({ isActive }) => isActive ? {
                background: "var(--color-sidebar-active)",
                borderLeft: "3px solid var(--color-primary)",
                color: "white",
              } : {
                color: "var(--color-sidebar-text)",
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 flex-shrink-0" style={{
                    color: isActive ? "var(--color-primary-light)" : "var(--color-sidebar-text)"
                  }} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3" style={{ color: "var(--color-primary-light)" }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid var(--color-sidebar-border)" }}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-semibold text-sm"
              style={{ background: "var(--color-primary)" }}>
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="foto" className="w-full h-full object-cover"
                  onError={e => (e.currentTarget.style.display = "none")} />
              ) : inicialNombre}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{usuario?.nombre}</p>
              <p className="text-xs truncate" style={{ color: "var(--color-sidebar-text)" }}>{usuario?.email}</p>
            </div>
          </div>

          <NavLink to="/panel/configuracion" onClick={() => setSidebarAbierto(false)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors mb-1"
            style={({ isActive }) => ({
              color: isActive ? "white" : "var(--color-sidebar-text)",
              background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
            })}>
            <Settings className="w-4 h-4" />
            Configuración
          </NavLink>

          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/5"
            style={{ color: "var(--color-sidebar-text)" }}>
            <LogOut className="w-4 h-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3"
          style={{ background: "var(--color-sidebar-from)", borderBottom: "1px solid var(--color-sidebar-border)" }}>
          <button onClick={() => setSidebarAbierto(true)}
            className="p-2 rounded-lg hover:bg-white/10"
            style={{ color: "var(--color-sidebar-text)" }}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <span className="font-display font-semibold text-white">{nombreApp}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6" style={{
          background: `linear-gradient(135deg, var(--color-panel-bg-from) 0%, var(--color-panel-bg-mid) 40%, var(--color-panel-bg-to) 100%)`
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}