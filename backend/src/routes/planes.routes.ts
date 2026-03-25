import { Router } from "express";
import { PlanController, crearPlanValidators, crearComidaValidators } from "../controllers/plan.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

// GET /api/planes?paciente_id=
router.get("/", PlanController.listar);

// GET /api/planes/:id
router.get("/:id", PlanController.obtener);

// POST /api/planes
router.post("/", crearPlanValidators, PlanController.crear);

// PUT /api/planes/:id
router.put("/:id", PlanController.actualizar);

// DELETE /api/planes/:id
router.delete("/:id", PlanController.eliminar);

// POST /api/planes/:id/comidas
router.post("/:id/comidas", crearComidaValidators, PlanController.agregarComida);

// PUT /api/planes/:id/comidas/:comidaId
router.put("/:id/comidas/:comidaId", PlanController.actualizarComida);

// DELETE /api/planes/:id/comidas/:comidaId
router.delete("/:id/comidas/:comidaId", PlanController.eliminarComida);

export default router;