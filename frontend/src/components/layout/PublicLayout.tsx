import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Leaf, Instagram, Facebook, MessageCircle, MapPin, Phone, Mail, Menu, X } from "lucide-react";

interface ConfigPublica {
  nombre_app: string;
  logo_url?: string;
  consultorio_nombre?: string;
  consultorio_direccion?: string;
  consultorio_telefono?: string;
  consultorio_email?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

export default function PublicLayout() {
  const [config, setConfig] = useState<ConfigPublica>({ nombre_app: "NutriApp" });
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  useEffect(() => {
    fetch(`${API}/api/configuracion/publica`)
      .then(r => r.json())
      .then(res => { if (res.ok && res.data) setConfig(res.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const tieneRedes    = config.instagram || config.facebook || config.whatsapp;
  const tieneContacto = config.consultorio_direccion || config.consultorio_telefono || config.consultorio_email;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#faf8f4", color: "#1c1208" }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(250,248,244,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(139,109,56,0.12)" : "none",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
        }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 sm:gap-3">
            {config.logo_url ? (
              <img src={config.logo_url} alt="logo" className="h-7 sm:h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #5c8a3c, #3d6b2a)" }}>
                <Leaf className="w-4 h-4 text-white" />
              </div>
            )}
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 700, color: "#1c1208" }}>
              {config.nombre_app}
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <NavLink to="/" end className="text-sm font-medium transition-colors"
              style={({ isActive }) => ({ color: isActive ? "#5c8a3c" : "#6b5a3e" })}>
              Inicio
            </NavLink>
            <NavLink to="/blog" className="text-sm font-medium transition-colors"
              style={({ isActive }) => ({ color: isActive ? "#5c8a3c" : "#6b5a3e" })}>
              Blog
            </NavLink>
            <button onClick={() => navigate("/login")}
              className="text-sm font-medium px-5 py-2 rounded-full transition-all"
              style={{ background: "#5c8a3c", color: "white", boxShadow: "0 2px 12px rgba(92,138,60,0.3)" }}>
              Acceder
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-xl" style={{ color: scrolled ? "#6b5a3e" : "#f5ede0" }}
            onClick={() => setMenuAbierto(v => !v)}>
            {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuAbierto && (
          <div className="md:hidden px-4 pb-5 pt-2 space-y-2"
            style={{ background: "rgba(250,248,244,0.98)", borderBottom: "1px solid rgba(139,109,56,0.12)" }}>
            <NavLink to="/" end onClick={() => setMenuAbierto(false)}
              className="block text-sm font-medium py-2.5 px-3 rounded-xl"
              style={{ color: "#6b5a3e" }}>Inicio</NavLink>
            <NavLink to="/blog" onClick={() => setMenuAbierto(false)}
              className="block text-sm font-medium py-2.5 px-3 rounded-xl"
              style={{ color: "#6b5a3e" }}>Blog</NavLink>
            <button onClick={() => { setMenuAbierto(false); navigate("/login"); }}
              className="w-full text-sm font-medium px-5 py-3 rounded-full text-center mt-1"
              style={{ background: "#5c8a3c", color: "white" }}>
              Acceder al panel
            </button>
          </div>
        )}
      </nav>

      {/* ── Contenido ── */}
      <main>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: "#1c1208", color: "#c9b99a" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 mb-10">

            {/* Logo + tagline */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #5c8a3c, #3d6b2a)" }}>
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#f5ede0" }}>
                  {config.nombre_app}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#8a7a62" }}>
                Nutrición personalizada para mejorar tu calidad de vida desde adentro.
              </p>
              {tieneRedes && (
                <div className="flex gap-3 pt-2">
                  {config.instagram && (
                    <a href={config.instagram} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "rgba(255,255,255,0.08)" }}>
                      <Instagram className="w-4 h-4" style={{ color: "#c9b99a" }} />
                    </a>
                  )}
                  {config.facebook && (
                    <a href={config.facebook} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "rgba(255,255,255,0.08)" }}>
                      <Facebook className="w-4 h-4" style={{ color: "#c9b99a" }} />
                    </a>
                  )}
                  {config.whatsapp && (
                    <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "rgba(255,255,255,0.08)" }}>
                      <MessageCircle className="w-4 h-4" style={{ color: "#c9b99a" }} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#5c8a3c" }}>Navegación</p>
              <div className="space-y-3">
                <NavLink to="/" end className="block text-sm transition-colors hover:text-white" style={{ color: "#8a7a62" }}>Inicio</NavLink>
                <NavLink to="/blog" className="block text-sm transition-colors hover:text-white" style={{ color: "#8a7a62" }}>Blog</NavLink>
                <NavLink to="/login" className="block text-sm transition-colors hover:text-white" style={{ color: "#8a7a62" }}>Panel</NavLink>
              </div>
            </div>

            {/* Contacto */}
            {tieneContacto && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#5c8a3c" }}>
                  {config.consultorio_nombre || "Contacto"}
                </p>
                <div className="space-y-3">
                  {config.consultorio_direccion && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#5c8a3c" }} />
                      <span className="text-sm" style={{ color: "#8a7a62" }}>{config.consultorio_direccion}</span>
                    </div>
                  )}
                  {config.consultorio_telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#5c8a3c" }} />
                      <span className="text-sm" style={{ color: "#8a7a62" }}>{config.consultorio_telefono}</span>
                    </div>
                  )}
                  {config.consultorio_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#5c8a3c" }} />
                      <a href={`mailto:${config.consultorio_email}`}
                        className="text-sm hover:text-white transition-colors" style={{ color: "#8a7a62" }}>
                        {config.consultorio_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-center" style={{ color: "#5a4a32" }}>
              © {new Date().getFullYear()} {config.nombre_app} — Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}