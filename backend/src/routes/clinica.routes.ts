import { Router } from "express";
import { param } from "express-validator";
import {
  ClinicaController as C, validarMedicion, validarLaboratorio, validarEstudio, validarPatologia,
} from "../controllers/clinica.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validarId, validar } from "../middlewares/validation.middleware";

// Montado en /api. Cada ruta exige sesión (auth por ruta, no router.use:
// así este router no intercepta otras rutas de /api).
const router = Router();

const validarCodigo = [param("codigo").matches(/^[a-z0-9_]{2,30}$/).withMessage("Código inválido"), validar];

// Patologías
router.get("/patologias",                           authMiddleware, C.catalogoPatologias);
router.get("/patologias/:codigo/pacientes",         authMiddleware, validarCodigo, C.pacientesPorPatologia);
router.get("/pacientes/:id/patologias",             authMiddleware, validarId, C.patologiasDePaciente);
router.put("/pacientes/:id/patologias/:patologiaId",    authMiddleware, validarId, validarPatologia, C.guardarPatologia);
router.delete("/pacientes/:id/patologias/:patologiaId", authMiddleware, validarId, validarPatologia, C.quitarPatologia);

// Progreso (gráficos)
router.get("/pacientes/:id/progreso",               authMiddleware, validarId, C.progreso);

// Mediciones
router.post("/pacientes/:id/mediciones",            authMiddleware, validarId, validarMedicion(), C.crearMedicion);
router.put("/mediciones/:id",                       authMiddleware, validarId, validarMedicion(true), C.actualizarMedicion);
router.delete("/mediciones/:id",                    authMiddleware, validarId, C.borrarMedicion);

// Laboratorios
router.get("/pacientes/:id/laboratorios",           authMiddleware, validarId, C.laboratorios);
router.post("/pacientes/:id/laboratorios",          authMiddleware, validarId, validarLaboratorio(), C.crearLaboratorio);
router.put("/laboratorios/:id",                     authMiddleware, validarId, validarLaboratorio(true), C.actualizarLaboratorio);
router.delete("/laboratorios/:id",                  authMiddleware, validarId, C.borrarLaboratorio);

// Estudios
router.get("/pacientes/:id/estudios",               authMiddleware, validarId, C.estudios);
router.post("/pacientes/:id/estudios",              authMiddleware, validarId, validarEstudio(), C.crearEstudio);
router.put("/estudios/:id",                         authMiddleware, validarId, validarEstudio(true), C.actualizarEstudio);
router.delete("/estudios/:id",                      authMiddleware, validarId, C.borrarEstudio);

export default router;
