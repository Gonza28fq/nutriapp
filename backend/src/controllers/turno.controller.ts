import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { TurnoModel } from "../models/turno.model";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/error.middleware";

export const crearTurnoValidators = [
  body("sede_id").notEmpty().withMessage("La sede es requerida"),
  body("fecha").notEmpty().withMessage("La fecha es requerida"),
  body("tipo").isIn(["agendado", "espontaneo"]).withMessage("Tipo invalido"),
  body("tipo_consulta").isIn(["primera_vez", "control", "seguimiento"]).withMessage("Tipo de consulta invalido"),
];

export const TurnoController = {

  async porFecha(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fecha  = req.query.fecha as string;
      const sedeId = req.query.sede_id ? Number(req.query.sede_id) : undefined;

      if (!fecha) {
        res.status(400).json({ ok: false, mensaje: "La fecha es requerida" });
        return;
      }

      const turnos = await TurnoModel.findByFecha(fecha, sedeId);
      res.json({ ok: true, data: turnos });
    } catch (error) {
      next(error);
    }
  },

  async porRango(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fechaInicio = req.query.inicio as string;
      const fechaFin    = req.query.fin    as string;
      const sedeId      = req.query.sede_id ? Number(req.query.sede_id) : undefined;

      if (!fechaInicio || !fechaFin) {
        res.status(400).json({ ok: false, mensaje: "Fechas de inicio y fin requeridas" });
        return;
      }

      const turnos = await TurnoModel.findByRango(fechaInicio, fechaFin, sedeId);
      res.json({ ok: true, data: turnos });
    } catch (error) {
      next(error);
    }
  },

  async obtener(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const turno = await TurnoModel.findById(id);
      if (!turno) throw new AppError("Turno no encontrado", 404);
      res.json({ ok: true, data: turno });
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

      // Verificar maximo 8 turnos por dia por sede
      const count = await TurnoModel.countByFecha(req.body.fecha, req.body.sede_id);
      if (count >= 8) {
        res.status(400).json({ ok: false, mensaje: "Ya se alcanzo el maximo de 8 turnos para ese dia" });
        return;
      }

      const id    = await TurnoModel.create(req.body);
      const turno = await TurnoModel.findById(id);
      res.status(201).json({ ok: true, data: turno, mensaje: "Turno creado correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async actualizarEstado(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id     = Number(req.params.id);
      const estado = req.body.estado;

      if (!["pendiente", "presente", "ausente", "cancelado"].includes(estado)) {
        res.status(400).json({ ok: false, mensaje: "Estado invalido" });
        return;
      }

      const turno = await TurnoModel.findById(id);
      if (!turno) throw new AppError("Turno no encontrado", 404);

      await TurnoModel.updateEstado(id, estado);
      res.json({ ok: true, mensaje: "Estado actualizado correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id    = Number(req.params.id);
      const turno = await TurnoModel.findById(id);
      if (!turno) throw new AppError("Turno no encontrado", 404);

      await TurnoModel.update(id, req.body);
      const actualizado = await TurnoModel.findById(id);
      res.json({ ok: true, data: actualizado, mensaje: "Turno actualizado correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async eliminar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id    = Number(req.params.id);
      const turno = await TurnoModel.findById(id);
      if (!turno) throw new AppError("Turno no encontrado", 404);

      await TurnoModel.delete(id);
      res.json({ ok: true, mensaje: "Turno eliminado correctamente" });
    } catch (error) {
      next(error);
    }
  },
};