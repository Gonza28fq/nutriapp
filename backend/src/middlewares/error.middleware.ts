import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === "production";

  // Determinar status code
  const statusCode = "statusCode" in err ? err.statusCode : 500;

  // Errores de MySQL — no exponer detalles en producción
  const esMysqlError = err.message?.includes("ER_") || err.message?.includes("ECONNREFUSED");

  // Log completo siempre en servidor
  if (statusCode >= 500) {
    console.error("❌ Error:", {
      message:    err.message,
      stack:      err.stack,
      statusCode,
    });
  }

  // Respuesta al cliente — en producción ocultamos detalles sensibles
  if (isProd) {
    // Error operacional conocido (AppError) → mostrar mensaje
    if ("isOperational" in err && err.isOperational) {
      res.status(statusCode).json({ ok: false, mensaje: err.message });
      return;
    }

    // Error inesperado o de MySQL → mensaje genérico
    if (statusCode >= 500 || esMysqlError) {
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
      return;
    }

    res.status(statusCode).json({ ok: false, mensaje: err.message });
  } else {
    // Desarrollo → mostrar todo
    res.status(statusCode).json({
      ok:      false,
      mensaje: err.message,
      stack:   err.stack,
    });
  }
}