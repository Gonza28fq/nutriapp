import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface RecetaRow extends RowDataPacket {
  id: number;
  nombre: string;
  descripcion?: string;
  ingredientes: string;
  preparacion?: string;
  calorias_kcal?: number;
  proteinas_g?: number;
  carbohidratos_g?: number;
  grasas_g?: number;
  fibra_g?: number;
  sodio_mg?: number;
  porciones?: number;
  categoria?: string;
  tiempo_preparacion_min?: number;
  dificultad?: string;
  apta_celiacos?: number;
  apta_diabeticos?: number;
  apta_hipertensos?: number;
  apta_vegetarianos?: number;
  imagen_url?: string;
  notas?: string;
  paciente_id?: number;
  activa: number;
  creado_en: string;
}

export const RecetaModel = {

  async findAll(params: { paciente_id?: number; busqueda?: string; categoria?: string }) {
    let query = `
      SELECT r.*,
        CASE WHEN r.paciente_id IS NULL THEN 'global' ELSE 'paciente' END as tipo
      FROM recetas r
      WHERE r.activa = 1
    `;
    const values: unknown[] = [];

    if (params.paciente_id) {
      query += ` AND (r.paciente_id IS NULL OR r.paciente_id = ?)`;
      values.push(params.paciente_id);
    } else {
      query += ` AND r.paciente_id IS NULL`;
    }

    if (params.busqueda) {
      query += ` AND r.nombre LIKE ?`;
      values.push(`%${params.busqueda}%`);
    }

    if (params.categoria) {
      query += ` AND r.categoria = ?`;
      values.push(params.categoria);
    }

    query += ` ORDER BY r.nombre ASC`;

    const [rows] = await pool.query<RecetaRow[]>(query, values);
    return rows;
  },

  async findById(id: number): Promise<RecetaRow | null> {
    const [rows] = await pool.query<RecetaRow[]>(
      "SELECT * FROM recetas WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] ?? null;
  },

  async create(data: Partial<RecetaRow>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO recetas (
        nombre, descripcion, ingredientes, preparacion,
        calorias_kcal, proteinas_g, carbohidratos_g, grasas_g, fibra_g, sodio_mg,
        porciones, categoria, tiempo_preparacion_min, dificultad,
        apta_celiacos, apta_diabeticos, apta_hipertensos, apta_vegetarianos,
        imagen_url, notas, paciente_id, activa
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
      [
        data.nombre,
        data.descripcion ?? null,
        data.ingredientes,
        data.preparacion ?? null,
        data.calorias_kcal ?? null,
        data.proteinas_g ?? null,
        data.carbohidratos_g ?? null,
        data.grasas_g ?? null,
        data.fibra_g ?? null,
        data.sodio_mg ?? null,
        data.porciones ?? 1,
        data.categoria ?? null,
        data.tiempo_preparacion_min ?? null,
        data.dificultad ?? "facil",
        data.apta_celiacos ? 1 : 0,
        data.apta_diabeticos ? 1 : 0,
        data.apta_hipertensos ? 1 : 0,
        data.apta_vegetarianos ? 1 : 0,
        data.imagen_url ?? null,
        data.notas ?? null,
        data.paciente_id ?? null,
      ]
    );
    return result.insertId;
  },

  async update(id: number, data: Partial<RecetaRow>): Promise<void> {
    await pool.query(
      `UPDATE recetas SET
        nombre=?, descripcion=?, ingredientes=?, preparacion=?,
        calorias_kcal=?, proteinas_g=?, carbohidratos_g=?, grasas_g=?, fibra_g=?, sodio_mg=?,
        porciones=?, categoria=?, tiempo_preparacion_min=?, dificultad=?,
        apta_celiacos=?, apta_diabeticos=?, apta_hipertensos=?, apta_vegetarianos=?,
        imagen_url=?, notas=?
      WHERE id=?`,
      [
        data.nombre,
        data.descripcion ?? null,
        data.ingredientes,
        data.preparacion ?? null,
        data.calorias_kcal ?? null,
        data.proteinas_g ?? null,
        data.carbohidratos_g ?? null,
        data.grasas_g ?? null,
        data.fibra_g ?? null,
        data.sodio_mg ?? null,
        data.porciones ?? 1,
        data.categoria ?? null,
        data.tiempo_preparacion_min ?? null,
        data.dificultad ?? "facil",
        data.apta_celiacos ? 1 : 0,
        data.apta_diabeticos ? 1 : 0,
        data.apta_hipertensos ? 1 : 0,
        data.apta_vegetarianos ? 1 : 0,
        data.imagen_url ?? null,
        data.notas ?? null,
        id,
      ]
    );
  },

  async softDelete(id: number): Promise<void> {
    await pool.query("UPDATE recetas SET activa = 0 WHERE id = ?", [id]);
  },
};