import { Router } from "express";
import { TurnoController, crearTurnoValidators } from "../controllers/turno.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validarId, validarActualizarEstado } from "../middlewares/validation.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/",                              TurnoController.porFecha);
router.get("/rango",                         TurnoController.porRango);
router.post("/",    crearTurnoValidators,    TurnoController.crear);
router.get("/:id",  validarId,               TurnoController.obtener);
router.patch("/:id/estado", validarId, validarActualizarEstado, TurnoController.actualizarEstado);
router.put("/:id",  validarId, crearTurnoValidators, TurnoController.actualizar);
router.delete("/:id", validarId,             TurnoController.eliminar);

export default router;