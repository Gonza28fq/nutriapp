/**
 * Análisis de impacto previo a migrar producción (MySQL → PostgreSQL + funciones nuevas).
 *
 *   MYSQL_URL=mysql://… npm run analisis-impacto -- [salida.md]
 *
 * SOLO LECTURA: la conexión a MySQL se abre en modo READ ONLY y solo se leen
 * cantidades e IDs. No se imprime ningún dato personal (nombres, DNI, teléfonos…).
 * Compara contra la base Postgres de destino (DATABASE_URL / .env) para verificar
 * que cada columna de producción tenga lugar en el esquema nuevo.
 */
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import mysql from "mysql2/promise";
import { Client } from "pg";

type Fila = Record<string, any>;
const salida: string[] = [];
const out = (s = "") => { salida.push(s); console.log(s); };
const ids = (rows: Fila[]) => rows.map((r) => r.id).slice(0, 15).join(", ") + (rows.length > 15 ? ` … (+${rows.length - 15})` : "");

// Valores permitidos en el esquema nuevo (CHECK de Postgres)
const ENUMS: Record<string, Record<string, string[]>> = {
  pacientes: { sexo: ["masculino", "femenino", "otro"], prioridad: ["normal", "alta", "urgente"] },
  turnos: { tipo: ["agendado", "espontaneo"], tipo_consulta: ["primera_vez", "control", "seguimiento"], estado: ["pendiente", "presente", "ausente", "cancelado"] },
  consultas: { tipo_consulta: ["primera_vez", "control", "seguimiento"] },
  planes: { estado: ["borrador", "activo", "vencido", "archivado"] },
  plan_comidas: { momento: ["desayuno", "almuerzo", "merienda", "cena", "colacion_am", "colacion_pm"] },
  recetas: { categoria: ["desayuno", "almuerzo", "merienda", "cena", "colacion", "postre", "otro"], dificultad: ["facil", "media", "dificil"] },
  usuarios: { rol: ["admin", "nutricionista"] },
  alimentos_paciente: { tipo: ["permitido", "prohibido", "limitado"] },
  adjuntos: { entidad: ["consulta", "plan", "laboratorio", "otro"] },
  blog_posts: { estado: ["borrador", "publicado", "archivado"] },
};

// Rangos de la validación nueva (si un valor viejo está afuera, al editar esa medición se va a rechazar)
const RANGOS: [string, string, number, number][] = [
  ["mediciones", "peso_kg", 1, 400], ["mediciones", "talla_cm", 30, 250],
  ["mediciones", "circunferencia_cintura_cm", 20, 250], ["mediciones", "circunferencia_cadera_cm", 20, 250],
  ["mediciones", "porcentaje_masa_grasa", 1, 80], ["mediciones", "porcentaje_masa_magra", 10, 99],
  ["mediciones", "presion_sistolica", 50, 300], ["mediciones", "presion_diastolica", 20, 200],
  ["mediciones", "frecuencia_cardiaca", 20, 250],
  ["laboratorios", "glucemia", 20, 800], ["laboratorios", "hemoglobina_glicosilada", 3, 20],
  ["laboratorios", "colesterol_total", 50, 600],
];

async function main() {
  if (!process.env.MYSQL_URL) throw new Error("Falta MYSQL_URL (base MySQL a analizar).");
  const u = new URL(process.env.MYSQL_URL);
  const local = ["localhost", "127.0.0.1"].includes(u.hostname);
  const my = await mysql.createConnection({
    host: u.hostname, port: Number(u.port || 3306), user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password), database: u.pathname.slice(1),
    dateStrings: true, ssl: local ? undefined : { rejectUnauthorized: false },
  });
  await my.query("SET SESSION TRANSACTION READ ONLY");
  const q = async (sql: string, p: unknown[] = []) => (await my.query<mysql.RowDataPacket[]>(sql, p))[0] as Fila[];

  const pg = new Client(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined);
  await pg.connect();

  out(`# Análisis de impacto — ${new Date().toLocaleString("es-AR")}`);
  out(`Origen: MySQL \`${u.pathname.slice(1)}\` (${local ? "local" : "remoto"}, solo lectura) · Destino de referencia: Postgres \`${(await pg.query("select current_database() d")).rows[0].d}\``);

  // ── 1. Esquema ──────────────────────────────────────────────────────────
  out("\n## 1. Esquema: ¿cada columna de producción tiene lugar en la base nueva?");
  // Solo tablas reales (no vistas) y que tengan columna id (para poder listar ids)
  const colsMy = await q("SELECT c.table_name t, c.column_name c, c.column_type ty, c.data_type dt FROM information_schema.columns c JOIN information_schema.tables tb ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name AND tb.table_type = 'BASE TABLE' WHERE c.table_schema = DATABASE() ORDER BY c.table_name, c.ordinal_position");
  const conId = new Set(colsMy.filter((r) => r.c === "id").map((r) => r.t));
  const colsPg = (await pg.query("SELECT table_name t, column_name c FROM information_schema.columns WHERE table_schema = current_schema()")).rows;
  const enPg = new Set(colsPg.map((r) => `${r.t}.${r.c}`));
  const tablasPg = new Set(colsPg.map((r) => r.t));
  const tablasMy = [...new Set(colsMy.map((r) => r.t))];
  const sinLugar = colsMy.filter((r) => tablasPg.has(r.t) && !enPg.has(`${r.t}.${r.c}`));
  const tablasSinLugar = tablasMy.filter((t) => !tablasPg.has(t));
  out(`- Tablas en producción: ${tablasMy.length}`);
  out(tablasSinLugar.length ? `- ⚠️ Tablas SIN equivalente en Postgres (no se copiarían): ${tablasSinLugar.join(", ")}` : "- ✅ Todas las tablas tienen equivalente.");
  out(sinLugar.length ? `- ⚠️ Columnas sin lugar (se perderían): ${sinLugar.map((r) => `${r.t}.${r.c}`).join(", ")}` : "- ✅ Todas las columnas tienen lugar en el esquema nuevo.");

  // ── 2. Volumen ──────────────────────────────────────────────────────────
  out("\n## 2. Volumen de datos");
  for (const t of tablasMy) {
    const [{ n }] = await q(`SELECT COUNT(*) n FROM \`${t}\``);
    out(`- ${t}: ${n}`);
  }

  // ── 3. Riesgos de migración ─────────────────────────────────────────────
  out("\n## 3. Riesgos de migración (valores que Postgres rechazaría)");
  let riesgos = 0;
  for (const [t, cols] of Object.entries(ENUMS)) {
    if (!tablasMy.includes(t)) continue;
    for (const [c, permitidos] of Object.entries(cols)) {
      if (!colsMy.some((r) => r.t === t && r.c === c)) continue;
      const malos = await q(`SELECT id, \`${c}\` v FROM \`${t}\` WHERE \`${c}\` IS NOT NULL AND \`${c}\` NOT IN (${permitidos.map(() => "?").join(",")})`, permitidos);
      if (malos.length) { riesgos++; out(`- ⚠️ ${t}.${c}: ${malos.length} valor(es) fuera de la lista (${[...new Set(malos.map((m) => JSON.stringify(m.v)))].join(", ")}) · ids: ${ids(malos)}`); }
    }
  }
  for (const r of colsMy.filter((x) => conId.has(x.t) && ["date", "datetime", "timestamp"].includes(x.dt))) {
    const malos = await q(`SELECT id FROM \`${r.t}\` WHERE \`${r.c}\` IS NOT NULL AND (CAST(\`${r.c}\` AS CHAR) LIKE '0000%' OR YEAR(\`${r.c}\`) < 1900)`);
    if (malos.length) { riesgos++; out(`- ⚠️ ${r.t}.${r.c}: ${malos.length} fecha(s) inválidas (0000-00-00 o antes de 1900) · ids: ${ids(malos)}`); }
  }
  for (const r of colsMy.filter((x) => conId.has(x.t) && x.ty === "tinyint(1)")) {
    const malos = await q(`SELECT id FROM \`${r.t}\` WHERE \`${r.c}\` NOT IN (0, 1)`);
    if (malos.length) { riesgos++; out(`- ⚠️ ${r.t}.${r.c}: ${malos.length} valor(es) sí/no distintos de 0/1 · ids: ${ids(malos)}`); }
  }
  if (!riesgos) out("- ✅ No se encontraron valores que Postgres rechace.");

  // ── 4. Calidad de datos para las funciones nuevas ───────────────────────
  out("\n## 4. Pacientes activos: qué les falta para las funciones nuevas");
  const [{ activos }] = await q("SELECT COUNT(*) activos FROM pacientes WHERE activo = 1");
  out(`- Pacientes activos: **${activos}**`);
  const faltan: [string, string][] = [
    ["Sin ninguna medición (no tienen progreso ni IMC)", "NOT EXISTS (SELECT 1 FROM mediciones m WHERE m.paciente_id = p.id)"],
    ["Con mediciones pero sin talla en ninguna (no se puede calcular IMC → no se detecta sobrepeso/obesidad)", "EXISTS (SELECT 1 FROM mediciones m WHERE m.paciente_id = p.id) AND NOT EXISTS (SELECT 1 FROM mediciones m WHERE m.paciente_id = p.id AND m.talla_cm IS NOT NULL)"],
    ["Con peso y talla pero sin IMC guardado (se recalcula al editar)", "EXISTS (SELECT 1 FROM mediciones m WHERE m.paciente_id = p.id AND m.peso_kg IS NOT NULL AND m.talla_cm IS NOT NULL AND m.imc IS NULL)"],
    ["Sin sexo cargado (la silueta usa la forma femenina por defecto)", "p.sexo IS NULL OR p.sexo = ''"],
    ["Sin fecha de nacimiento ni edad", "p.fecha_nacimiento IS NULL AND p.edad IS NULL"],
    ["Sin historia clínica", "NOT EXISTS (SELECT 1 FROM historia_clinica h WHERE h.paciente_id = p.id)"],
    ["Sin anamnesis", "NOT EXISTS (SELECT 1 FROM anamnesis_alimentaria a WHERE a.paciente_id = p.id)"],
    ["Sin ninguna consulta", "NOT EXISTS (SELECT 1 FROM consultas c WHERE c.paciente_id = p.id)"],
    ["Sin celular (no tienen botón de WhatsApp)", "p.celular IS NULL OR p.celular = ''"],
  ];
  for (const [et, cond] of faltan) {
    const filas = await q(`SELECT p.id FROM pacientes p WHERE p.activo = 1 AND (${cond})`);
    out(`- ${et}: **${filas.length}**${filas.length ? ` · ids: ${ids(filas)}` : ""}`);
  }
  const [{ conLab }] = await q("SELECT COUNT(DISTINCT paciente_id) conLab FROM laboratorios");
  out(`- Con al menos un laboratorio cargado (glucemia, etc.): ${conLab} — los perímetros corporales y los estudios son funciones nuevas, nadie los tiene todavía.`);

  out("\n## 5. Mediciones viejas fuera de los rangos de la validación nueva");
  out("No impiden la migración ni se modifican; solo que si se edita esa medición, el formulario va a pedir corregir el valor.");
  let fuera = 0;
  for (const [t, c, min, max] of RANGOS) {
    if (!colsMy.some((r) => r.t === t && r.c === c)) continue;
    const malos = await q(`SELECT id FROM \`${t}\` WHERE \`${c}\` IS NOT NULL AND (\`${c}\` < ? OR \`${c}\` > ?)`, [min, max]);
    if (malos.length) { fuera += malos.length; out(`- ${t}.${c} fuera de ${min}–${max}: ${malos.length} · ids: ${ids(malos)}`); }
  }
  if (!fuera) out("- ✅ Ninguna.");

  // ── 6. Vista previa de patologías automáticas ───────────────────────────
  out("\n## 6. Vista previa: pacientes activos que aparecerán en cada patología al migrar");
  const ultimoImc = await q(`
    SELECT m.paciente_id, m.imc FROM mediciones m
    JOIN pacientes p ON p.id = m.paciente_id AND p.activo = 1
    WHERE m.imc IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM mediciones m2 WHERE m2.paciente_id = m.paciente_id AND m2.imc IS NOT NULL
        AND (m2.fecha > m.fecha OR (m2.fecha = m.fecha AND m2.id > m.id)))`);
  const sobre = ultimoImc.filter((r) => r.imc >= 25 && r.imc < 30).length;
  const ob = ultimoImc.filter((r) => r.imc >= 30);
  out(`- Sobrepeso (IMC 25–29,9): ${sobre}`);
  out(`- Obesidad (IMC ≥ 30): ${ob.length} (grado I: ${ob.filter((r) => r.imc < 35).length}, II: ${ob.filter((r) => r.imc >= 35 && r.imc < 40).length}, III: ${ob.filter((r) => r.imc >= 40).length})`);
  const flags: [string, string][] = [["Diabetes tipo 1", "tiene_diabetes_1"], ["Diabetes tipo 2", "tiene_diabetes_2"], ["Hipertensión (HTA)", "tiene_hipertension"], ["Dislipemia", "tiene_dislipemia"], ["Hipotiroidismo", "tiene_hipotiroidismo"], ["Celiaquía", "tiene_celiaquia"]];
  for (const [et, col] of flags) {
    const [{ n }] = await q(`SELECT COUNT(*) n FROM historia_clinica h JOIN pacientes p ON p.id = h.paciente_id AND p.activo = 1 WHERE h.\`${col}\` = 1`);
    out(`- ${et} (desde historia clínica): ${n}`);
  }

  await my.end();
  await pg.end();
  const destino = process.argv[2];
  if (destino) { fs.writeFileSync(destino, salida.join("\n") + "\n"); console.log(`\n(Informe guardado en ${destino})`); }
}

main().catch((e) => { console.error("❌", e instanceof Error ? e.message : e); process.exit(1); });
