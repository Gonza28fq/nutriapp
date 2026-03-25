import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { AuthService } from "../services/auth.service";
import { AuthRequest } from "../types";
import { UsuarioModel } from "../models/usuario.model";

export const loginValidators = [
  body("email")
    .isEmail().withMessage("Email invalido")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("La contrasena es requerida")
    .isLength({ min: 6 }).withMessage("Minimo 6 caracteres"),
];

export const cambiarPasswordValidators = [
  body("passwordActual").notEmpty().withMessage("La contrasena actual es requerida"),
  body("passwordNueva")
    .isLength({ min: 6 }).withMessage("La nueva contrasena debe tener al menos 6 caracteres"),
];

export const AuthController = {

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) });
        return;
      }
      const { email, password } = req.body;
      const resultado = await AuthService.login(email, password);
      res.json({ ok: true, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await UsuarioModel.findById(req.usuario!.id);
      if (!usuario) {
        res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
        return;
      }
      res.json({
        ok: true,
        data: {
          id:     usuario.id,
          nombre: usuario.nombre,
          email:  usuario.email,
          rol:    usuario.rol,
        },
      });
    } catch (error) {
      next(error);
    }
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
      res.json({ ok: true, mensaje: "Contrasena actualizada correctamente" });
    } catch (error) {
      next(error);
    }
  },
};