import { Router } from "express";
import {
  ConfiguracionController,
  actualizarPerfilValidators,
  cambiarPasswordValidators,
} from "../controllers/configuracion.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/publica", ConfiguracionController.obtenerPublica);

router.use(authMiddleware);

// GET /api/configuracion
router.get("/", ConfiguracionController.obtener);

// PUT /api/configuracion/perfil
router.put("/perfil", actualizarPerfilValidators, ConfiguracionController.actualizarPerfil);

// PUT /api/configuracion/password
router.put("/password", cambiarPasswordValidators, ConfiguracionController.cambiarPassword);

// PUT /api/configuracion/config
router.put("/config", ConfiguracionController.actualizarConfig);

export default router;