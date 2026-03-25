import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

// ── Helper para capturar errores ──────────────────────────────────
export function validar(req: Request, res: Response, next: NextFunction): void {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    res.status(400).json({
      ok:      false,
      mensaje: errores.array()[0].msg,
      errores: errores.array().map(e => e.msg),
    });
    return;
  }
  next();
}

// ── IDs genéricos ─────────────────────────────────────────────────
export const validarId = [
  param("id")
    .isInt({ min: 1 }).withMessage("ID inválido"),
  validar,
];

export const validarParamPacienteId = [
  param("pacienteId")
    .isInt({ min: 1 }).withMessage("ID de paciente inválido"),
  validar,
];

export const validarSlug = [
  param("slug")
    .notEmpty().withMessage("El slug es requerido")
    .matches(/^[a-z0-9-]+$/).withMessage("Slug inválido")
    .isLength({ max: 200 }).withMessage("Slug demasiado largo"),
  validar,
];

// ── Auth ──────────────────────────────────────────────────────────
export const validarLogin = [
  body("email")
    .isEmail().withMessage("Email inválido")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("La contraseña es requerida")
    .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres")
    .trim(),
  validar,
];

export const validarCambiarPassword = [
  body("passwordActual")
    .notEmpty().withMessage("La contraseña actual es requerida"),
  body("passwordNueva")
    .isLength({ min: 8 }).withMessage("La nueva contraseña debe tener al menos 8 caracteres")
    .matches(/[A-Z]/).withMessage("La contraseña debe tener al menos una mayúscula")
    .matches(/[0-9]/).withMessage("La contraseña debe tener al menos un número"),
  validar,
];

// ── Pacientes ─────────────────────────────────────────────────────
export const validarCrearPaciente = [
  body("nombre")
    .notEmpty().withMessage("El nombre es requerido")
    .trim()
    .isLength({ max: 100 }).withMessage("El nombre no puede superar 100 caracteres"),
  body("apellido")
    .notEmpty().withMessage("El apellido es requerido")
    .trim()
    .isLength({ max: 100 }).withMessage("El apellido no puede superar 100 caracteres"),
  body("dni")
    .optional({ checkFalsy: true })
    .matches(/^\d{7,8}$/).withMessage("El DNI debe tener 7 u 8 dígitos"),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail().withMessage("Email inválido")
    .normalizeEmail(),
  body("celular")
    .optional()
    .isLength({ max: 20 }).withMessage("Celular inválido"),
  body("edad")
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 120 }).withMessage("Edad inválida (0-120)"),
  body("sexo")
    .optional({ checkFalsy: true })
    .isIn(["masculino", "femenino", "otro"]).withMessage("Sexo inválido"),
  body("prioridad")
    .optional({ checkFalsy: true })
    .isIn(["normal", "alta", "urgente"]).withMessage("Prioridad inválida"),
  body("motivo_prioridad")
    .optional()
    .isLength({ max: 255 }).withMessage("El motivo no puede superar 255 caracteres"),
  validar,
];

// ── Turnos ────────────────────────────────────────────────────────
export const validarCrearTurno = [
  body("fecha")
    .notEmpty().withMessage("La fecha es requerida")
    .isDate().withMessage("Formato de fecha inválido (YYYY-MM-DD)"),
  body("sede_id")
    .notEmpty().withMessage("La sede es requerida")
    .isInt({ min: 1 }).withMessage("Sede inválida"),
  body("tipo_consulta")
    .notEmpty().withMessage("El tipo de consulta es requerido")
    .isIn(["primera_vez", "control", "seguimiento"]).withMessage("Tipo de consulta inválido"),
  body("estado")
    .optional()
    .isIn(["pendiente", "presente", "ausente", "cancelado"]).withMessage("Estado inválido"),
  body("hora")
    .optional({ checkFalsy: true })
    .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage("Formato de hora inválido (HH:MM)"),
  body("paciente_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("ID de paciente inválido"),
  validar,
];

export const validarActualizarEstado = [
  body("estado")
    .notEmpty().withMessage("El estado es requerido")
    .isIn(["pendiente", "presente", "ausente", "cancelado"]).withMessage("Estado inválido"),
  validar,
];

// ── Consultas ─────────────────────────────────────────────────────
export const validarCrearConsulta = [
  body("paciente_id")
    .notEmpty().withMessage("El paciente es requerido")
    .isInt({ min: 1 }).withMessage("ID de paciente inválido"),
  body("fecha")
    .notEmpty().withMessage("La fecha es requerida")
    .isDate().withMessage("Formato de fecha inválido (YYYY-MM-DD)"),
  body("tipo_consulta")
    .notEmpty().withMessage("El tipo de consulta es requerido")
    .isIn(["primera_vez", "control", "seguimiento"]).withMessage("Tipo de consulta inválido"),
  body("sede_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("Sede inválida"),
  body("medicion.peso_kg")
    .optional({ checkFalsy: true })
    .isFloat({ min: 1, max: 500 }).withMessage("Peso inválido (1-500 kg)"),
  body("medicion.talla_cm")
    .optional({ checkFalsy: true })
    .isFloat({ min: 30, max: 250 }).withMessage("Talla inválida (30-250 cm)"),
  body("medicion.porcentaje_masa_grasa")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 100 }).withMessage("Porcentaje de masa grasa inválido (0-100)"),
  body("medicion.porcentaje_masa_magra")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 100 }).withMessage("Porcentaje de masa magra inválido (0-100)"),
  body("medicion.presion_sistolica")
    .optional({ checkFalsy: true })
    .isInt({ min: 50, max: 300 }).withMessage("Presión sistólica inválida (50-300)"),
  body("medicion.presion_diastolica")
    .optional({ checkFalsy: true })
    .isInt({ min: 30, max: 200 }).withMessage("Presión diastólica inválida (30-200)"),
  body("medicion.frecuencia_cardiaca")
    .optional({ checkFalsy: true })
    .isInt({ min: 20, max: 300 }).withMessage("Frecuencia cardíaca inválida (20-300)"),
  validar,
];

// ── Blog ──────────────────────────────────────────────────────────
export const validarCrearPost = [
  body("titulo")
    .notEmpty().withMessage("El título es requerido")
    .trim()
    .isLength({ max: 200 }).withMessage("El título no puede superar 200 caracteres"),
  body("contenido")
    .notEmpty().withMessage("El contenido es requerido"),
  body("estado")
    .optional()
    .isIn(["borrador", "publicado", "archivado"]).withMessage("Estado inválido"),
  body("categoria_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("ID de categoría inválido"),
  body("receta_ids")
    .optional()
    .isArray().withMessage("receta_ids debe ser un array"),
  body("receta_ids.*")
    .optional()
    .isInt({ min: 1 }).withMessage("ID de receta inválido"),
  validar,
];