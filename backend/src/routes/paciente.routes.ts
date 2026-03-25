import { Router } from "express";
import { PacienteController, crearPacienteValidators } from "../controllers/paciente.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validarId } from "../middlewares/validation.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/",                              PacienteController.listar);
router.post("/",    crearPacienteValidators, PacienteController.crear);
router.get("/:id",  validarId,               PacienteController.obtener);
router.put("/:id",  validarId, crearPacienteValidators, PacienteController.actualizar);
router.delete("/:id",          validarId,    PacienteController.desactivar);
router.patch("/:id/reactivar", validarId,    PacienteController.reactivar);
router.put("/:id/historia-clinica", validarId, PacienteController.actualizarHistoriaClinica);
router.put("/:id/anamnesis",        validarId, PacienteController.actualizarAnamnesis);

export default router;