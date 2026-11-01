import { Response, NextFunction } from "express";
import { body, param } from "express-validator";
import { ClinicaModel } from "../models/clinica.model";
import { PacienteModel } from "../models/paciente.model";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/error.middleware";
import { validar } from "../middlewares/validation.middleware";

// ── Validadores ───────────────────────────────────────────────────────────
// Rangos fisiológicos amplios: frenan errores de tipeo (950 kg, glucemia 5)
// sin rechazar valores clínicos reales.
const rango = (campo: string, min: number, max: number, etiqueta: string) =>
  body(campo).optional({ values: "falsy" }).isFloat({ min, max })
    .withMessage(`${etiqueta}: tiene que estar entre ${min} y ${max}`);

const fecha = (opcional = false) => {
  const v = body("fecha");
  return (opcional ? v.optional() : v.notEmpty().withMessage("La fecha es requerida"))
    .isISO8601({ strict: true }).withMessage("Fecha inválida (AAAA-MM-DD)");
};

export const validarMedicion = (opcional = false) => [
  fecha(opcional),
  rango("peso_kg", 1, 400, "Peso"),
  rango("talla_cm", 30, 250, "Talla"),
  rango("circunferencia_cintura_cm", 20, 250, "Cintura"),
  rango("circunferencia_cadera_cm", 20, 250, "Cadera"),
  rango("perimetro_cuello_cm", 10, 80, "Cuello"),
  rango("perimetro_brazo_cm", 5, 80, "Brazo"),
  rango("perimetro_torax_cm", 30, 250, "Tórax"),
  rango("perimetro_abdomen_cm", 20, 250, "Abdomen"),
  rango("perimetro_muslo_cm", 10, 120, "Muslo"),
  rango("perimetro_pantorrilla_cm", 10, 80, "Pantorrilla"),
  rango("porcentaje_masa_grasa", 1, 80, "% de grasa"),
  rango("porcentaje_masa_magra", 10, 99, "% de masa magra"),
  rango("masa_muscular_kg", 1, 150, "Masa muscular"),
  rango("grasa_visceral_nivel", 1, 60, "Grasa visceral"),
  rango("agua_corporal_pct", 10, 90, "% de agua"),
  rango("presion_sistolica", 50, 300, "Presión sistólica"),
  rango("presion_diastolica", 20, 200, "Presión diastólica"),
  rango("frecuencia_cardiaca", 20, 250, "Frecuencia cardíaca"),
  validar,
];

export const validarLaboratorio = (opcional = false) => [
  fecha(opcional),
  rango("glucemia", 20, 800, "Glucemia"),
  rango("hemoglobina_glicosilada", 3, 20, "HbA1c"),
  rango("insulina", 0, 500, "Insulina"),
  rango("homa_ir", 0, 50, "HOMA-IR"),
  rango("colesterol_total", 50, 600, "Colesterol total"),
  rango("hdl", 5, 200, "HDL"),
  rango("ldl", 5, 500, "LDL"),
  rango("trigliceridos", 10, 3000, "Triglicéridos"),
  validar,
];

export const validarEstudio = (opcional = false) => [
  fecha(opcional),
  (opcional ? body("nombre").optional() : body("nombre")).trim().notEmpty().withMessage("El nombre del estudio es requerido")
    .isLength({ max: 150 }).withMessage("Nombre demasiado largo"),
  body("tipo").optional().isIn(["laboratorio", "imagen", "cardiologico", "bioimpedancia", "densitometria", "otro"])
    .withMessage("Tipo de estudio inválido"),
  validar,
];

export const validarPatologia = [
  param("patologiaId").isInt({ min: 1 }).withMessage("Patología inválida"),
  body("fecha_diagnostico").optional({ values: "falsy" }).isISO8601({ strict: true }).withMessage("Fecha inválida"),
  body("activa").optional().isBoolean().withMessage("activa tiene que ser true/false"),
  body("grado").optional({ values: "null" }).isLength({ max: 30 }),
  validar,
];

// ── Helpers ───────────────────────────────────────────────────────────────
async function pacienteExistente(id: number) {
  const p = await PacienteModel.findById(id);
  if (!p) throw new AppError("Paciente no encontrado", 404);
  return p;
}
const idParam = (req: AuthRequest, nombre = "id") => Number(req.params[nombre]);

type Handler = (req: AuthRequest, res: Response) => Promise<void>;
const h = (fn: Handler) => (req: AuthRequest, res: Response, next: NextFunction) => fn(req, res).catch(next);
const noEncontrado = (ok: boolean, que: string) => { if (!ok) throw new AppError(`${que} no encontrado`, 404); };

// ── Controlador ───────────────────────────────────────────────────────────
export const ClinicaController = {
  catalogoPatologias: h(async (_req, res) => {
    res.json({ ok: true, data: await ClinicaModel.catalogoPatologias() });
  }),

  pacientesPorPatologia: h(async (req, res) => {
    res.json({ ok: true, data: await ClinicaModel.pacientesConPatologia(String(req.params.codigo)) });
  }),

  patologiasDePaciente: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    res.json({ ok: true, data: await ClinicaModel.patologiasDePaciente(idParam(req)) });
  }),

  guardarPatologia: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    await ClinicaModel.guardarPatologia(idParam(req), idParam(req, "patologiaId"), req.body);
    res.json({ ok: true, data: await ClinicaModel.patologiasDePaciente(idParam(req)) });
  }),

  quitarPatologia: h(async (req, res) => {
    await ClinicaModel.quitarPatologiaManual(idParam(req), idParam(req, "patologiaId"));
    res.json({ ok: true, data: await ClinicaModel.patologiasDePaciente(idParam(req)) });
  }),

  progreso: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    res.json({ ok: true, data: await ClinicaModel.progreso(idParam(req)) });
  }),

  crearMedicion: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    const id = await ClinicaModel.crearMedicion(idParam(req), req.body);
    res.status(201).json({ ok: true, data: { id } });
  }),
  actualizarMedicion: h(async (req, res) => {
    noEncontrado(await ClinicaModel.actualizarMedicion(idParam(req), req.body), "Medición");
    res.json({ ok: true });
  }),
  borrarMedicion: h(async (req, res) => {
    noEncontrado(await ClinicaModel.borrarMedicion(idParam(req)), "Medición");
    res.json({ ok: true });
  }),

  laboratorios: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    res.json({ ok: true, data: await ClinicaModel.laboratorios(idParam(req)) });
  }),
  crearLaboratorio: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    const id = await ClinicaModel.crearLaboratorio(idParam(req), req.body);
    res.status(201).json({ ok: true, data: { id } });
  }),
  actualizarLaboratorio: h(async (req, res) => {
    noEncontrado(await ClinicaModel.actualizarLaboratorio(idParam(req), req.body), "Laboratorio");
    res.json({ ok: true });
  }),
  borrarLaboratorio: h(async (req, res) => {
    noEncontrado(await ClinicaModel.borrarLaboratorio(idParam(req)), "Laboratorio");
    res.json({ ok: true });
  }),

  estudios: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    res.json({ ok: true, data: await ClinicaModel.estudios(idParam(req)) });
  }),
  crearEstudio: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    const id = await ClinicaModel.crearEstudio(idParam(req), req.body);
    res.status(201).json({ ok: true, data: { id } });
  }),
  actualizarEstudio: h(async (req, res) => {
    noEncontrado(await ClinicaModel.actualizarEstudio(idParam(req), req.body), "Estudio");
    res.json({ ok: true });
  }),
  borrarEstudio: h(async (req, res) => {
    noEncontrado(await ClinicaModel.borrarEstudio(idParam(req)), "Estudio");
    res.json({ ok: true });
  }),
};
