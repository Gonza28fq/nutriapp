import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface ConsultaRow extends RowDataPacket {
  id: number;
  paciente_id: number;
  turno_id?: number;
  fecha: string;
  sede_id?: number;
  tipo_consulta: "primera_vez" | "control" | "seguimiento";
  motivo_consulta?: string;
  problemas?: string;
  objetivos?: string;
  observaciones?: string;
  indicaciones?: string;
  proximo_control?: string;
  creado_en: string;
  sede_nombre?: string;
  // joins para listar
  paciente_nombre?: string;
  paciente_apellido?: string;
}

export interface MedicionRow extends RowDataPacket {
  id: number;
  paciente_id: number;
  consulta_id?: number;
  fecha: string;
  peso_kg?: number;
  talla_cm?: number;
  imc?: number;
  clasificacion_imc?: string;
  circunferencia_cintura_cm?: number;
  circunferencia_cadera_cm?: number;
  porcentaje_masa_grasa?: number;
  porcentaje_masa_magra?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  peso_habitual_kg?: number;
  peso_posible_kg?: number;
  notas?: string;
}

export const ConsultaModel = {

  async findAll(limite = 50): Promise<ConsultaRow[]> {
    const [rows] = await pool.query<ConsultaRow[]>(
      `SELECT c.*,
        p.nombre as paciente_nombre, p.apellido as paciente_apellido,
        s.nombre as sede_nombre
       FROM consultas c
       LEFT JOIN pacientes p ON c.paciente_id = p.id
       LEFT JOIN sedes s ON c.sede_id = s.id
       ORDER BY c.fecha DESC, c.id DESC
       LIMIT ?`,
      [limite]
    );
    return rows;
  },

  async findByPaciente(pacienteId: number) {
    const [rows] = await pool.query<ConsultaRow[]>(
      `SELECT c.*, s.nombre as sede_nombre
       FROM consultas c
       LEFT JOIN sedes s ON c.sede_id = s.id
       WHERE c.paciente_id = ?
       ORDER BY c.fecha DESC, c.id DESC`,
      [pacienteId]
    );
    return rows;
  },

  async findById(id: number): Promise<ConsultaRow | null> {
    const [rows] = await pool.query<ConsultaRow[]>(
      `SELECT c.*, s.nombre as sede_nombre
       FROM consultas c
       LEFT JOIN sedes s ON c.sede_id = s.id
       WHERE c.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create(data: Partial<ConsultaRow>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO consultas
        (paciente_id, turno_id, fecha, sede_id, tipo_consulta,
         motivo_consulta, problemas, objetivos, observaciones, indicaciones, proximo_control)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.paciente_id,
        data.turno_id       ?? null,
        data.fecha,
        data.sede_id        ?? null,
        data.tipo_consulta  ?? "control",
        data.motivo_consulta ?? null,
        data.problemas      ?? null,
        data.objetivos      ?? null,
        data.observaciones  ?? null,
        data.indicaciones   ?? null,
        data.proximo_control ?? null,
      ]
    );
    return result.insertId;
  },

  async update(id: number, data: Partial<ConsultaRow>): Promise<void> {
    await pool.query(
      `UPDATE consultas SET
        fecha = ?, sede_id = ?, tipo_consulta = ?,
        motivo_consulta = ?, problemas = ?, objetivos = ?,
        observaciones = ?, indicaciones = ?, proximo_control = ?
       WHERE id = ?`,
      [
        data.fecha,
        data.sede_id        ?? null,
        data.tipo_consulta,
        data.motivo_consulta ?? null,
        data.problemas      ?? null,
        data.objetivos      ?? null,
        data.observaciones  ?? null,
        data.indicaciones   ?? null,
        data.proximo_control ?? null,
        id,
      ]
    );
  },

  async delete(id: number): Promise<void> {
    await pool.query("DELETE FROM consultas WHERE id = ?", [id]);
  },

  // Mediciones
  async getMedicionesByPaciente(pacienteId: number) {
    const [rows] = await pool.query<MedicionRow[]>(
      `SELECT * FROM mediciones
       WHERE paciente_id = ?
       ORDER BY fecha DESC, id DESC`,
      [pacienteId]
    );
    return rows;
  },

  async createMedicion(data: Partial<MedicionRow>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO mediciones
        (paciente_id, consulta_id, fecha, peso_kg, talla_cm, imc, clasificacion_imc,
         circunferencia_cintura_cm, circunferencia_cadera_cm,
         porcentaje_masa_grasa, porcentaje_masa_magra,
         presion_sistolica, presion_diastolica, frecuencia_cardiaca,
         peso_habitual_kg, peso_posible_kg, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.paciente_id,
        data.consulta_id        ?? null,
        data.fecha,
        data.peso_kg            ?? null,
        data.talla_cm           ?? null,
        data.imc                ?? null,
        data.clasificacion_imc  ?? null,
        data.circunferencia_cintura_cm ?? null,
        data.circunferencia_cadera_cm  ?? null,
        data.porcentaje_masa_grasa     ?? null,
        data.porcentaje_masa_magra     ?? null,
        data.presion_sistolica  ?? null,
        data.presion_diastolica ?? null,
        data.frecuencia_cardiaca ?? null,
        data.peso_habitual_kg   ?? null,
        data.peso_posible_kg    ?? null,
        data.notas              ?? null,
      ]
    );
    return result.insertId;
  },
};