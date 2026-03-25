import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import pacientesRoutes from "./routes/paciente.routes";
import turnosRoutes from "./routes/turno.routes";
import consultasRoutes from "./routes/consulta.routes";
import recetasRoutes from "./routes/recetas.routes";
import planesRoutes from "./routes/planes.routes";
import { testConnection } from "./config/database";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import blogRoutes from "./routes/blog.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import configuracionRoutes from "./routes/configuracion.routes";
import sitioRoutes from "./routes/sitio.routes";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

// ── Helmet — headers de seguridad ────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── Rate limiter ─────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 500 : 10000,
  message:       { ok: false, mensaje: "Demasiadas solicitudes, intentá más tarde" },
  standardHeaders: true,
  legacyHeaders:   false,
}));

// Rate limiter más estricto solo para auth (evita fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 1000,
  message: { ok: false, mensaje: "Demasiados intentos de acceso, esperá 15 minutos" },
});

// ── CORS ─────────────────────────────────────────────────────────
const origenesPermitidos = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:4173", // preview de vite
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, mobile, health checks)
    if (!origin) return callback(null, true);
    if (origenesPermitidos.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido — ${origin}`));
  },
  credentials: true,
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Límite de tamaño de requests ─────────────────────────────────
app.use(express.json({ limit: "2mb" }));         // era 10mb, reducido
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Logger ───────────────────────────────────────────────────────
if (!isProd) {
  app.use(morgan("dev"));
} else {
  // En producción solo logueamos errores
  app.use(morgan("combined", {
    skip: (_req, res) => res.statusCode < 400,
  }));
}

app.use("/uploads", express.static("uploads"));

// ── Rutas ────────────────────────────────────────────────────────
app.use("/api/auth",          authLimiter, authRoutes);  // ← rate limit extra en auth
app.use("/api/pacientes",     pacientesRoutes);
app.use("/api/turnos",        turnosRoutes);
app.use("/api/consultas",     consultasRoutes);
app.use("/api/recetas",       recetasRoutes);
app.use("/api/planes",        planesRoutes);
app.use("/api/blog",          blogRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/sitio",         sitioRoutes);

// ── Health check ─────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ ok: true, mensaje: "API funcionando", timestamp: new Date().toISOString() });
});

// ── 404 ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, mensaje: "Ruta no encontrada" });
});

// ── Error handler ─────────────────────────────────────────────────
app.use(errorHandler);

async function main() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    console.log(`📋 Entorno: ${process.env.NODE_ENV || "development"}`);
  });
}

main();

export default app;