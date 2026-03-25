import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface PlanRow extends RowDataPacket {
  id: number;
  paciente_id: number;
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: string;
  calorias_objetivo_kcal?: number;
  proteinas_objetivo_g?: number;
  carbohidratos_objetivo_g?: number;
  grasas_objetivo_g?: number;
  observaciones?: string;
  creado_en: string;
  actualizado_en: string;
  // joins
  paciente_nombre?: string;
  paciente_apellido?: string;
}

export interface PlanComidaRow extends RowDataPacket {
  id: number;
  plan_id: number;
  dia: number;
  momento: string;
  descripcion: string;
  receta_id?: number;
  calorias_kcal?: number;
  proteinas_g?: number;
  carbohidratos_g?: number;
  grasas_g?: number;
  fibra_g?: number;
  notas?: string;
  // join
  receta_nombre?: string;
}

export const PlanModel = {

  async findAll(paciente_id?: number): Promise<PlanRow[]> {
    let query = `
      SELECT p.*, pac.nombre as paciente_nombre, pac.apellido as paciente_apellido
      FROM planes p
      LEFT JOIN pacientes pac ON p.paciente_id = pac.id
      WHERE 1=1
    `;
    const values: unknown[] = [];

    if (paciente_id) {
      query += ` AND p.paciente_id = ?`;
      values.push(paciente_id);
    }

    query += ` ORDER BY p.creado_en DESC`;
    const [rows] = await pool.query<PlanRow[]>(query, values);
    return rows;
  },

  async findById(id: number): Promise<PlanRow | null> {
    const [rows] = await pool.query<PlanRow[]>(
      `SELECT p.*, pac.nombre as paciente_nombre, pac.apellido as paciente_apellido
       FROM planes p
       LEFT JOIN pacientes pac ON p.paciente_id = pac.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async getComidas(planId: number): Promise<PlanComidaRow[]> {
    const [rows] = await pool.query<PlanComidaRow[]>(
      `SELECT pc.*, r.nombre as receta_nombre
       FROM plan_comidas pc
       LEFT JOIN recetas r ON pc.receta_id = r.id
       WHERE pc.plan_id = ?
       ORDER BY pc.dia ASC, pc.momento ASC`,
      [planId]
    );
    return rows;
  },

  async create(data: Partial<PlanRow>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO planes (
        paciente_id, nombre, fecha_inicio, fecha_fin, estado,
        calorias_objetivo_kcal, proteinas_objetivo_g, carbohidratos_objetivo_g,
        grasas_objetivo_g, observaciones
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        data.paciente_id,
        data.nombre ?? null,
        data.fecha_inicio ?? null,
        data.fecha_fin ?? null,
        data.estado ?? "borrador",
        data.calorias_objetivo_kcal ?? null,
        data.proteinas_objetivo_g ?? null,
        data.carbohidratos_objetivo_g ?? null,
        data.grasas_objetivo_g ?? null,
        data.observaciones ?? null,
      ]
    );
    return result.insertId;
  },

  async update(id: number, data: Partial<PlanRow>): Promise<void> {
  await pool.query(
    `UPDATE planes SET
      nombre=?, fecha_inicio=?, fecha_fin=?, estado=?,
      calorias_objetivo_kcal=?, proteinas_objetivo_g=?,
      carbohidratos_objetivo_g=?, grasas_objetivo_g=?,
      observaciones=?, actualizado_en=NOW()
    WHERE id=?`,
    [
      data.nombre ?? null,
      data.fecha_inicio ? data.fecha_inicio.toString().slice(0, 10) : null,
      data.fecha_fin    ? data.fecha_fin.toString().slice(0, 10)    : null,
      data.estado ?? "borrador",
      data.calorias_objetivo_kcal    ?? null,
      data.proteinas_objetivo_g      ?? null,
      data.carbohidratos_objetivo_g  ?? null,
      data.grasas_objetivo_g         ?? null,
      data.observaciones ?? null,
      id,
    ]
  );
},

  async delete(id: number): Promise<void> {
    await pool.query("DELETE FROM plan_comidas WHERE plan_id = ?", [id]);
    await pool.query("DELETE FROM planes WHERE id = ?", [id]);
  },

  async addComida(planId: number, data: Partial<PlanComidaRow>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO plan_comidas (
        plan_id, dia, momento, descripcion, receta_id,
        calorias_kcal, proteinas_g, carbohidratos_g, grasas_g, fibra_g, notas
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        planId,
        data.dia,
        data.momento,
        data.descripcion,
        data.receta_id ?? null,
        data.calorias_kcal ?? null,
        data.proteinas_g ?? null,
        data.carbohidratos_g ?? null,
        data.grasas_g ?? null,
        data.fibra_g ?? null,
        data.notas ?? null,
      ]
    );
    return result.insertId;
  },

  async updateComida(comidaId: number, data: Partial<PlanComidaRow>): Promise<void> {
    await pool.query(
      `UPDATE plan_comidas SET
        dia=?, momento=?, descripcion=?, receta_id=?,
        calorias_kcal=?, proteinas_g=?, carbohidratos_g=?,
        grasas_g=?, fibra_g=?, notas=?
      WHERE id=?`,
      [
        data.dia,
        data.momento,
        data.descripcion,
        data.receta_id ?? null,
        data.calorias_kcal ?? null,
        data.proteinas_g ?? null,
        data.carbohidratos_g ?? null,
        data.grasas_g ?? null,
        data.fibra_g ?? null,
        data.notas ?? null,
        comidaId,
      ]
    );
  },

  async deleteComida(comidaId: number): Promise<void> {
    await pool.query("DELETE FROM plan_comidas WHERE id = ?", [comidaId]);
  },

  async findComidaById(comidaId: number): Promise<PlanComidaRow | null> {
    const [rows] = await pool.query<PlanComidaRow[]>(
      `SELECT pc.*, r.nombre as receta_nombre FROM plan_comidas pc
       LEFT JOIN recetas r ON pc.receta_id = r.id
       WHERE pc.id = ? LIMIT 1`,
      [comidaId]
    );
    return rows[0] ?? null;
  },
};