import { Router } from "express";
import { SitioController } from "../controllers/sitio.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// ── Pública (sin auth) ────────────────────────────────────────────
router.get("/publico", SitioController.obtenerPublico);

// ── Protegidas ────────────────────────────────────────────────────
router.use(authMiddleware);

router.get("/",                         SitioController.obtener);
router.put("/secciones",                SitioController.actualizarSecciones);

router.post("/testimonios",             SitioController.crearTestimonio);
router.put("/testimonios/:id",          SitioController.actualizarTestimonio);
router.delete("/testimonios/:id",       SitioController.eliminarTestimonio);

router.post("/servicios",               SitioController.crearServicio);
router.put("/servicios/:id",            SitioController.actualizarServicio);
router.delete("/servicios/:id",         SitioController.eliminarServicio);

router.post("/stats",                   SitioController.crearStat);
router.put("/stats/:id",                SitioController.actualizarStat);
router.delete("/stats/:id",             SitioController.eliminarStat);

export default router;