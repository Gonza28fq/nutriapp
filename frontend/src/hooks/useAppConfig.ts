import { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";

export type TemaId = "rosa" | "morado" | "verde" | "azul" | "naranja" | "gris";

export interface Tema {
  id: TemaId;
  nombre: string;
  color: string;
  colorDark: string;
}

export const TEMAS: Tema[] = [
  { id: "rosa",    nombre: "Rosa",        color: "#ff2484", colorDark: "#2d1320" },
  { id: "morado",  nombre: "Morado",      color: "#9333ea", colorDark: "#1e1030" },
  { id: "verde",   nombre: "Verde",       color: "#16a34a", colorDark: "#052e16" },
  { id: "azul",    nombre: "Azul",        color: "#2563eb", colorDark: "#0f172a" },
  { id: "naranja", nombre: "Naranja",     color: "#f97316", colorDark: "#431407" },
  { id: "gris",    nombre: "Minimalista", color: "#374151", colorDark: "#111827" },
];

export function aplicarTema(temaId: TemaId) {
  // Limpiar estilos inline que puedan sobreescribir las variables CSS
  document.documentElement.style.removeProperty("--color-primary");
  document.documentElement.style.removeProperty("--color-primary-dark");
  document.documentElement.style.removeProperty("--color-primary-light");
  document.documentElement.style.removeProperty("--color-primary-bg");
  document.documentElement.style.removeProperty("--color-primary-border");

  document.documentElement.removeAttribute("data-theme");
  if (temaId !== "rosa") {
    document.documentElement.setAttribute("data-theme", temaId);
  }
  localStorage.setItem("tema-app", temaId);
}

export function getTemaGuardado(): TemaId {
  return (localStorage.getItem("tema-app") as TemaId) ?? "rosa";
}

// ── Evento global para refrescar la config ────────────────────────
export function refrescarAppConfig() {
  window.dispatchEvent(new CustomEvent("app-config-refresh"));
}

export function useAppConfig() {
  const estaAutenticado = useAuthStore(s => s.estaAutenticado);
  const token           = useAuthStore(s => s.token);
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [nombreApp, setNombreApp]   = useState("NutriApp");
  const [logoUrl, setLogoUrl]       = useState("");
  const [temaActual, setTemaActual] = useState<TemaId>(getTemaGuardado());

  // Aplicar tema guardado al montar
  useEffect(() => {
    aplicarTema(getTemaGuardado());
  }, []);

  const cargarConfig = useCallback(() => {
    if (!estaAutenticado()) return;

    api.get("/configuracion")
      .then(res => {
        const cfg = res.data.data?.config;
        if (!cfg) return;
        setFotoPerfil(cfg.foto_perfil || "");
        if (cfg.nombre_app) setNombreApp(cfg.nombre_app);
        if (cfg.logo_url)   setLogoUrl(cfg.logo_url);
        if (cfg.tema) {
          aplicarTema(cfg.tema as TemaId);
          setTemaActual(cfg.tema as TemaId);
        }
      })
      .catch(() => {});
  }, [estaAutenticado]);

  // Cargar al montar o cuando cambia el token
  useEffect(() => {
    cargarConfig();
  }, [token, cargarConfig]);

  // Escuchar evento global de refresco
  useEffect(() => {
    window.addEventListener("app-config-refresh", cargarConfig);
    return () => window.removeEventListener("app-config-refresh", cargarConfig);
  }, [cargarConfig]);

  const cambiarTema = (temaId: TemaId) => {
    aplicarTema(temaId);
    setTemaActual(temaId);
  };

  return { fotoPerfil, nombreApp, logoUrl, temaActual, cambiarTema };
}