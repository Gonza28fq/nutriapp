import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { ConfiguracionModel } from "../models/configuracion.model";
import { UsuarioModel } from "../models/usuario.model";
import { AuthService } from "../services/auth.service";
import { body, validationResult } from "express-validator";

export const actualizarPerfilValidators = [
  body("nombre").notEmpty().withMessage("El nombre es requerido").trim(),
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
];

export const cambiarPasswordValidators = [
  body("passwordActual").notEmpty().withMessage("La contraseña actual es requerida"),
  body("passwordNueva").isLength({ min: 6 }).withMessage("Mínimo 6 caracteres"),
];

export const ConfiguracionController = {

  async obtener(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarioId = req.usuario!.id;
      const usuario = await UsuarioModel.findById(usuarioId);
      const config  = await ConfiguracionModel.findByUsuario(usuarioId);
      res.json({
        ok: true,
        data: {
          usuario: {
            id:     usuario?.id,
            nombre: usuario?.nombre,
            email:  usuario?.email,
            rol:    usuario?.rol,
          },
          config: config ?? {
            foto_perfil: null, logo_url: null,
            nombre_app: "NutriApp", color_primario: "#ff2484",
            consultorio_nombre: null, consultorio_direccion: null,
            consultorio_telefono: null, consultorio_email: null,
            instagram: null, facebook: null, whatsapp: null,
          },
        }
      });
    } catch (error) { next(error); }
  },

  async actualizarPerfil(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) });
        return;
      }
      const { nombre, email } = req.body;
      const usuarioId = req.usuario!.id;

      await pool_update_usuario(usuarioId, nombre, email);
      const usuario = await UsuarioModel.findById(usuarioId);
      res.json({ ok: true, data: usuario, mensaje: "Perfil actualizado correctamente" });
    } catch (error) { next(error); }
  },

  async cambiarPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) });
        return;
      }
      const { passwordActual, passwordNueva } = req.body;
      await AuthService.cambiarPassword(req.usuario!.id, passwordActual, passwordNueva);
      res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
    } catch (error) { next(error); }
  },

  async actualizarConfig(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarioId = req.usuario!.id;
      await ConfiguracionModel.upsert(usuarioId, req.body);
      const config = await ConfiguracionModel.findByUsuario(usuarioId);
      res.json({ ok: true, data: config, mensaje: "Configuración guardada correctamente" });
    } catch (error) { next(error); }
  },
  async obtenerPublica(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const [rows] = await pool.query(
        `SELECT c.nombre_app, c.logo_url, c.color_primario,
                c.consultorio_nombre, c.consultorio_direccion,
                c.consultorio_telefono, c.consultorio_email,
                c.instagram, c.facebook, c.whatsapp
        FROM configuracion c
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE u.activo = TRUE LIMIT 1`
        );
        const config = (rows as any[])[0] ?? { nombre_app: "NutriApp", color_primario: "#ff2484" };
        res.json({ ok: true, data: config });
    } catch (error) { next(error); }
    },
};

// Helper para actualizar nombre/email del usuario
import pool from "../config/database";
async function pool_update_usuario(id: number, nombre: string, email: string): Promise<void> {
  await pool.query(
    "UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?",
    [nombre, email, id]
  );
}