/**
 * Módulo clínico: patologías, progreso, laboratorios, estudios y mediciones.
 * Todas las escrituras usan listas blancas de columnas: solo llegan al SQL los
 * campos declarados acá, nunca claves arbitrarias del body.
 */
import pool from "../config/database";
import { calcularIMC } from "../utils/helpers";

type Datos = Record<string, unknown>;

// ── Listas blancas ────────────────────────────────────────────────────────
export const CAMPOS_MEDICION = [
  "fecha", "consulta_id", "peso_kg", "talla_cm",
  "circunferencia_cintura_cm", "circunferencia_cadera_cm",
  "perimetro_cuello_cm", "perimetro_brazo_cm", "perimetro_torax_cm", "perimetro_abdomen_cm",
  "perimetro_muslo_cm", "perimetro_pantorrilla_cm",
  "porcentaje_masa_grasa", "porcentaje_masa_magra", "masa_muscular_kg",
  "grasa_visceral_nivel", "agua_corporal_pct",
  "presion_sistolica", "presion_diastolica", "frecuencia_cardiaca",
  "peso_habitual_kg", "peso_posible_kg", "notas",
] as const;

export const CAMPOS_LABORATORIO = [
  "fecha", "consulta_id", "glucemia", "hemoglobina_glicosilada", "insulina", "homa_ir",
  "colesterol_total", "hdl", "ldl", "vldl", "trigliceridos",
  "creatinina", "urea", "acido_urico", "tsh", "t3", "t4",
  "hemoglobina", "hematocrito", "ferritina", "vitamina_d", "vitamina_b12", "otros", "notas",
] as const;

export const CAMPOS_ESTUDIO = [
  "fecha", "consulta_id", "laboratorio_id", "tipo", "nombre", "lugar", "solicitado_por", "resultado_resumen",
] as const;

const elegir = (data: Datos, campos: readonly string[]) =>
  campos.filter((c) => data[c] !== undefined).map((c) => [c, data[c] === "" ? null : data[c]] as const);

async function insertar(tabla: string, pacienteId: number, data: Datos, campos: readonly string[]): Promise<number> {
  const pares = elegir(data, campos);
  const cols = ["paciente_id", ...pares.map(([c]) => c)];
  const [r] = await pool.query<{ insertId: number }>(
    `INSERT INTO ${tabla} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    [pacienteId, ...pares.map(([, v]) => v)]
  );
  return r.insertId;
}

async function actualizar(tabla: string, id: number, data: Datos, campos: readonly string[]): Promise<boolean> {
  const pares = elegir(data, campos);
  if (!pares.length) return true;
  const [r] = await pool.query<{ affectedRows: number }>(
    `UPDATE ${tabla} SET ${pares.map(([c]) => `${c} = ?`).join(", ")} WHERE id = ?`,
    [...pares.map(([, v]) => v), id]
  );
  return r.affectedRows > 0;
}

async function borrar(tabla: string, id: number): Promise<boolean> {
  const [r] = await pool.query<{ affectedRows: number }>(`DELETE FROM ${tabla} WHERE id = ?`, [id]);
  return r.affectedRows > 0;
}

/** Completa IMC, clasificación e índice cintura/cadera a partir de lo cargado. */
function derivarMedicion(data: Datos): Datos {
  const d = { ...data };
  const peso = Number(d.peso_kg);
  const talla = Number(d.talla_cm);
  if (peso > 0 && talla > 0) {
    const { imc, clasificacion } = calcularIMC(peso, talla);
    d.imc = imc;
    d.clasificacion_imc = clasificacion;
  }
  const cintura = Number(d.circunferencia_cintura_cm);
  const cadera = Number(d.circunferencia_cadera_cm);
  if (cintura > 0 && cadera > 0) d.indice_cintura_cadera = Math.round((cintura / cadera) * 1000) / 1000;
  return d;
}
const CAMPOS_MEDICION_CON_DERIVADOS = [...CAMPOS_MEDICION, "imc", "clasificacion_imc", "indice_cintura_cadera"];

export const ClinicaModel = {
  // ── Patologías ──────────────────────────────────────────────────────────
  /** Catálogo con la cantidad de pacientes activos que tienen cada patología. */
  async catalogoPatologias() {
    const [rows] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.sigla, p.categoria, p.color, p.orden,
              count(DISTINCT v.paciente_id) FILTER (WHERE pa.activo) AS pacientes
       FROM patologias p
       LEFT JOIN v_paciente_patologias v ON v.patologia_id = p.id
       LEFT JOIN pacientes pa ON pa.id = v.paciente_id
       WHERE p.activa
       GROUP BY p.id
       ORDER BY p.orden, p.nombre`
    );
    return rows;
  },

  /** Pacientes activos con una patología, con su último peso/IMC para la lista. */
  async pacientesConPatologia(codigo: string) {
    const [rows] = await pool.query(
      `SELECT pa.id, pa.nombre, pa.apellido, pa.edad, pa.sexo, pa.celular, pa.prioridad,
              v.grado, v.origen, v.fecha_diagnostico,
              um.fecha AS ultima_medicion, um.peso_kg, um.imc
       FROM v_paciente_patologias v
       JOIN pacientes pa ON pa.id = v.paciente_id AND pa.activo
       LEFT JOIN LATERAL (
         SELECT fecha, peso_kg, imc FROM mediciones m
         WHERE m.paciente_id = pa.id ORDER BY m.fecha DESC, m.id DESC LIMIT 1
       ) um ON true
       WHERE v.codigo = ?
       ORDER BY pa.apellido, pa.nombre`,
      [codigo]
    );
    return rows;
  },

  async patologiasDePaciente(pacienteId: number) {
    const [rows] = await pool.query(
      `SELECT v.*, pp.id AS registro_id, pp.notas
       FROM v_paciente_patologias v
       LEFT JOIN paciente_patologias pp ON pp.paciente_id = v.paciente_id AND pp.patologia_id = v.patologia_id
       WHERE v.paciente_id = ?
       ORDER BY v.categoria, v.nombre`,
      [pacienteId]
    );
    return rows;
  },

  /** Alta o edición manual. `activa: false` sirve para descartar una detectada automáticamente. */
  async guardarPatologia(pacienteId: number, patologiaId: number, data: Datos) {
    await pool.query(
      `INSERT INTO paciente_patologias (paciente_id, patologia_id, grado, fecha_diagnostico, activa, notas)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (paciente_id, patologia_id) DO UPDATE SET
         grado = EXCLUDED.grado, fecha_diagnostico = EXCLUDED.fecha_diagnostico,
         activa = EXCLUDED.activa, notas = EXCLUDED.notas`,
      [pacienteId, patologiaId, data.grado ?? null, data.fecha_diagnostico || null,
       data.activa === undefined ? true : Boolean(data.activa), data.notas ?? null]
    );
  },

  /** Borra la carga manual: la patología vuelve a depender de la historia clínica / IMC. */
  async quitarPatologiaManual(pacienteId: number, patologiaId: number) {
    await pool.query("DELETE FROM paciente_patologias WHERE paciente_id = ? AND patologia_id = ?", [pacienteId, patologiaId]);
  },

  // ── Progreso (series para los gráficos) ─────────────────────────────────
  async progreso(pacienteId: number) {
    const [mediciones] = await pool.query(
      `SELECT id, fecha, peso_kg, talla_cm, imc, clasificacion_imc,
              porcentaje_masa_grasa, porcentaje_masa_magra, masa_muscular_kg, grasa_visceral_nivel, agua_corporal_pct,
              circunferencia_cintura_cm, circunferencia_cadera_cm, indice_cintura_cadera,
              perimetro_cuello_cm, perimetro_brazo_cm, perimetro_torax_cm, perimetro_abdomen_cm,
              perimetro_muslo_cm, perimetro_pantorrilla_cm,
              presion_sistolica, presion_diastolica
       FROM mediciones WHERE paciente_id = ? ORDER BY fecha ASC, id ASC`,
      [pacienteId]
    );
    const [laboratorios] = await pool.query(
      `SELECT id, fecha, glucemia, hemoglobina_glicosilada, insulina, homa_ir,
              colesterol_total, hdl, ldl, trigliceridos
       FROM laboratorios WHERE paciente_id = ? ORDER BY fecha ASC, id ASC`,
      [pacienteId]
    );
    return { mediciones, laboratorios };
  },

  // ── Mediciones ──────────────────────────────────────────────────────────
  crearMedicion: (pacienteId: number, data: Datos) =>
    insertar("mediciones", pacienteId, derivarMedicion(data), CAMPOS_MEDICION_CON_DERIVADOS),
  async actualizarMedicion(id: number, data: Datos) {
    // Para recalcular IMC/ICC hace falta combinar con lo que ya estaba guardado
    const [[actual]] = await pool.query<Datos[]>("SELECT * FROM mediciones WHERE id = ?", [id]);
    if (!actual) return false;
    return actualizar("mediciones", id, derivarMedicion({ ...actual, ...data }), CAMPOS_MEDICION_CON_DERIVADOS);
  },
  borrarMedicion: (id: number) => borrar("mediciones", id),

  // ── Laboratorios ────────────────────────────────────────────────────────
  async laboratorios(pacienteId: number) {
    const [rows] = await pool.query("SELECT * FROM laboratorios WHERE paciente_id = ? ORDER BY fecha DESC, id DESC", [pacienteId]);
    return rows;
  },
  crearLaboratorio: (pacienteId: number, data: Datos) => insertar("laboratorios", pacienteId, data, CAMPOS_LABORATORIO),
  actualizarLaboratorio: (id: number, data: Datos) => actualizar("laboratorios", id, data, CAMPOS_LABORATORIO),
  borrarLaboratorio: (id: number) => borrar("laboratorios", id),

  // ── Estudios ────────────────────────────────────────────────────────────
  async estudios(pacienteId: number) {
    const [rows] = await pool.query("SELECT * FROM estudios WHERE paciente_id = ? ORDER BY fecha DESC, id DESC", [pacienteId]);
    return rows;
  },
  crearEstudio: (pacienteId: number, data: Datos) => insertar("estudios", pacienteId, data, CAMPOS_ESTUDIO),
  actualizarEstudio: (id: number, data: Datos) => actualizar("estudios", id, data, CAMPOS_ESTUDIO),
  borrarEstudio: (id: number) => borrar("estudios", id),
};
