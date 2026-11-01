import { Response, NextFunction } from "express";
import { body, param } from "express-validator";
import { ClinicaModel } from "../models/clinica.model";
import { PacienteModel } from "../models/paciente.model";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/error.middleware";
import { validar } from "../middlewares/validation.middleware";
import { auditar } from "../utils/auditoria";

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

const CATEGORIAS = ["peso", "metabolica", "cardiovascular", "digestiva", "endocrina", "otra"];
export const validarCatalogo = (opcional = false) => [
  (opcional ? body("nombre").optional() : body("nombre")).trim().notEmpty().withMessage("El nombre es requerido")
    .isLength({ max: 80 }).withMessage("Nombre demasiado largo"),
  body("sigla").optional({ values: "falsy" }).trim().isLength({ max: 12 }).withMessage("Sigla demasiado larga (máx. 12)"),
  body("categoria").optional().isIn(CATEGORIAS).withMessage("Categoría inválida"),
  body("color").optional({ values: "falsy" }).matches(/^#[0-9a-fA-F]{6}$/).withMessage("Color inválido"),
  body("activa").optional().isBoolean(),
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
type TablaClinica = "mediciones" | "laboratorios" | "estudios";
const ENTIDAD: Record<TablaClinica, string> = { mediciones: "medicion", laboratorios: "laboratorio", estudios: "estudio" };

/** Crea un registro clínico del paciente y deja la traza. */
const crearRegistro = (tabla: TablaClinica, crear: (pid: number, d: Record<string, unknown>) => Promise<number>, resumen: (d: any) => string) =>
  h(async (req, res) => {
    const pacienteId = idParam(req);
    await pacienteExistente(pacienteId);
    const id = await crear(pacienteId, req.body);
    await auditar(req, { entidad: ENTIDAD[tabla], entidadId: id, pacienteId, accion: "crear", resumen: resumen(req.body), cambios: req.body });
    res.status(201).json({ ok: true, data: { id } });
  });

/** Edita un registro clínico; la traza queda vinculada al paciente dueño de la fila. */
const editarRegistro = (tabla: TablaClinica, editar: (id: number, d: Record<string, unknown>) => Promise<boolean>, que: string) =>
  h(async (req, res) => {
    const fila = await ClinicaModel.fila(tabla, idParam(req));
    noEncontrado(!!fila, que);
    await editar(idParam(req), req.body);
    await auditar(req, { entidad: ENTIDAD[tabla], entidadId: idParam(req), pacienteId: Number(fila!.paciente_id), accion: "editar", resumen: `${que} del ${fila!.fecha}`, cambios: req.body });
    res.json({ ok: true });
  });

const borrarRegistro = (tabla: TablaClinica, borrarFn: (id: number) => Promise<boolean>, que: string) =>
  h(async (req, res) => {
    const fila = await ClinicaModel.fila(tabla, idParam(req));
    noEncontrado(!!fila, que);
    await borrarFn(idParam(req));
    await auditar(req, { entidad: ENTIDAD[tabla], entidadId: idParam(req), pacienteId: Number(fila!.paciente_id), accion: "borrar", resumen: `${que} del ${fila!.fecha}`, cambios: fila! });
    res.json({ ok: true });
  });

export const ClinicaController = {
  catalogoPatologias: h(async (_req, res) => {
    res.json({ ok: true, data: await ClinicaModel.catalogoPatologias() });
  }),

  crearPatologiaCatalogo: h(async (req, res) => {
    const nueva = await ClinicaModel.crearPatologia(req.body);
    if ("repetida" in nueva) throw new AppError(`Ya existe la patología "${nueva.repetida!.nombre}"`, 409);
    await auditar(req, { entidad: "patologia", entidadId: nueva.id, accion: "crear", resumen: `Agregó al catálogo: ${req.body.nombre}`, cambios: req.body });
    res.status(201).json({ ok: true, data: nueva });
  }),

  actualizarPatologiaCatalogo: h(async (req, res) => {
    const id = idParam(req);
    noEncontrado(await ClinicaModel.actualizarPatologia(id, req.body), "Patología");
    const accion = req.body.activa === false ? "baja" : req.body.activa === true ? "reactivar" : "editar";
    await auditar(req, { entidad: "patologia", entidadId: id, accion, resumen: "Modificó el catálogo de patologías", cambios: req.body });
    res.json({ ok: true });
  }),

  pacientesPorPatologia: h(async (req, res) => {
    res.json({ ok: true, data: await ClinicaModel.pacientesConPatologia(String(req.params.codigo)) });
  }),

  patologiasDePaciente: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    res.json({ ok: true, data: await ClinicaModel.patologiasDePaciente(idParam(req)) });
  }),

  guardarPatologia: h(async (req, res) => {
    const pacienteId = idParam(req);
    await pacienteExistente(pacienteId);
    const pat = await ClinicaModel.patologia(idParam(req, "patologiaId"));
    if (!pat) throw new AppError("Patología no encontrada", 404);
    await ClinicaModel.guardarPatologia(pacienteId, Number(pat.id), req.body);
    const descartada = req.body.activa === false;
    await auditar(req, {
      entidad: "patologia", entidadId: Number(pat.id), pacienteId, accion: "editar",
      resumen: `${descartada ? "Descartó" : "Registró"} ${pat.nombre}${req.body.grado ? ` (${req.body.grado})` : ""}`,
      cambios: req.body,
    });
    res.json({ ok: true, data: await ClinicaModel.patologiasDePaciente(pacienteId) });
  }),

  quitarPatologia: h(async (req, res) => {
    const pacienteId = idParam(req);
    const pat = await ClinicaModel.patologia(idParam(req, "patologiaId"));
    if (!pat) throw new AppError("Patología no encontrada", 404);
    await ClinicaModel.quitarPatologiaManual(pacienteId, Number(pat.id));
    await auditar(req, { entidad: "patologia", entidadId: Number(pat.id), pacienteId, accion: "borrar", resumen: `Quitó la carga manual de ${pat.nombre} (vuelve al cálculo automático)` });
    res.json({ ok: true, data: await ClinicaModel.patologiasDePaciente(pacienteId) });
  }),

  progreso: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    res.json({ ok: true, data: await ClinicaModel.progreso(idParam(req)) });
  }),

  seguimiento: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    res.json({ ok: true, data: await ClinicaModel.seguimiento(idParam(req)) });
  }),

  crearMedicion: crearRegistro("mediciones", ClinicaModel.crearMedicion,
    (d) => `Medición del ${d.fecha}${d.peso_kg ? ` · ${d.peso_kg} kg` : ""}`),
  actualizarMedicion: editarRegistro("mediciones", ClinicaModel.actualizarMedicion, "Medición"),
  borrarMedicion: borrarRegistro("mediciones", ClinicaModel.borrarMedicion, "Medición"),

  laboratorios: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    res.json({ ok: true, data: await ClinicaModel.laboratorios(idParam(req)) });
  }),
  crearLaboratorio: crearRegistro("laboratorios", ClinicaModel.crearLaboratorio,
    (d) => `Laboratorio del ${d.fecha}${d.glucemia ? ` · glucemia ${d.glucemia}` : ""}`),
  actualizarLaboratorio: editarRegistro("laboratorios", ClinicaModel.actualizarLaboratorio, "Laboratorio"),
  borrarLaboratorio: borrarRegistro("laboratorios", ClinicaModel.borrarLaboratorio, "Laboratorio"),

  estudios: h(async (req, res) => {
    await pacienteExistente(idParam(req));
    res.json({ ok: true, data: await ClinicaModel.estudios(idParam(req)) });
  }),
  crearEstudio: crearRegistro("estudios", ClinicaModel.crearEstudio, (d) => `Estudio: ${d.nombre} (${d.fecha})`),
  actualizarEstudio: editarRegistro("estudios", ClinicaModel.actualizarEstudio, "Estudio"),
  borrarEstudio: borrarRegistro("estudios", ClinicaModel.borrarEstudio, "Estudio"),
};
