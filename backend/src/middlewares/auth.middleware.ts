import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";

interface JwtPayload {
  id: number;
  email: string;
  nombre: string;
  rol: "admin" | "nutricionista";
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, mensaje: "Token no proporcionado" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as JwtPayload;
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ ok: false, mensaje: "Token invalido o expirado" });
  }
}
