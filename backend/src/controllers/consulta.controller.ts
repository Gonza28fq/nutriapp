import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { ConsultaModel } from "../models/consulta.model";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/error.middleware";
import { calcularIMC } from "../utils/helpers";

export const crearConsultaValidators = [
  body("paciente_id").notEmpty().withMessage("El paciente es requerido"),
  body("fecha").notEmpty().withMessage("La fecha es requerida"),
  body("tipo_consulta").isIn(["primera_vez", "control", "seguimiento"]).withMessage("Tipo invalido"),
];

export const ConsultaController = {

  async listar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limite = Number(req.query.limite) || 50;
      const consultas = await ConsultaModel.findAll(limite);
      res.json({ ok: true, data: consultas });
    } catch (error) {
      next(error);
    }
  },

  async porPaciente(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pacienteId = Number(req.params.pacienteId);
      const consultas  = await ConsultaModel.findByPaciente(pacienteId);
      const mediciones = await ConsultaModel.getMedicionesByPaciente(pacienteId);
      res.json({ ok: true, data: { consultas, mediciones } });
    } catch (error) {
      next(error);
    }
  },

  async obtener(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const consulta = await ConsultaModel.findById(id);
      if (!consulta) throw new AppError("Consulta no encontrada", 404);
      res.json({ ok: true, data: consulta });
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

      const { medicion, ...consultaData } = req.body;

      const consultaId = await ConsultaModel.create(consultaData);

      if (medicion && Object.keys(medicion).length > 0) {
        if (medicion.peso_kg && medicion.talla_cm) {
          const { imc, clasificacion } = calcularIMC(
            Number(medicion.peso_kg),
            Number(medicion.talla_cm)
          );
          medicion.imc               = imc;
          medicion.clasificacion_imc = clasificacion;
        }
        await ConsultaModel.createMedicion({
          ...medicion,
          paciente_id: consultaData.paciente_id,
          consulta_id: consultaId,
          fecha:       consultaData.fecha,
        });
      }

      const consulta = await ConsultaModel.findById(consultaId);
      res.status(201).json({ ok: true, data: consulta, mensaje: "Consulta registrada correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const consulta = await ConsultaModel.findById(id);
      if (!consulta) throw new AppError("Consulta no encontrada", 404);

      await ConsultaModel.update(id, req.body);
      const actualizada = await ConsultaModel.findById(id);
      res.json({ ok: true, data: actualizada, mensaje: "Consulta actualizada correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async eliminar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const consulta = await ConsultaModel.findById(id);
      if (!consulta) throw new AppError("Consulta no encontrada", 404);

      await ConsultaModel.delete(id);
      res.json({ ok: true, mensaje: "Consulta eliminada correctamente" });
    } catch (error) {
      next(error);
    }
  },
};