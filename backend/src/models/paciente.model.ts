import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface PacienteRow extends RowDataPacket {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  fecha_nacimiento?: string;
  edad?: number;
  sexo?: string;
  email?: string;
  celular?: string;
  domicilio?: string;
  localidad?: string;
  derivado_por?: string;
  activo: boolean;
  observaciones_generales?: string;
  prioridad?: "normal" | "alta" | "urgente";
  motivo_prioridad?: string;
  creado_en: string;
  actualizado_en: string;
}

export const PacienteModel = {

  async findAll(busqueda?: string, pagina = 1, limite = 20, soloActivos = true) {
    const offset = (pagina - 1) * limite;
    const filtroActivo = soloActivos ? "activo = TRUE" : "activo = FALSE";

    let query = `SELECT id, nombre, apellido, dni, edad, sexo, celular, localidad, activo, prioridad, creado_en FROM pacientes`;
    const params: unknown[] = [];

    if (busqueda && busqueda.trim() !== "") {
      query += ` WHERE ${filtroActivo} AND MATCH(nombre, apellido, dni, celular) AGAINST (? IN BOOLEAN MODE)`;
      params.push(`${busqueda}*`);
    } else {
      query += ` WHERE ${filtroActivo}`;
    }

    query += " ORDER BY apellido ASC, nombre ASC LIMIT ? OFFSET ?";
    params.push(limite, offset);

    const [rows] = await pool.query<PacienteRow[]>(query, params);

    const countQuery = busqueda && busqueda.trim() !== ""
      ? `SELECT COUNT(*) as total FROM pacientes WHERE ${filtroActivo} AND MATCH(nombre, apellido, dni, celular) AGAINST (? IN BOOLEAN MODE)`
      : `SELECT COUNT(*) as total FROM pacientes WHERE ${filtroActivo}`;

    const [[{ total }]] = await pool.query<(RowDataPacket & { total: number })[]>(
      countQuery,
      busqueda && busqueda.trim() !== "" ? [`${busqueda}*`] : []
    );

    return { items: rows, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
  },

  async findById(id: number): Promise<PacienteRow | null> {
    const [rows] = await pool.query<PacienteRow[]>(
      "SELECT * FROM pacientes WHERE id = ? LIMIT 1", [id]
    );
    return rows[0] ?? null;
  },

  async findByDni(dni: string): Promise<PacienteRow | null> {
    const [rows] = await pool.query<PacienteRow[]>(
      "SELECT * FROM pacientes WHERE dni = ? LIMIT 1", [dni]
    );
    return rows[0] ?? null;
  },

  async create(data: Partial<PacienteRow>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO pacientes
        (nombre, apellido, dni, fecha_nacimiento, edad, sexo, email, celular,
         domicilio, localidad, derivado_por, observaciones_generales,
         prioridad, motivo_prioridad)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre, data.apellido, data.dni ?? null, data.fecha_nacimiento ?? null,
        data.edad ?? null, data.sexo ?? null, data.email ?? null, data.celular ?? null,
        data.domicilio ?? null, data.localidad ?? null, data.derivado_por ?? null,
        data.observaciones_generales ?? null,
        data.prioridad ?? "normal", data.motivo_prioridad ?? null,
      ]
    );
    return result.insertId;
  },

  async update(id: number, data: Partial<PacienteRow>): Promise<void> {
    await pool.query(
      `UPDATE pacientes SET
        nombre = ?, apellido = ?, dni = ?, fecha_nacimiento = ?, edad = ?,
        sexo = ?, email = ?, celular = ?, domicilio = ?, localidad = ?,
        derivado_por = ?, observaciones_generales = ?,
        prioridad = ?, motivo_prioridad = ?
       WHERE id = ?`,
      [
        data.nombre, data.apellido, data.dni ?? null, data.fecha_nacimiento ?? null,
        data.edad ?? null, data.sexo ?? null, data.email ?? null, data.celular ?? null,
        data.domicilio ?? null, data.localidad ?? null, data.derivado_por ?? null,
        data.observaciones_generales ?? null,
        data.prioridad ?? "normal", data.motivo_prioridad ?? null,
        id,
      ]
    );
  },

  async desactivar(id: number): Promise<void> {
    await pool.query("UPDATE pacientes SET activo = FALSE WHERE id = ?", [id]);
  },

  async reactivar(id: number): Promise<void> {
    await pool.query("UPDATE pacientes SET activo = TRUE WHERE id = ?", [id]);
  },

  async getHistoriaClinica(pacienteId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM historia_clinica WHERE paciente_id = ? LIMIT 1", [pacienteId]
    );
    return rows[0] ?? null;
  },

  async upsertHistoriaClinica(pacienteId: number, data: Record<string, unknown>): Promise<void> {
    const existing = await this.getHistoriaClinica(pacienteId);
    if (existing) {
      const campos = Object.keys(data).map(k => `${k} = ?`).join(", ");
      await pool.query(`UPDATE historia_clinica SET ${campos} WHERE paciente_id = ?`, [...Object.values(data), pacienteId]);
    } else {
      const campos = ["paciente_id", ...Object.keys(data)].join(", ");
      const valores = "?, ".repeat(Object.keys(data).length + 1).slice(0, -2);
      await pool.query(`INSERT INTO historia_clinica (${campos}) VALUES (${valores})`, [pacienteId, ...Object.values(data)]);
    }
  },

  async getAnamnesis(pacienteId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM anamnesis_alimentaria WHERE paciente_id = ? LIMIT 1", [pacienteId]
    );
    return rows[0] ?? null;
  },

  async upsertAnamnesis(pacienteId: number, data: Record<string, unknown>): Promise<void> {
    const existing = await this.getAnamnesis(pacienteId);
    if (existing) {
      const campos = Object.keys(data).map(k => `${k} = ?`).join(", ");
      await pool.query(`UPDATE anamnesis_alimentaria SET ${campos} WHERE paciente_id = ?`, [...Object.values(data), pacienteId]);
    } else {
      const campos = ["paciente_id", ...Object.keys(data)].join(", ");
      const valores = "?, ".repeat(Object.keys(data).length + 1).slice(0, -2);
      await pool.query(`INSERT INTO anamnesis_alimentaria (${campos}) VALUES (${valores})`, [pacienteId, ...Object.values(data)]);
    }
  },
};