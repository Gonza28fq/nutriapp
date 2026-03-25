import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // ← timeout de 15s — evita requests colgados
});

// ── Request: agregar token ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: manejar errores ─────────────────────────────────────
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const url          = error.config?.url ?? "";
      const esRutaPublica = url.includes("/publica") || url.includes("/blog/publico");

      if (!esRutaPublica && !window.location.pathname.includes("/login")) {
        // Limpiar sesión
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        // Mostrar mensaje según si fue expiración o acceso denegado
        const mensaje = error.response?.data?.mensaje ?? "";
        const fueExpiracion = mensaje.toLowerCase().includes("expirado")
          || mensaje.toLowerCase().includes("expired")
          || mensaje.toLowerCase().includes("invalid");

        // Guardar la ruta actual para redirigir después del login
        const rutaActual = window.location.pathname;
        if (rutaActual !== "/login") {
          sessionStorage.setItem("redirect_after_login", rutaActual);
        }

        // Pequeño delay para que se vea el toast si hay
        setTimeout(() => {
          window.location.href = fueExpiracion
            ? "/login?sesion=expirada"
            : "/login";
        }, 100);
      }
    }

    // Timeout
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new Error("La solicitud tardó demasiado. Verificá tu conexión."));
    }

    // Sin conexión al servidor
    if (!error.response) {
      return Promise.reject(new Error("No se pudo conectar al servidor."));
    }

    return Promise.reject(error);
  }
);

export default api;