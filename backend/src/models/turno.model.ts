import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface TurnoRow extends RowDataPacket {
  id: number;
  paciente_id?: number;
  sede_id: number;
  fecha: string;
  hora?: string;
  tipo: "agendado" | "espontaneo";
  tipo_consulta: "primera_vez" | "control" | "seguimiento";
  estado: "pendiente" | "presente" | "ausente" | "cancelado";
  notas_turno?: string;
  creado_en: string;
  // Joins
  paciente_nombre?: string;
  paciente_apellido?: string;
  sede_nombre?: string;
}

export const TurnoModel = {

  async findByFecha(fecha: string, sedeId?: number) {
    let query = `
      SELECT t.*,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        s.nombre as sede_nombre
      FROM turnos t
      LEFT JOIN pacientes p ON t.paciente_id = p.id
      LEFT JOIN sedes s ON t.sede_id = s.id
      WHERE t.fecha = ?
    `;
    const params: unknown[] = [fecha];

    if (sedeId) {
      query += " AND t.sede_id = ?";
      params.push(sedeId);
    }

    query += " ORDER BY t.hora ASC, t.id ASC";
    const [rows] = await pool.query<TurnoRow[]>(query, params);
    return rows;
  },

  async findByRango(fechaInicio: string, fechaFin: string, sedeId?: number) {
    let query = `
      SELECT t.*,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        s.nombre as sede_nombre
      FROM turnos t
      LEFT JOIN pacientes p ON t.paciente_id = p.id
      LEFT JOIN sedes s ON t.sede_id = s.id
      WHERE t.fecha BETWEEN ? AND ?
    `;
    const params: unknown[] = [fechaInicio, fechaFin];

    if (sedeId) {
      query += " AND t.sede_id = ?";
      params.push(sedeId);
    }

    query += " ORDER BY t.fecha ASC, t.hora ASC";
    const [rows] = await pool.query<TurnoRow[]>(query, params);
    return rows;
  },

  async countByFecha(fecha: string, sedeId: number): Promise<number> {
    const [[{ total }]] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) as total FROM turnos
       WHERE fecha = ? AND sede_id = ? AND estado != 'cancelado'`,
      [fecha, sedeId]
    );
    return total;
  },

  async findById(id: number): Promise<TurnoRow | null> {
    const [rows] = await pool.query<TurnoRow[]>(
      `SELECT t.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
              s.nombre as sede_nombre
       FROM turnos t
       LEFT JOIN pacientes p ON t.paciente_id = p.id
       LEFT JOIN sedes s ON t.sede_id = s.id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create(data: Partial<TurnoRow>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO turnos (paciente_id, sede_id, fecha, hora, tipo, tipo_consulta, estado, notas_turno)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.paciente_id ?? null,
        data.sede_id,
        data.fecha,
        data.hora ?? null,
        data.tipo ?? "agendado",
        data.tipo_consulta ?? "primera_vez",
        data.estado ?? "pendiente",
        data.notas_turno ?? null,
      ]
    );
    return result.insertId;
  },

  async updateEstado(id: number, estado: string): Promise<void> {
    await pool.query(
      "UPDATE turnos SET estado = ? WHERE id = ?",
      [estado, id]
    );
  },

  async update(id: number, data: Partial<TurnoRow>): Promise<void> {
    await pool.query(
      `UPDATE turnos SET paciente_id = ?, sede_id = ?, fecha = ?, hora = ?,
       tipo = ?, tipo_consulta = ?, estado = ?, notas_turno = ? WHERE id = ?`,
      [
        data.paciente_id ?? null,
        data.sede_id,
        data.fecha,
        data.hora ?? null,
        data.tipo,
        data.tipo_consulta,
        data.estado,
        data.notas_turno ?? null,
        id,
      ]
    );
  },

  async delete(id: number): Promise<void> {
    await pool.query("DELETE FROM turnos WHERE id = ?", [id]);
  },
};