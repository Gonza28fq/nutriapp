import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { PacienteModel } from "../models/paciente.model";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/error.middleware";
import { auditar } from "../utils/auditoria";

export const crearPacienteValidators = [
  body("nombre").notEmpty().withMessage("El nombre es requerido").trim(),
  body("apellido").notEmpty().withMessage("El apellido es requerido").trim(),
  body("dni").optional().isLength({ min: 7, max: 15 }).withMessage("DNI invalido"),
  body("email").optional().isEmail().withMessage("Email invalido"),
  body("celular").optional().trim(),
  body("sexo").optional().isIn(["masculino", "femenino", "otro"]).withMessage("Sexo invalido"),
];

export const PacienteController = {

  async listar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const busqueda    = req.query.busqueda as string | undefined;
      const pagina      = Number(req.query.pagina)  || 1;
      const limite      = Number(req.query.limite)  || 20;
      // activo=false muestra dados de baja, por defecto muestra activos
      const soloActivos = req.query.activo === "false" ? false : true;

      const resultado = await PacienteModel.findAll(busqueda, pagina, limite, soloActivos);
      res.json({ ok: true, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  async obtener(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const paciente = await PacienteModel.findById(id);
      if (!paciente) throw new AppError("Paciente no encontrado", 404);

      const historiaClinica = await PacienteModel.getHistoriaClinica(id);
      const anamnesis       = await PacienteModel.getAnamnesis(id);

      res.json({ ok: true, data: { paciente, historiaClinica, anamnesis } });
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

      if (req.body.dni) {
        const existente = await PacienteModel.findByDni(req.body.dni);
        if (existente) {
          res.status(400).json({ ok: false, mensaje: "Ya existe un paciente con ese DNI" });
          return;
        }
      }

      const id = await PacienteModel.create(req.body);
      await auditar(req, { entidad: "paciente", entidadId: id, pacienteId: id, accion: "crear", resumen: `Alta de paciente: ${req.body.nombre + " " + req.body.apellido}`, cambios: req.body });
      const paciente = await PacienteModel.findById(id);
      res.status(201).json({ ok: true, data: paciente, mensaje: "Paciente creado correctamente" });
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
      const paciente = await PacienteModel.findById(id);
      if (!paciente) throw new AppError("Paciente no encontrado", 404);

      await PacienteModel.update(id, req.body);
      await auditar(req, { entidad: "paciente", entidadId: id, pacienteId: id, accion: "editar", resumen: "Editó los datos personales", cambios: req.body });
      const actualizado = await PacienteModel.findById(id);
      res.json({ ok: true, data: actualizado, mensaje: "Paciente actualizado correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async desactivar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const paciente = await PacienteModel.findById(id);
      if (!paciente) throw new AppError("Paciente no encontrado", 404);

      await PacienteModel.desactivar(id);
      await auditar(req, { entidad: "paciente", entidadId: id, pacienteId: id, accion: "baja", resumen: "Dio de baja al paciente" });
      res.json({ ok: true, mensaje: "Paciente dado de baja correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async reactivar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const paciente = await PacienteModel.findById(id);
      if (!paciente) throw new AppError("Paciente no encontrado", 404);

      await PacienteModel.reactivar(id);
      await auditar(req, { entidad: "paciente", entidadId: id, pacienteId: id, accion: "reactivar", resumen: "Reactivó al paciente" });
      res.json({ ok: true, mensaje: "Paciente reactivado correctamente" });
    } catch (error) {
      next(error);
    }
  },

  async actualizarHistoriaClinica(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const paciente = await PacienteModel.findById(id);
      if (!paciente) throw new AppError("Paciente no encontrado", 404);

      await PacienteModel.upsertHistoriaClinica(id, req.body);
      await auditar(req, { entidad: "historia_clinica", pacienteId: id, accion: "editar", resumen: "Actualizó la historia clínica", cambios: req.body });
      const historia = await PacienteModel.getHistoriaClinica(id);
      res.json({ ok: true, data: historia, mensaje: "Historia clinica actualizada" });
    } catch (error) {
      next(error);
    }
  },

  async actualizarAnamnesis(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const paciente = await PacienteModel.findById(id);
      if (!paciente) throw new AppError("Paciente no encontrado", 404);

      await PacienteModel.upsertAnamnesis(id, req.body);
      await auditar(req, { entidad: "anamnesis", pacienteId: id, accion: "editar", resumen: "Actualizó la anamnesis alimentaria", cambios: req.body });
      const anamnesis = await PacienteModel.getAnamnesis(id);
      res.json({ ok: true, data: anamnesis, mensaje: "Anamnesis actualizada" });
    } catch (error) {
      next(error);
    }
  },
};