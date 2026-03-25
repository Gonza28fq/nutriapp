import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface BlogPostRow extends RowDataPacket {
  id: number;
  categoria_id?: number;
  titulo: string;
  slug: string;
  resumen?: string;
  contenido: string;
  imagen_portada?: string;
  estado: "borrador" | "publicado" | "archivado";
  publicado_en?: string;
  creado_en: string;
  actualizado_en: string;
  // joins
  categoria_nombre?: string;
}

export interface BlogCategoriaRow extends RowDataPacket {
  id: number;
  nombre: string;
  slug: string;
}

function generarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const BlogModel = {

  // ── CATEGORIAS ───────────────────────────────────────────────────
  async getCategorias(): Promise<BlogCategoriaRow[]> {
    const [rows] = await pool.query<BlogCategoriaRow[]>(
      "SELECT * FROM blog_categorias ORDER BY nombre ASC"
    );
    return rows;
  },

  async createCategoria(nombre: string): Promise<number> {
    const slug = generarSlug(nombre);
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO blog_categorias (nombre, slug) VALUES (?, ?)",
      [nombre, slug]
    );
    return result.insertId;
  },

  // ── POSTS ────────────────────────────────────────────────────────
  async findAll(estado?: string): Promise<BlogPostRow[]> {
    let query = `
      SELECT bp.*, bc.nombre as categoria_nombre
      FROM blog_posts bp
      LEFT JOIN blog_categorias bc ON bp.categoria_id = bc.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (estado) {
      query += ` AND bp.estado = ?`;
      params.push(estado);
    }

    query += ` ORDER BY bp.creado_en DESC`;
    const [rows] = await pool.query<BlogPostRow[]>(query, params);
    return rows;
  },

  async findById(id: number): Promise<BlogPostRow | null> {
    const [rows] = await pool.query<BlogPostRow[]>(
      `SELECT bp.*, bc.nombre as categoria_nombre
       FROM blog_posts bp
       LEFT JOIN blog_categorias bc ON bp.categoria_id = bc.id
       WHERE bp.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async findBySlug(slug: string): Promise<BlogPostRow | null> {
    const [rows] = await pool.query<BlogPostRow[]>(
      `SELECT bp.*, bc.nombre as categoria_nombre
       FROM blog_posts bp
       LEFT JOIN blog_categorias bc ON bp.categoria_id = bc.id
       WHERE bp.slug = ? LIMIT 1`,
      [slug]
    );
    return rows[0] ?? null;
  },

  async getRecetas(postId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.nombre, r.calorias_kcal, r.categoria
       FROM blog_post_recetas bpr
       JOIN recetas r ON bpr.receta_id = r.id
       WHERE bpr.post_id = ?`,
      [postId]
    );
    return rows;
  },

  async create(data: Partial<BlogPostRow>): Promise<number> {
    const slug = generarSlug(data.titulo ?? "post");
    // verificar slug único
    let slugFinal = slug;
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM blog_posts WHERE slug = ?", [slug]
    );
    if ((existing as any[]).length > 0) {
      slugFinal = `${slug}-${Date.now()}`;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO blog_posts
        (categoria_id, titulo, slug, resumen, contenido, imagen_portada, estado, publicado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.categoria_id ?? null,
        data.titulo,
        slugFinal,
        data.resumen ?? null,
        data.contenido,
        data.imagen_portada ?? null,
        data.estado ?? "borrador",
        data.estado === "publicado" ? new Date() : null,
      ]
    );
    return result.insertId;
  },

  async update(id: number, data: Partial<BlogPostRow>): Promise<void> {
    // Si cambia a publicado y no tenía fecha, setearla
    const existing = await this.findById(id);
    const publicado_en = data.estado === "publicado" && !existing?.publicado_en
      ? new Date()
      : existing?.publicado_en ?? null;

    await pool.query(
      `UPDATE blog_posts SET
        categoria_id=?, titulo=?, resumen=?, contenido=?,
        imagen_portada=?, estado=?, publicado_en=?
       WHERE id=?`,
      [
        data.categoria_id ?? null,
        data.titulo,
        data.resumen ?? null,
        data.contenido,
        data.imagen_portada ?? null,
        data.estado ?? "borrador",
        publicado_en,
        id,
      ]
    );
  },

  async delete(id: number): Promise<void> {
    await pool.query("DELETE FROM blog_post_recetas WHERE post_id = ?", [id]);
    await pool.query("DELETE FROM blog_posts WHERE id = ?", [id]);
  },

  async setRecetas(postId: number, recetaIds: number[]): Promise<void> {
    await pool.query("DELETE FROM blog_post_recetas WHERE post_id = ?", [postId]);
    if (recetaIds.length > 0) {
      const values = recetaIds.map(rid => [postId, rid]);
      await pool.query(
        "INSERT INTO blog_post_recetas (post_id, receta_id) VALUES ?",
        [values]
      );
    }
  },
};