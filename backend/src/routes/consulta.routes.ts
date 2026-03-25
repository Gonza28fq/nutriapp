import { Router } from "express";
import { ConsultaController, crearConsultaValidators } from "../controllers/consulta.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validarId, validarParamPacienteId } from "../middlewares/validation.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/",                                          ConsultaController.listar);
router.post("/",    crearConsultaValidators,             ConsultaController.crear);
router.get("/paciente/:pacienteId", validarParamPacienteId, ConsultaController.porPaciente);
router.get("/:id",  validarId,                           ConsultaController.obtener);
router.put("/:id",  validarId,                           ConsultaController.actualizar);
router.delete("/:id", validarId,                         ConsultaController.eliminar);

export default router;