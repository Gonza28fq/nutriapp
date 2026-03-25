// ── sitio.controller.ts ──────────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { SitioModel } from "../models/sitio.model";

export const SitioController = {

  // GET /api/sitio/publico — sin auth, devuelve todo
  async obtenerPublico(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [secciones, testimonios, servicios, stats] = await Promise.all([
        SitioModel.getSecciones(),
        SitioModel.getTestimonios(),
        SitioModel.getServicios(),
        SitioModel.getStats(),
      ]);
      res.json({
        ok: true,
        data: {
          secciones,
          testimonios: testimonios.filter(t => t.activo !== false),
          servicios:   servicios.filter(s => s.activo !== false),
          stats,
        }
      });
    } catch (error) { next(error); }
  },

  // GET /api/sitio — con auth, devuelve todo para editar
  async obtener(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [secciones, testimonios, servicios, stats] = await Promise.all([
        SitioModel.getSecciones(),
        SitioModel.getTestimonios(),
        SitioModel.getServicios(),
        SitioModel.getStats(),
      ]);
      res.json({ ok: true, data: { secciones, testimonios, servicios, stats } });
    } catch (error) { next(error); }
  },

  // PUT /api/sitio/secciones
  async actualizarSecciones(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const secciones = req.body as Record<string, string>;
      await Promise.all(
        Object.entries(secciones).map(([clave, valor]) => SitioModel.upsertSeccion(clave, valor))
      );
      res.json({ ok: true, mensaje: "Secciones actualizadas" });
    } catch (error) { next(error); }
  },

  // POST /api/sitio/testimonios
  async crearTestimonio(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = await SitioModel.crearTestimonio(req.body);
      res.json({ ok: true, data: { id }, mensaje: "Testimonio creado" });
    } catch (error) { next(error); }
  },

  // PUT /api/sitio/testimonios/:id
  async actualizarTestimonio(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await SitioModel.actualizarTestimonio(Number(req.params.id), req.body);
      res.json({ ok: true, mensaje: "Testimonio actualizado" });
    } catch (error) { next(error); }
  },

  // DELETE /api/sitio/testimonios/:id
  async eliminarTestimonio(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await SitioModel.eliminarTestimonio(Number(req.params.id));
      res.json({ ok: true, mensaje: "Testimonio eliminado" });
    } catch (error) { next(error); }
  },

  // POST /api/sitio/servicios
  async crearServicio(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = await SitioModel.crearServicio(req.body);
      res.json({ ok: true, data: { id }, mensaje: "Servicio creado" });
    } catch (error) { next(error); }
  },

  // PUT /api/sitio/servicios/:id
  async actualizarServicio(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await SitioModel.actualizarServicio(Number(req.params.id), req.body);
      res.json({ ok: true, mensaje: "Servicio actualizado" });
    } catch (error) { next(error); }
  },

  // DELETE /api/sitio/servicios/:id
  async eliminarServicio(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await SitioModel.eliminarServicio(Number(req.params.id));
      res.json({ ok: true, mensaje: "Servicio eliminado" });
    } catch (error) { next(error); }
  },

  // POST /api/sitio/stats
  async crearStat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = await SitioModel.crearStat(req.body);
      res.json({ ok: true, data: { id }, mensaje: "Stat creada" });
    } catch (error) { next(error); }
  },

  // PUT /api/sitio/stats/:id
  async actualizarStat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await SitioModel.actualizarStat(Number(req.params.id), req.body);
      res.json({ ok: true, mensaje: "Stat actualizada" });
    } catch (error) { next(error); }
  },

  // DELETE /api/sitio/stats/:id
  async eliminarStat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await SitioModel.eliminarStat(Number(req.params.id));
      res.json({ ok: true, mensaje: "Stat eliminada" });
    } catch (error) { next(error); }
  },
};