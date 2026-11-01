import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { ConsultaModel } from "../models/consulta.model";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/error.middleware";
import { auditar } from "../utils/auditoria";
import { ClinicaModel } from "../models/clinica.model";

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
      await auditar(req, { entidad: "consulta", entidadId: consultaId, pacienteId: Number(consultaData.paciente_id), accion: "crear", resumen: `Consulta del ${consultaData.fecha}`, cambios: consultaData });

      if (medicion && Object.keys(medicion).length > 0) {
        try {
          // crearMedicion calcula IMC, clasificación e índice cintura/cadera
          await ClinicaModel.crearMedicion(Number(consultaData.paciente_id), {
            ...medicion,
            consulta_id: consultaId,
            fecha:       consultaData.fecha,
          });
        } catch (e) {
          // Sin medición válida no queda una consulta a medias
          await ConsultaModel.delete(consultaId);
          throw e;
        }
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
      await auditar(req, { entidad: "consulta", entidadId: id, pacienteId: Number(consulta.paciente_id), accion: "editar", resumen: `Consulta del ${consulta.fecha}`, cambios: req.body });
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
      await auditar(req, { entidad: "consulta", entidadId: id, pacienteId: Number(consulta.paciente_id), accion: "borrar", resumen: `Eliminó la consulta del ${consulta.fecha}` });
      res.json({ ok: true, mensaje: "Consulta eliminada correctamente" });
    } catch (error) {
      next(error);
    }
  },
};