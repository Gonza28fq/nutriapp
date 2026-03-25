import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface SeccionRow extends RowDataPacket {
  id: number; clave: string; valor: string;
}
export interface TestimonioRow extends RowDataPacket {
  id: number; nombre: string; texto: string; estrellas: number; activo: boolean; orden: number;
}
export interface ServicioRow extends RowDataPacket {
  id: number; icono: string; titulo: string; descripcion: string; color: string; activo: boolean; orden: number;
}
export interface StatRow extends RowDataPacket {
  id: number; numero: string; etiqueta: string; orden: number;
}

export const SitioModel = {

  // ── Secciones (clave-valor) ──────────────────────────────────────
  async getSecciones(): Promise<Record<string, string>> {
    const [rows] = await pool.query<SeccionRow[]>("SELECT clave, valor FROM sitio_secciones");
    return Object.fromEntries((rows as SeccionRow[]).map(r => [r.clave, r.valor]));
  },

  async upsertSeccion(clave: string, valor: string): Promise<void> {
    await pool.query(
      "INSERT INTO sitio_secciones (clave, valor) VALUES (?,?) ON DUPLICATE KEY UPDATE valor=?, actualizado_en=NOW()",
      [clave, valor, valor]
    );
  },

  // ── Testimonios ─────────────────────────────────────────────────
  async getTestimonios(): Promise<TestimonioRow[]> {
    const [rows] = await pool.query<TestimonioRow[]>(
      "SELECT * FROM sitio_testimonios ORDER BY orden, id"
    );
    return rows;
  },

  async crearTestimonio(data: Partial<TestimonioRow>): Promise<number> {
    const [r] = await pool.query<ResultSetHeader>(
      "INSERT INTO sitio_testimonios (nombre, texto, estrellas, orden) VALUES (?,?,?,?)",
      [data.nombre, data.texto, data.estrellas ?? 5, data.orden ?? 0]
    );
    return r.insertId;
  },

  async actualizarTestimonio(id: number, data: Partial<TestimonioRow>): Promise<void> {
    await pool.query(
      "UPDATE sitio_testimonios SET nombre=?, texto=?, estrellas=?, activo=?, orden=? WHERE id=?",
      [data.nombre, data.texto, data.estrellas ?? 5, data.activo ? 1 : 0, data.orden ?? 0, id]
    );
  },

  async eliminarTestimonio(id: number): Promise<void> {
    await pool.query("DELETE FROM sitio_testimonios WHERE id=?", [id]);
  },

  // ── Servicios ───────────────────────────────────────────────────
  async getServicios(): Promise<ServicioRow[]> {
    const [rows] = await pool.query<ServicioRow[]>(
      "SELECT * FROM sitio_servicios ORDER BY orden, id"
    );
    return rows;
  },

  async crearServicio(data: Partial<ServicioRow>): Promise<number> {
    const [r] = await pool.query<ResultSetHeader>(
      "INSERT INTO sitio_servicios (icono, titulo, descripcion, color, orden) VALUES (?,?,?,?,?)",
      [data.icono ?? "Star", data.titulo, data.descripcion, data.color ?? "#5c8a3c", data.orden ?? 0]
    );
    return r.insertId;
  },

  async actualizarServicio(id: number, data: Partial<ServicioRow>): Promise<void> {
    await pool.query(
      "UPDATE sitio_servicios SET icono=?, titulo=?, descripcion=?, color=?, activo=?, orden=? WHERE id=?",
      [data.icono, data.titulo, data.descripcion, data.color, data.activo ? 1 : 0, data.orden ?? 0, id]
    );
  },

  async eliminarServicio(id: number): Promise<void> {
    await pool.query("DELETE FROM sitio_servicios WHERE id=?", [id]);
  },

  // ── Stats ────────────────────────────────────────────────────────
  async getStats(): Promise<StatRow[]> {
    const [rows] = await pool.query<StatRow[]>(
      "SELECT * FROM sitio_stats ORDER BY orden, id"
    );
    return rows;
  },

  async crearStat(data: Partial<StatRow>): Promise<number> {
    const [r] = await pool.query<ResultSetHeader>(
      "INSERT INTO sitio_stats (numero, etiqueta, orden) VALUES (?,?,?)",
      [data.numero, data.etiqueta, data.orden ?? 0]
    );
    return r.insertId;
  },

  async actualizarStat(id: number, data: Partial<StatRow>): Promise<void> {
    await pool.query(
      "UPDATE sitio_stats SET numero=?, etiqueta=?, orden=? WHERE id=?",
      [data.numero, data.etiqueta, data.orden ?? 0, id]
    );
  },

  async eliminarStat(id: number): Promise<void> {
    await pool.query("DELETE FROM sitio_stats WHERE id=?", [id]);
  },
};