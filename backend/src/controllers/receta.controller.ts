import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { RecetaModel } from "../models/receta.model";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/error.middleware";

export const crearRecetaValidators = [
  body("nombre").notEmpty().withMessage("El nombre es requerido").trim(),
  body("ingredientes").notEmpty().withMessage("Los ingredientes son requeridos"),
  body("categoria").optional().isIn(["desayuno", "almuerzo", "merienda", "cena", "colacion", "postre", "otro"]),
  body("dificultad").optional().isIn(["facil", "media", "dificil"]),
];

export const RecetaController = {

  async listar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const paciente_id = req.query.paciente_id ? Number(req.query.paciente_id) : undefined;
      const busqueda    = req.query.busqueda as string | undefined;
      const categoria   = req.query.categoria as string | undefined;

      const recetas = await RecetaModel.findAll({ paciente_id, busqueda, categoria });
      res.json({ ok: true, data: recetas });
    } catch (error) {
      next(error);
    }
  },

  async obtener(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const receta = await RecetaModel.findById(id);
      if (!receta) throw new AppError("Receta no encontrada", 404);
      res.json({ ok: true, data: receta });
    } catch (error) {
      next(error);
    }
  },

  async crear(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) });
        return;
      }

      const id = await RecetaModel.create(req.body);
      const receta = await RecetaModel.findById(id);
      res.status(201).json({ ok: true, data: receta, mensaje: "Receta creada correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) });
        return;
      }

      const id = Number(req.params.id);
      const receta = await RecetaModel.findById(id);
      if (!receta) throw new AppError("Receta no encontrada", 404);

      await RecetaModel.update(id, req.body);
      const actualizada = await RecetaModel.findById(id);
      res.json({ ok: true, data: actualizada, mensaje: "Receta actualizada correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async eliminar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const receta = await RecetaModel.findById(id);
      if (!receta) throw new AppError("Receta no encontrada", 404);

      await RecetaModel.softDelete(id);
      res.json({ ok: true, mensaje: "Receta eliminada correctamente" });
    } catch (error) {
      next(error);
    }
  },
};