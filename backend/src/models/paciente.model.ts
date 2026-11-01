import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "../config/db-types";

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

// Columnas reales de cada tabla (se leen una vez). Solo se aceptan claves que
// existan en la tabla: así un campo inventado en el body no llega al SQL.
const columnasCache = new Map<string, Set<string>>();
async function columnasDe(tabla: string): Promise<Set<string>> {
  if (!columnasCache.has(tabla)) {
    const [rows] = await pool.query<{ column_name: string }[]>(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?",
      [tabla]
    );
    columnasCache.set(tabla, new Set(rows.map((r) => r.column_name)));
  }
  return columnasCache.get(tabla)!;
}

/** Inserta o actualiza la fila 1:1 de un paciente (historia clínica, anamnesis). */
async function upsertPorPaciente(tabla: "historia_clinica" | "anamnesis_alimentaria", pacienteId: number, data: Record<string, unknown>) {
  const validas = await columnasDe(tabla);
  const campos = Object.keys(data).filter((k) => validas.has(k) && k !== "id" && k !== "paciente_id");
  const valores = campos.map((k) => data[k]);
  const cols = ["paciente_id", ...campos].map((c) => `"${c}"`).join(", ");
  const marcas = ["?", ...campos.map(() => "?")].join(", ");
  const update = campos.length
    ? `DO UPDATE SET ${campos.map((c) => `"${c}" = EXCLUDED."${c}"`).join(", ")}`
    : "DO NOTHING";
  await pool.query(
    `INSERT INTO ${tabla} (${cols}) VALUES (${marcas}) ON CONFLICT (paciente_id) ${update}`,
    [pacienteId, ...valores]
  );
}

export const PacienteModel = {

  async findAll(busqueda?: string, pagina = 1, limite = 20, soloActivos = true) {
    const offset = (pagina - 1) * limite;
    const where: string[] = [soloActivos ? "activo = TRUE" : "activo = FALSE"];
    const params: unknown[] = [];

    // Cada palabra tiene que aparecer en nombre, apellido, DNI o celular
    // (sin distinguir mayúsculas ni tildes: "maria gonz" encuentra a "María González").
    const palabras = (busqueda ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 5);
    for (const p of palabras) {
      where.push(`unaccent(concat_ws(' ', nombre, apellido, dni, celular)) ILIKE unaccent(?)`);
      params.push(`%${p.replace(/[%_\\]/g, "\\$&")}%`);
    }
    const filtro = `WHERE ${where.join(" AND ")}`;

    const [rows] = await pool.query<PacienteRow[]>(
      `SELECT id, nombre, apellido, dni, edad, sexo, celular, localidad, activo, prioridad, creado_en
       FROM pacientes ${filtro}
       ORDER BY apellido ASC, nombre ASC LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    const [[{ total }]] = await pool.query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM pacientes ${filtro}`, params
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
    await upsertPorPaciente("historia_clinica", pacienteId, data);
  },

  async getAnamnesis(pacienteId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM anamnesis_alimentaria WHERE paciente_id = ? LIMIT 1", [pacienteId]
    );
    return rows[0] ?? null;
  },

  async upsertAnamnesis(pacienteId: number, data: Record<string, unknown>): Promise<void> {
    await upsertPorPaciente("anamnesis_alimentaria", pacienteId, data);
  },
};