import { Router } from "express";
import { BlogController, crearPostValidators } from "../controllers/blog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validarId, validarSlug } from "../middlewares/validation.middleware";

const router = Router();

router.get("/publico",           BlogController.listarPublico);
router.get("/publico/:slug", validarSlug, BlogController.obtenerPublico);

router.use(authMiddleware);

router.get("/categorias",        BlogController.listarCategorias);
router.post("/categorias",       BlogController.crearCategoria);
router.get("/",                  BlogController.listar);
router.post("/",  crearPostValidators,              BlogController.crear);
router.get("/:id",  validarId,                      BlogController.obtener);
router.put("/:id",  validarId, crearPostValidators, BlogController.actualizar);
router.delete("/:id", validarId,                    BlogController.eliminar);

export default router;