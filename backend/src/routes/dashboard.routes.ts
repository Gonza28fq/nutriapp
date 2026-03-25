import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/",              DashboardController.stats);
router.get("/estadisticas",  DashboardController.estadisticas);

export default router;