import { useState, useEffect } from "react";
import {
  User, Lock, Palette, Building2, Share2,
  Save, Eye, EyeOff, Check
} from "lucide-react";
import { configuracionService, ConfiguracionData } from "@/services/configuracion.service";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { TEMAS, TemaId, aplicarTema, getTemaGuardado, refrescarAppConfig } from "@/hooks/useAppConfig";
import toast from "react-hot-toast";

type Tab = "perfil" | "password" | "apariencia" | "consultorio" | "redes";

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "perfil",      label: "Perfil",       icon: User },
  { id: "password",    label: "Contraseña",   icon: Lock },
  { id: "apariencia",  label: "Apariencia",   icon: Palette },
  { id: "consultorio", label: "Consultorio",  icon: Building2 },
  { id: "redes",       label: "Redes",        icon: Share2 },
];

export default function Configuracion() {
  const [tabActiva, setTabActiva] = useState<Tab>("perfil");
  const [cargando, setCargando]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const usuario    = useAuthStore(s => s.usuario);
  const setUsuario = useAuthStore(s => s.setUsuario);

  const [temaSeleccionado, setTemaSeleccionado] = useState<TemaId>(getTemaGuardado());

  // Perfil
  const [nombre, setNombre] = useState("");
  const [email, setEmail]   = useState("");

  // Password
  const [passActual, setPassActual]   = useState("");
  const [passNueva, setPassNueva]     = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [verPass, setVerPass]         = useState(false);

  // Config
  const [config, setConfig] = useState<ConfiguracionData>({
    nombre_app: "NutriApp",
    color_primario: "#ff2484",
    foto_perfil: "",
    logo_url: "",
    consultorio_nombre: "",
    consultorio_direccion: "",
    consultorio_telefono: "",
    consultorio_email: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
  });

  useEffect(() => {
    configuracionService.obtener()
      .then(({ usuario: u, config: c }) => {
        setNombre(u.nombre);
        setEmail(u.email);
        setConfig({
          nombre_app:            c.nombre_app || "NutriApp",
          color_primario:        c.color_primario || "#ff2484",
          foto_perfil:           c.foto_perfil || "",
          logo_url:              c.logo_url || "",
          consultorio_nombre:    c.consultorio_nombre || "",
          consultorio_direccion: c.consultorio_direccion || "",
          consultorio_telefono:  c.consultorio_telefono || "",
          consultorio_email:     c.consultorio_email || "",
          instagram:             c.instagram || "",
          facebook:              c.facebook || "",
          whatsapp:              c.whatsapp || "",
        });
        if ((c as any).tema) {
          setTemaSeleccionado((c as any).tema as TemaId);
        }
      })
      .catch(() => toast.error("Error al cargar configuración"))
      .finally(() => setCargando(false));
  }, []);

  // Guarda perfil (nombre, email) + foto_perfil
  const guardarPerfil = async () => {
    if (!nombre.trim() || !email.trim()) { toast.error("Nombre y email son obligatorios"); return; }
    try {
      setGuardando(true);
      // Actualizar nombre y email en tabla usuarios
      await configuracionService.actualizarPerfil(nombre, email);
      // Guardar foto_perfil en tabla configuracion junto con el resto
      await configuracionService.actualizarConfig({ ...config });
      // Actualizar el store para que el sidebar refleje el nuevo nombre
      setUsuario({ ...usuario!, nombre, email });
      // Refrescar el hook useAppConfig para que el sidebar muestre la nueva foto
      refrescarAppConfig();
      toast.success("Perfil actualizado");
    } catch {
      toast.error("Error al actualizar perfil");
    } finally {
      setGuardando(false);
    }
  };

  const guardarPassword = async () => {
    if (!passActual || !passNueva) { toast.error("Completá todos los campos"); return; }
    if (passNueva !== passConfirm) { toast.error("Las contraseñas no coinciden"); return; }
    if (passNueva.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    try {
      setGuardando(true);
      await authService.cambiarPassword(passActual, passNueva);
      toast.success("Contraseña actualizada");
      setPassActual(""); setPassNueva(""); setPassConfirm("");
    } catch {
      toast.error("Contraseña actual incorrecta");
    } finally {
      setGuardando(false);
    }
  };

  const guardarConfig = async () => {
    try {
      setGuardando(true);
      await configuracionService.actualizarConfig({ ...config, tema: temaSeleccionado } as any);
      aplicarTema(temaSeleccionado);
      refrescarAppConfig();
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar configuración");
    } finally {
      setGuardando(false);
    }
  };

  const campo = (key: keyof ConfiguracionData, val: string) =>
    setConfig(c => ({ ...c, [key]: val }));

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>Configuración</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Personalizá tu perfil y la apariencia de la app</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar tabs */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="panel-card p-2 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTabActiva(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={tabActiva === id
                  ? { background: "var(--color-primary-bg)", color: "var(--color-primary)", borderLeft: "3px solid var(--color-primary)" }
                  : { color: "var(--color-text-muted)" }}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">

          {/* ── PERFIL ── */}
          {tabActiva === "perfil" && (
            <div className="panel-card space-y-5">
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Datos del perfil</h2>

              {/* Avatar preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden"
                  style={{ background: config.foto_perfil ? "transparent" : "var(--color-primary)" }}>
                  {config.foto_perfil
                    ? <img src={config.foto_perfil} alt="foto" className="w-full h-full object-cover"
                        onError={e => (e.currentTarget.style.display = "none")} />
                    : nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                    Foto de perfil (URL)
                  </label>
                  <input type="text" value={config.foto_perfil}
                    onChange={e => campo("foto_perfil", e.target.value)}
                    className="input-base" placeholder="https://..." />
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Usá una URL directa a una imagen (jpg, png, webp)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-base" />
              </div>

              <button onClick={guardarPerfil} disabled={guardando} className="btn-primary flex items-center gap-2">
                {guardando ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar perfil
              </button>
            </div>
          )}

          {/* ── CONTRASEÑA ── */}
          {tabActiva === "password" && (
            <div className="panel-card space-y-5">
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Cambiar contraseña</h2>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Contraseña actual</label>
                <div className="relative">
                  <input type={verPass ? "text" : "password"} value={passActual}
                    onChange={e => setPassActual(e.target.value)} className="input-base pr-10" />
                  <button onClick={() => setVerPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                    {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Nueva contraseña</label>
                <input type={verPass ? "text" : "password"} value={passNueva}
                  onChange={e => setPassNueva(e.target.value)} className="input-base" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Confirmar nueva contraseña</label>
                <div className="relative">
                  <input type={verPass ? "text" : "password"} value={passConfirm}
                    onChange={e => setPassConfirm(e.target.value)} className="input-base pr-10" />
                  {passConfirm && passNueva && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passConfirm === passNueva
                        ? <Check className="w-4 h-4" style={{ color: "#16a34a" }} />
                        : <span className="text-xs font-medium" style={{ color: "#dc2626" }}>✗</span>}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={guardarPassword} disabled={guardando} className="btn-primary flex items-center gap-2">
                {guardando ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                Cambiar contraseña
              </button>
            </div>
          )}

          {/* ── APARIENCIA ── */}
          {tabActiva === "apariencia" && (
            <div className="panel-card space-y-6">
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Apariencia</h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Logo de la app (URL)</label>
                <input type="text" value={config.logo_url}
                  onChange={e => campo("logo_url", e.target.value)}
                  className="input-base" placeholder="https://..." />
                {config.logo_url && (
                  <img src={config.logo_url} alt="logo" className="mt-2 h-10 object-contain rounded-lg"
                    onError={e => (e.currentTarget.style.display = "none")} />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Nombre de la app</label>
                <input type="text" value={config.nombre_app}
                  onChange={e => campo("nombre_app", e.target.value)}
                  className="input-base" placeholder="NutriApp" />
              </div>

              {/* Selector de temas */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Tema de color
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TEMAS.map(tema => {
                    const seleccionado = temaSeleccionado === tema.id;
                    return (
                      <button key={tema.id}
                        onClick={() => {
                          setTemaSeleccionado(tema.id);
                          aplicarTema(tema.id);
                        }}
                        className="relative p-3 rounded-2xl border-2 transition-all text-left overflow-hidden"
                        style={{
                          borderColor: seleccionado ? tema.color : "var(--color-card-border)",
                          background:  seleccionado ? tema.color + "18" : "var(--color-card-bg)",
                        }}>
                        <div className="flex gap-1.5 mb-2">
                          <div className="w-6 h-6 rounded-lg" style={{ background: tema.colorDark }} />
                          <div className="w-6 h-6 rounded-lg" style={{ background: tema.color }} />
                          <div className="flex-1 h-6 rounded-lg" style={{ background: tema.color + "30" }} />
                        </div>
                        <p className="text-xs font-semibold"
                          style={{ color: seleccionado ? tema.color : "var(--color-text)" }}>
                          {tema.nombre}
                        </p>
                        {seleccionado && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: tema.color }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={guardarConfig} disabled={guardando} className="btn-primary flex items-center gap-2">
                {guardando ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar apariencia
              </button>
            </div>
          )}

          {/* ── CONSULTORIO ── */}
          {tabActiva === "consultorio" && (
            <div className="panel-card space-y-5">
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Información del consultorio</h2>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Esta información se muestra en el sitio público.</p>
              {[
                { key: "consultorio_nombre",    label: "Nombre del consultorio", placeholder: "Ej: Consultorio Melina García" },
                { key: "consultorio_direccion", label: "Dirección",              placeholder: "Ej: Av. Siempreviva 742, Tucumán" },
                { key: "consultorio_telefono",  label: "Teléfono",               placeholder: "Ej: +54 381 555-0000" },
                { key: "consultorio_email",     label: "Email de contacto",      placeholder: "Ej: contacto@melina.com" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>{label}</label>
                  <input type="text" value={config[key as keyof ConfiguracionData] as string}
                    onChange={e => campo(key as keyof ConfiguracionData, e.target.value)}
                    className="input-base" placeholder={placeholder} />
                </div>
              ))}
              <button onClick={guardarConfig} disabled={guardando} className="btn-primary flex items-center gap-2">
                {guardando ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar consultorio
              </button>
            </div>
          )}

          {/* ── REDES SOCIALES ── */}
          {tabActiva === "redes" && (
            <div className="panel-card space-y-5">
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Redes sociales</h2>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Se muestran en el footer del sitio público.</p>
              {[
                { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/tu_usuario" },
                { key: "facebook",  label: "Facebook",  placeholder: "https://facebook.com/tu_pagina" },
                { key: "whatsapp",  label: "WhatsApp",  placeholder: "Ej: +54 381 555-0000" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>{label}</label>
                  <input type="text" value={config[key as keyof ConfiguracionData] as string}
                    onChange={e => campo(key as keyof ConfiguracionData, e.target.value)}
                    className="input-base" placeholder={placeholder} />
                </div>
              ))}
              <button onClick={guardarConfig} disabled={guardando} className="btn-primary flex items-center gap-2">
                {guardando ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar redes
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}