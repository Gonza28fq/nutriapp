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
  { to: "/panel",              label: "Inicio",       icon: LayoutDashboard, end: true },
  { to: "/panel/pacientes",    label: "Pacientes",    icon: Users },
  { to: "/panel/turnos",       label: "Turnos",       icon: Calendar },
  { to: "/panel/consultas",    label: "Consultas",    icon: ClipboardList },
  { to: "/panel/planes",       label: "Planes",       icon: UtensilsCrossed },
  { to: "/panel/blog",         label: "Blog",         icon: BookOpen },
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
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  const inicialNombre = usuario?.nombre?.charAt(0).toUpperCase() ?? "M";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-body-bg)" }}>

      {/* Overlay móvil */}
      {sidebarAbierto && (
        <div className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarAbierto(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300
        w-64 lg:w-64
        ${sidebarAbierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `} style={{
        background: `linear-gradient(180deg, var(--color-sidebar-from) 0%, var(--color-sidebar-to) 100%)`
      }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary)" }}>
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-base font-bold text-white truncate flex-1">{nombreApp}</span>
          <button onClick={() => setSidebarAbierto(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10"
            style={{ color: "var(--color-sidebar-text)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => setSidebarAbierto(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
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
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--color-sidebar-border)" }}>
          <div className="flex items-center gap-3 mb-2 px-2">
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
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header móvil */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: "var(--color-sidebar-from)", borderBottom: "1px solid var(--color-sidebar-border)" }}>
          <button onClick={() => setSidebarAbierto(true)}
            className="p-2 rounded-lg hover:bg-white/10 flex-shrink-0"
            style={{ color: "var(--color-sidebar-text)" }}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-primary)" }}>
              <Leaf className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-semibold text-white text-sm truncate">{nombreApp}</span>
          </div>
          {/* Avatar en el header móvil */}
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-semibold text-xs"
            style={{ background: "var(--color-primary)" }}>
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="foto" className="w-full h-full object-cover"
                onError={e => (e.currentTarget.style.display = "none")} />
            ) : inicialNombre}
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto" style={{
          background: `linear-gradient(135deg, var(--color-panel-bg-from) 0%, var(--color-panel-bg-mid) 40%, var(--color-panel-bg-to) 100%)`
        }}>
          {/* Padding responsivo: menos en móvil */}
          <div className="p-3 sm:p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}