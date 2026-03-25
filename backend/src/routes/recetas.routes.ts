import { Router } from "express";
import { RecetaController, crearRecetaValidators } from "../controllers/receta.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

// GET /api/recetas?paciente_id=&busqueda=&categoria=
router.get("/", RecetaController.listar);

// GET /api/recetas/:id
router.get("/:id", RecetaController.obtener);

// POST /api/recetas
router.post("/", crearRecetaValidators, RecetaController.crear);

// PUT /api/recetas/:id
router.put("/:id", crearRecetaValidators, RecetaController.actualizar);

// DELETE /api/recetas/:id
router.delete("/:id", RecetaController.eliminar);

export default router;