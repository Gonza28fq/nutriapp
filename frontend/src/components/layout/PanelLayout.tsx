import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Users, Calendar, ClipboardList, UtensilsCrossed, BarChart3, HeartPulse,
  Settings, LogOut, MoreHorizontal, UserPlus, X, Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useAppConfig } from "@/hooks/useAppConfig";
import { useClima, useReloj, saludo } from "@/hooks/useBarra";
import toast from "react-hot-toast";

const NAV = [
  { to: "/panel",              label: "Inicio",       icon: Home, end: true },
  { to: "/panel/pacientes",    label: "Pacientes",    icon: Users },
  { to: "/panel/patologias",   label: "Patologías",   icon: HeartPulse },
  { to: "/panel/turnos",       label: "Turnos",       icon: Calendar },
  { to: "/panel/consultas",    label: "Consultas",    icon: ClipboardList },
  { to: "/panel/planes",       label: "Planes",       icon: UtensilsCrossed },
  { to: "/panel/estadisticas", label: "Estadísticas", icon: BarChart3 },
];
// En el celular, abajo van las 4 más usadas + "Más"
const NAV_MOVIL = NAV.filter((n) => ["/panel", "/panel/pacientes", "/panel/turnos", "/panel/patologias"].includes(n.to));
const NAV_MAS = NAV.filter((n) => !NAV_MOVIL.includes(n));

function Logo({ nombre, compacto = false }: { nombre: string; compacto?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <img src="/favicon.svg" alt="" className="w-9 h-9 flex-shrink-0 drop-shadow-sm" />
      {!compacto && <span className="font-display text-lg font-bold truncate" style={{ color: "var(--color-text)" }}>{nombre}</span>}
    </div>
  );
}

function Avatar({ foto, inicial, tam = "w-9 h-9" }: { foto?: string | null; inicial: string; tam?: string }) {
  return (
    <div className={`${tam} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold text-sm ring-2 ring-white`}
      style={{ background: "linear-gradient(135deg, var(--color-primary-light), var(--color-primary))" }}>
      {foto ? <img src={foto} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} /> : inicial}
    </div>
  );
}

/** Fondo decorativo: manchas pastel difuminadas que se mueven muy despacio. */
function FondoDecorativo() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ background: "var(--color-body-bg)" }}>
      <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, var(--color-primary-border), transparent 70%)", animation: "flotar 18s ease-in-out infinite" }} />
      <div className="absolute top-1/3 -left-32 w-[24rem] h-[24rem] rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, var(--c-lila-bg), transparent 70%)", animation: "flotar 22s ease-in-out infinite reverse" }} />
      <div className="absolute -bottom-40 right-1/4 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, var(--c-durazno-bg), transparent 70%)", animation: "flotar 26s ease-in-out infinite" }} />
      {/* puntitos sutiles */}
      <div className="absolute inset-0 opacity-[0.35]"
        style={{ backgroundImage: "radial-gradient(var(--color-primary-border) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
    </div>
  );
}

function ChipClima() {
  const { clima, ciudad } = useClima();
  if (!clima) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border text-sm font-bold"
      style={{ borderColor: "var(--color-card-border)", color: "var(--color-text)" }} title={`${clima.descripcion} en ${ciudad}`}>
      <span className="text-base leading-none">{clima.emoji}</span>
      <span>{clima.temperatura}°</span>
      <span className="hidden xl:inline font-semibold" style={{ color: "var(--color-text-muted)" }}>{ciudad}</span>
    </div>
  );
}

function ChipReloj({ ahora }: { ahora: Date }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border text-sm"
      style={{ borderColor: "var(--color-card-border)" }}>
      <span className="font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
        {ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
      </span>
      <span className="hidden md:inline font-semibold capitalize" style={{ color: "var(--color-text-muted)" }}>
        {ahora.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
      </span>
    </div>
  );
}

export default function PanelLayout() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const { fotoPerfil, nombreApp } = useAppConfig();
  const ahora = useReloj();
  const [masAbierto, setMasAbierto] = useState(false);

  useEffect(() => { setMasAbierto(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  const primerNombre = usuario?.nombre?.split(" ")[0] ?? "";
  const inicial = usuario?.nombre?.charAt(0).toUpperCase() ?? "N";

  return (
    <div className="min-h-screen">
      <FondoDecorativo />

      {/* ── Barra lateral: tablet (solo íconos) y escritorio ─────────────── */}
      <aside className="hidden md:flex fixed z-30 top-3 bottom-3 left-3 w-[4.75rem] lg:w-64 flex-col rounded-[1.75rem] bg-white/85 backdrop-blur-xl border"
        style={{ borderColor: "var(--color-card-border)", boxShadow: "var(--shadow-float)" }}>
        <div className="px-3.5 lg:px-5 pt-5 pb-4">
          <div className="hidden lg:block"><Logo nombre={nombreApp} /></div>
          <div className="lg:hidden flex justify-center"><Logo nombre={nombreApp} compacto /></div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-2.5 lg:px-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} title={label}
              className="group flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-2xl text-[0.95rem] font-bold transition-all"
              style={({ isActive }) => isActive
                ? { background: "linear-gradient(135deg, var(--color-primary-light), var(--color-primary))", color: "white", boxShadow: "0 8px 18px -8px var(--color-primary)" }
                : { color: "var(--color-text-muted)" }}>
              {({ isActive }) => (
                <>
                  <span className={`w-9 h-9 lg:w-8 lg:h-8 flex items-center justify-center rounded-xl transition-colors ${isActive ? "" : "group-hover:bg-[var(--color-primary-bg)]"}`}>
                    <Icon className="w-[1.15rem] h-[1.15rem]" />
                  </span>
                  <span className="hidden lg:inline flex-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Tarjetita decorativa (solo escritorio) */}
        <div className="hidden lg:block mx-3 mb-3 p-4 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--color-primary-bg), var(--c-lila-bg))" }}>
          <Sparkles className="absolute right-3 top-3 w-5 h-5" style={{ color: "var(--color-primary-light)", animation: "latido 3s ease-in-out infinite" }} />
          <p className="font-display font-bold text-sm" style={{ color: "var(--color-text)" }}>¿Paciente nuevo?</p>
          <p className="text-xs mt-0.5 mb-3" style={{ color: "var(--color-text-muted)" }}>Cargalo en un minuto.</p>
          <button onClick={() => navigate("/panel/pacientes/nuevo")} className="btn-primary text-xs py-1.5 px-3">
            <UserPlus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        <div className="px-2.5 lg:px-3 pb-4 pt-3 border-t space-y-1" style={{ borderColor: "var(--color-card-border)" }}>
          <div className="hidden lg:flex items-center gap-3 px-2 pb-2">
            <Avatar foto={fotoPerfil} inicial={inicial} />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--color-text)" }}>{usuario?.nombre}</p>
              <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{usuario?.email}</p>
            </div>
          </div>
          <NavLink to="/panel/configuracion" title="Configuración"
            className="flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-2xl text-sm font-bold transition-colors hover:bg-[var(--color-primary-bg)]"
            style={({ isActive }) => ({ color: isActive ? "var(--color-primary-dark)" : "var(--color-text-muted)" })}>
            <Settings className="w-[1.1rem] h-[1.1rem]" /><span className="hidden lg:inline">Configuración</span>
          </NavLink>
          <button onClick={handleLogout} title="Cerrar sesión"
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-2xl text-sm font-bold transition-colors hover:bg-[var(--color-primary-bg)]"
            style={{ color: "var(--color-text-muted)" }}>
            <LogOut className="w-[1.1rem] h-[1.1rem]" /><span className="hidden lg:inline">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Contenido ─────────────────────────────────────────────────── */}
      <div className="md:pl-[6.25rem] lg:pl-[17.5rem] min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 px-3 sm:px-5 lg:px-8 pt-3 pb-3 backdrop-blur-xl"
          style={{ background: "color-mix(in srgb, var(--color-body-bg) 78%, transparent)" }}>
          <div className="flex items-center gap-3">
            <div className="md:hidden"><Logo nombre={nombreApp} compacto /></div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-lg sm:text-xl truncate" style={{ color: "var(--color-text)" }}>
                {saludo(ahora.getHours())}{primerNombre && `, ${primerNombre}`} <span className="inline-block" style={{ animation: "latido 2.4s ease-in-out infinite" }}>🌸</span>
              </p>
              <p className="hidden sm:block text-xs font-semibold capitalize" style={{ color: "var(--color-text-muted)" }}>
                {ahora.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <ChipClima />
            <div className="hidden sm:block"><ChipReloj ahora={ahora} /></div>
            <button onClick={() => navigate("/panel/pacientes/nuevo")} className="hidden lg:inline-flex btn-primary text-sm">
              <UserPlus className="w-4 h-4" /> Paciente
            </button>
            <button onClick={() => navigate("/panel/configuracion")} className="md:hidden" aria-label="Configuración">
              <Avatar foto={fotoPerfil} inicial={inicial} tam="w-9 h-9" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-5 lg:px-8 pb-28 md:pb-10 pt-1">
          <div key={location.pathname} className="animate-entrada max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Navegación inferior (celular) ─────────────────────────────── */}
      <nav className="md:hidden fixed z-30 bottom-0 inset-x-0 px-3 safe-bottom">
        <div className="flex items-stretch justify-around rounded-[1.6rem] bg-white/90 backdrop-blur-xl border px-1.5 py-1.5"
          style={{ borderColor: "var(--color-card-border)", boxShadow: "var(--shadow-float)" }}>
          {NAV_MOVIL.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-2xl text-[0.68rem] font-bold transition-all"
              style={({ isActive }) => isActive ? { color: "var(--color-primary-dark)", background: "var(--color-primary-bg)" } : { color: "var(--color-text-muted)" }}>
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
          <button onClick={() => setMasAbierto(true)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-2xl text-[0.68rem] font-bold"
            style={{ color: NAV_MAS.some((n) => location.pathname.startsWith(n.to)) ? "var(--color-primary-dark)" : "var(--color-text-muted)" }}>
            <MoreHorizontal className="w-5 h-5" />
            Más
          </button>
        </div>
      </nav>

      {/* ── Hoja "Más" (celular) ──────────────────────────────────────── */}
      {masAbierto && (
        <div className="md:hidden fixed inset-0 z-40 flex items-end" onClick={() => setMasAbierto(false)}
          style={{ background: "rgba(59, 21, 48, 0.35)", backdropFilter: "blur(4px)" }}>
          <div className="w-full rounded-t-[2rem] bg-white p-5 safe-bottom animate-entrada" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar foto={fotoPerfil} inicial={inicial} />
                <div>
                  <p className="font-bold" style={{ color: "var(--color-text)" }}>{usuario?.nombre}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{usuario?.email}</p>
                </div>
              </div>
              <button onClick={() => setMasAbierto(false)} className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-primary-bg)", color: "var(--color-primary-dark)" }} aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...NAV_MAS, { to: "/panel/pacientes/nuevo", label: "Nuevo paciente", icon: UserPlus }, { to: "/panel/configuracion", label: "Configuración", icon: Settings }]
                .map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-xs font-bold text-center"
                    style={({ isActive }) => ({ background: isActive ? "var(--color-primary-bg)" : "var(--color-cream-50)", color: isActive ? "var(--color-primary-dark)" : "var(--color-text)", border: "1px solid var(--color-card-border)" })}>
                    <Icon className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                    {label}
                  </NavLink>
                ))}
            </div>
            <button onClick={handleLogout} className="w-full mt-3 btn-soft">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
