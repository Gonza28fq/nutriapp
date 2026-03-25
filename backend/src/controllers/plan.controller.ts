import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { PlanModel } from "../models/plan.model";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/error.middleware";

export const crearPlanValidators = [
  body("paciente_id").notEmpty().isInt().withMessage("paciente_id es requerido"),
  body("estado").optional().isIn(["borrador", "activo", "vencido", "archivado"]),
];

export const crearComidaValidators = [
  body("dia").notEmpty().isInt({ min: 1, max: 7 }).withMessage("dia debe ser entre 1 y 7"),
  body("momento").notEmpty().isIn(["desayuno", "almuerzo", "merienda", "cena", "colacion_am", "colacion_pm"]),
  body("descripcion").notEmpty().withMessage("La descripción es requerida").trim(),
];

export const PlanController = {

  async listar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const paciente_id = req.query.paciente_id ? Number(req.query.paciente_id) : undefined;
      const planes = await PlanModel.findAll(paciente_id);
      res.json({ ok: true, data: planes });
    } catch (error) {
      next(error);
    }
  },

  async obtener(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const plan = await PlanModel.findById(id);
      if (!plan) throw new AppError("Plan no encontrado", 404);

      const comidas = await PlanModel.getComidas(id);
      res.json({ ok: true, data: { ...plan, comidas } });
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

      const id = await PlanModel.create(req.body);
      const plan = await PlanModel.findById(id);
      const comidas = await PlanModel.getComidas(id);
      res.status(201).json({ ok: true, data: { ...plan, comidas }, mensaje: "Plan creado correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const plan = await PlanModel.findById(id);
      if (!plan) throw new AppError("Plan no encontrado", 404);

      await PlanModel.update(id, req.body);
      const actualizado = await PlanModel.findById(id);
      res.json({ ok: true, data: actualizado, mensaje: "Plan actualizado correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async eliminar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const plan = await PlanModel.findById(id);
      if (!plan) throw new AppError("Plan no encontrado", 404);

      await PlanModel.delete(id);
      res.json({ ok: true, mensaje: "Plan eliminado correctamente" });
    } catch (error) {
      next(error);
    }
  },

  // ── COMIDAS ──────────────────────────────────────────────────────

  async agregarComida(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) });
        return;
      }

      const planId = Number(req.params.id);
      const plan = await PlanModel.findById(planId);
      if (!plan) throw new AppError("Plan no encontrado", 404);

      const comidaId = await PlanModel.addComida(planId, req.body);
      const comida = await PlanModel.findComidaById(comidaId);
      res.status(201).json({ ok: true, data: comida, mensaje: "Comida agregada correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async actualizarComida(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const comidaId = Number(req.params.comidaId);
      const comida = await PlanModel.findComidaById(comidaId);
      if (!comida) throw new AppError("Comida no encontrada", 404);

      await PlanModel.updateComida(comidaId, req.body);
      const actualizada = await PlanModel.findComidaById(comidaId);
      res.json({ ok: true, data: actualizada, mensaje: "Comida actualizada correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async eliminarComida(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const comidaId = Number(req.params.comidaId);
      const comida = await PlanModel.findComidaById(comidaId);
      if (!comida) throw new AppError("Comida no encontrada", 404);

      await PlanModel.deleteComida(comidaId);
      res.json({ ok: true, mensaje: "Comida eliminada correctamente" });
    } catch (error) {
      next(error);
    }
  },
};