import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { BlogModel } from "../models/blog.model";
import { AuthRequest } from "../types";
import { AppError } from "../middlewares/error.middleware";
import { Request } from "express";

export const crearPostValidators = [
  body("titulo").notEmpty().withMessage("El título es requerido").trim(),
  body("contenido").notEmpty().withMessage("El contenido es requerido"),
  body("estado").optional().isIn(["borrador", "publicado", "archivado"]),
];

export const BlogController = {

  // ── CATEGORIAS ───────────────────────────────────────────────────
  async listarCategorias(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categorias = await BlogModel.getCategorias();
      res.json({ ok: true, data: categorias });
    } catch (error) { next(error); }
  },

  async crearCategoria(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nombre } = req.body;
      if (!nombre) { res.status(400).json({ ok: false, mensaje: "Nombre requerido" }); return; }
      const id = await BlogModel.createCategoria(nombre);
      const categorias = await BlogModel.getCategorias();
      const nueva = categorias.find(c => c.id === id);
      res.status(201).json({ ok: true, data: nueva });
    } catch (error) { next(error); }
  },

  // ── POSTS (panel) ────────────────────────────────────────────────
  async listar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const estado = req.query.estado as string | undefined;
      const posts = await BlogModel.findAll(estado);
      res.json({ ok: true, data: posts });
    } catch (error) { next(error); }
  },

  async obtener(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const post = await BlogModel.findById(id);
      if (!post) throw new AppError("Post no encontrado", 404);
      const recetas = await BlogModel.getRecetas(id);
      res.json({ ok: true, data: { ...post, recetas } });
    } catch (error) { next(error); }
  },

  async crear(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) });
        return;
      }
      const { receta_ids, ...postData } = req.body;
      const id = await BlogModel.create(postData);
      if (receta_ids && Array.isArray(receta_ids) && receta_ids.length > 0) {
        await BlogModel.setRecetas(id, receta_ids);
      }
      const post = await BlogModel.findById(id);
      const recetas = await BlogModel.getRecetas(id);
      res.status(201).json({ ok: true, data: { ...post, recetas }, mensaje: "Post creado correctamente" });
    } catch (error) { next(error); }
  },

  async actualizar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) });
        return;
      }
      const id = Number(req.params.id);
      const post = await BlogModel.findById(id);
      if (!post) throw new AppError("Post no encontrado", 404);

      const { receta_ids, ...postData } = req.body;
      await BlogModel.update(id, postData);
      await BlogModel.setRecetas(id, receta_ids ?? []);

      const actualizado = await BlogModel.findById(id);
      const recetas = await BlogModel.getRecetas(id);
      res.json({ ok: true, data: { ...actualizado, recetas }, mensaje: "Post actualizado correctamente" });
    } catch (error) { next(error); }
  },

  async eliminar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const post = await BlogModel.findById(id);
      if (!post) throw new AppError("Post no encontrado", 404);
      await BlogModel.delete(id);
      res.json({ ok: true, mensaje: "Post eliminado correctamente" });
    } catch (error) { next(error); }
  },

  // ── PÚBLICO (sin auth) ───────────────────────────────────────────
  async listarPublico(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const posts = await BlogModel.findAll("publicado");
      res.json({ ok: true, data: posts });
    } catch (error) { next(error); }
  },

  async obtenerPublico(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const post = await BlogModel.findBySlug(req.params.slug);
      if (!post || post.estado !== "publicado") throw new AppError("Post no encontrado", 404);
      const recetas = await BlogModel.getRecetas(post.id);
      res.json({ ok: true, data: { ...post, recetas } });
    } catch (error) { next(error); }
  },
};